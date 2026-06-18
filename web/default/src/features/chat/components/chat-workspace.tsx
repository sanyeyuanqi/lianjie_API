/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getUserGroups, getUserModels } from '@/features/playground/api'
import { PlaygroundChat } from '@/features/playground/components/playground-chat'
import { PlaygroundInput } from '@/features/playground/components/playground-input'
import { useChatHandler } from '@/features/playground/hooks'
import {
  createLoadingAssistantMessage,
  createUserMessage,
} from '@/features/playground/lib'
import type { Message as MessageType } from '@/features/playground/types'
import { cn } from '@/lib/utils'
import { useChatState } from '../hooks/use-chat-state'

export function ChatWorkspace() {
  const { t } = useTranslation()
  const {
    config,
    parameterEnabled,
    messages,
    models,
    groups,
    updateMessages,
    setModels,
    setGroups,
    updateConfig,
    clearMessages,
  } = useChatState()

  const { sendChat, stopGeneration, isGenerating } = useChatHandler({
    config,
    parameterEnabled,
    onMessageUpdate: updateMessages,
  })

  const [editingMessageKey, setEditingMessageKey] = useState<string | null>(
    null
  )

  const assistantName =
    models.find((model) => model.value === config.model)?.label ||
    config.model ||
    'AI'

  const { data: modelsData, isLoading: isLoadingModels } = useQuery({
    queryKey: ['chat-models', t],
    queryFn: async () => {
      try {
        return await getUserModels()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('Failed to load models')
        )
        return []
      }
    },
  })

  const { data: groupsData } = useQuery({
    queryKey: ['chat-groups', t],
    queryFn: async () => {
      try {
        return await getUserGroups()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t('Failed to load groups')
        )
        return []
      }
    },
  })

  useEffect(() => {
    if (!modelsData) return

    setModels(modelsData)

    const isCurrentModelValid = modelsData.some((m) => m.value === config.model)
    if (modelsData.length > 0 && !isCurrentModelValid) {
      updateConfig('model', modelsData[0].value)
    }
  }, [modelsData, config.model, setModels, updateConfig])

  useEffect(() => {
    if (!groupsData) return

    setGroups(groupsData)

    const hasCurrentGroup = groupsData.some((g) => g.value === config.group)
    if (!hasCurrentGroup && groupsData.length > 0) {
      const fallback =
        groupsData.find((g) => g.value === 'default')?.value ??
        groupsData[0].value
      updateConfig('group', fallback)
    }
  }, [groupsData, setGroups, config.group, updateConfig])

  const handleSendMessage = (text: string) => {
    const userMessage = createUserMessage(text)
    const assistantMessage = createLoadingAssistantMessage(assistantName)
    const newMessages = [...messages, userMessage, assistantMessage]

    updateMessages(newMessages)
    sendChat(newMessages)
  }

  const handleRegenerateMessage = (message: MessageType) => {
    const messageIndex = messages.findIndex((m) => m.key === message.key)
    if (messageIndex === -1) return

    const messagesUpToHere = messages.slice(0, messageIndex)
    const loadingMessage = createLoadingAssistantMessage(assistantName)
    const newMessages = [...messagesUpToHere, loadingMessage]

    updateMessages(newMessages)
    sendChat(newMessages)
  }

  const handleEditMessage = useCallback((message: MessageType) => {
    setEditingMessageKey(message.key)
  }, [])

  const handleEditOpenChange = useCallback((open: boolean) => {
    if (!open) setEditingMessageKey(null)
  }, [])

  const applyEdit = useCallback(
    (newContent: string, submit: boolean) => {
      if (!editingMessageKey) return
      const index = messages.findIndex((m) => m.key === editingMessageKey)
      if (index === -1) return

      const updated = messages.map((m) =>
        m.key === editingMessageKey
          ? { ...m, versions: [{ ...m.versions[0], content: newContent }] }
          : m
      )

      setEditingMessageKey(null)

      if (!submit || updated[index].from !== 'user') {
        updateMessages(updated)
        return
      }

      const toSubmit = [
        ...updated.slice(0, index + 1),
        createLoadingAssistantMessage(assistantName),
      ]
      updateMessages(toSubmit)
      sendChat(toSubmit)
    },
    [assistantName, editingMessageKey, messages, updateMessages, sendChat]
  )

  const handleDeleteMessage = (message: MessageType) => {
    const newMessages = messages.filter((m) => m.key !== message.key)
    updateMessages(newMessages)
  }

  const handleClearLocalMessages = () => {
    if (isGenerating) {
      stopGeneration()
    }
    clearMessages()
    toast.success(t('Cleared'))
  }

  return (
    <div className='relative flex size-full flex-col overflow-hidden'>
      <div className='flex flex-1 flex-col overflow-hidden'>
        <PlaygroundChat
          assistantName={assistantName}
          contentClassName='pb-80'
          messages={messages}
          onRegenerateMessage={handleRegenerateMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          isGenerating={isGenerating}
          editingKey={editingMessageKey}
          onCancelEdit={handleEditOpenChange}
          onSaveEdit={(newContent) => applyEdit(newContent, false)}
          onSaveEditAndSubmit={(newContent) => applyEdit(newContent, true)}
        />
      </div>

      <h1
        className={cn(
          'pointer-events-none absolute left-1/2 top-[calc(46%-5rem-150px)] z-10 -translate-x-1/2 text-center text-3xl font-semibold tracking-normal text-foreground transition-opacity duration-200 md:text-4xl xl:left-[calc(50%-40px)]',
          messages.length === 0 ? 'opacity-100' : 'opacity-0'
        )}
      >
        今天聊点什么？
      </h1>

      <div
        className={cn(
          'absolute left-1/2 z-10 mx-auto w-full max-w-4xl -translate-x-1/2 px-3 pb-3 transition-[top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:px-0 md:pb-0 xl:left-[calc(50%-40px)]',
          messages.length === 0
            ? 'top-[calc(46%-150px)]'
            : 'top-[calc(100%-12.25rem)]'
        )}
      >
        <PlaygroundInput
          disabled={isGenerating}
          groups={groups}
          groupValue={config.group}
          isGenerating={isGenerating}
          isModelLoading={isLoadingModels}
          modelValue={config.model}
          models={models}
          onGroupChange={(value) => updateConfig('group', value)}
          onModelChange={(value) => updateConfig('model', value)}
          onStop={stopGeneration}
          onClearLocalMessages={handleClearLocalMessages}
          hasMessages={messages.length > 0}
          onSubmit={handleSendMessage}
        />
      </div>
    </div>
  )
}
