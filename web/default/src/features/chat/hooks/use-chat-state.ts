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
import {
  DEFAULT_CONFIG,
  DEFAULT_PARAMETER_ENABLED,
} from '@/features/playground/constants'
import type {
  GroupOption,
  Message,
  ModelOption,
  ParameterEnabled,
  PlaygroundConfig,
  PlaygroundSession,
} from '@/features/playground/types'
import {
  CHAT_SESSIONS_CHANGED_EVENT,
  clearChatMessages,
  createChatSession,
  getChatSessionTitle,
  loadActiveChatSessionId,
  loadChatConfig,
  loadChatSessions,
  notifyChatSessionsChanged,
  saveActiveChatSessionId,
  saveChatConfig,
  saveChatMessages,
  saveChatSessions,
  sortChatSessions,
} from '../lib/local-chat-storage'

function hasPendingAssistantMessage(messages: Message[]): boolean {
  return messages.some(
    (message) =>
      message.from === 'assistant' &&
      (message.status === 'loading' || message.status === 'streaming')
  )
}

function loadInitialSessionState() {
  const savedSessions = loadChatSessions()
  const sessions =
    savedSessions.length > 0 ? savedSessions : [createChatSession()]
  const savedActiveId = loadActiveChatSessionId()
  const activeSession =
    sessions.find((session) => session.id === savedActiveId) || sessions[0]

  if (savedSessions.length === 0) {
    saveChatSessions(sessions)
  }
  saveActiveChatSessionId(activeSession.id)
  saveChatMessages(activeSession.messages)

  return {
    sessions,
    activeSessionId: activeSession.id,
    messages: activeSession.messages,
  }
}

export function useChatState() {
  const [config, setConfig] = useState<PlaygroundConfig>(() => {
    const savedConfig = loadChatConfig()
    return { ...DEFAULT_CONFIG, ...savedConfig }
  })

  const [parameterEnabled] = useState<ParameterEnabled>(
    DEFAULT_PARAMETER_ENABLED
  )
  const [initialSessionState] = useState(() => loadInitialSessionState())
  const [messages, setMessages] = useState<Message[]>(
    () => initialSessionState.messages
  )
  const [sessions, setSessions] = useState<PlaygroundSession[]>(
    () => initialSessionState.sessions
  )
  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => initialSessionState.activeSessionId
  )
  const [models, setModels] = useState<ModelOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])

  const syncSessionsFromStorage = useCallback(() => {
    const savedSessions = loadChatSessions()
    const nextSessions =
      savedSessions.length > 0 ? savedSessions : [createChatSession()]
    const savedActiveId = loadActiveChatSessionId()
    const activeSession =
      nextSessions.find((session) => session.id === savedActiveId) ||
      nextSessions[0]

    setSessions(nextSessions)
    setActiveSessionId(activeSession.id)
    setMessages(activeSession.messages)
    saveActiveChatSessionId(activeSession.id)
    saveChatMessages(activeSession.messages)
  }, [])

  useEffect(() => {
    window.addEventListener(CHAT_SESSIONS_CHANGED_EVENT, syncSessionsFromStorage)

    return () => {
      window.removeEventListener(
        CHAT_SESSIONS_CHANGED_EVENT,
        syncSessionsFromStorage
      )
    }
  }, [syncSessionsFromStorage])

  const updateConfig = useCallback(
    <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) => {
      setConfig((prev) => {
        const updated = { ...prev, [key]: value }
        saveChatConfig(updated)
        return updated
      })
    },
    []
  )

  const updateMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages((prev) => {
        const newMessages =
          typeof updater === 'function' ? updater(prev) : updater
        const shouldNotifySessionsChanged =
          !hasPendingAssistantMessage(newMessages) ||
          (prev.length === 0 && newMessages.length > 0)

        saveChatMessages(newMessages)
        setSessions((prevSessions) => {
          const now = Date.now()
          const latestSessions = loadChatSessions()
          const sourceSessions = latestSessions.some(
            (session) => session.id === activeSessionId
          )
            ? latestSessions
            : prevSessions
          const updatedSessions = sortChatSessions(
            sourceSessions.map((session) =>
              session.id === activeSessionId
                ? {
                    ...session,
                    title: session.customTitle
                      ? session.title
                      : getChatSessionTitle(newMessages),
                    messages: newMessages,
                    updatedAt: now,
                  }
                : session
            )
          )

          saveChatSessions(updatedSessions)
          if (shouldNotifySessionsChanged) {
            notifyChatSessionsChanged()
          }
          return updatedSessions
        })
        return newMessages
      })
    },
    [activeSessionId]
  )

  const clearMessages = useCallback(() => {
    const session = createChatSession()
    setMessages([])
    setSessions([session])
    setActiveSessionId(session.id)
    clearChatMessages()
    saveChatSessions([session])
    saveActiveChatSessionId(session.id)
    saveChatMessages([])
    notifyChatSessionsChanged()
  }, [])

  return {
    config,
    parameterEnabled,
    messages,
    sessions,
    activeSessionId,
    models,
    groups,
    setModels,
    setGroups,
    updateConfig,
    updateMessages,
    clearMessages,
  }
}
