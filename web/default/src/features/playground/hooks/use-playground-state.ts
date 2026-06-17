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
import { useState, useCallback, useEffect } from 'react'
import { DEFAULT_CONFIG, DEFAULT_PARAMETER_ENABLED } from '../constants'
import {
  loadConfig,
  saveConfig,
  loadParameterEnabled,
  saveParameterEnabled,
  saveMessages,
  clearPlaygroundMessages,
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createPlaygroundSession,
  getSessionTitle,
  notifyPlaygroundSessionsChanged,
  PLAYGROUND_SESSIONS_CHANGED_EVENT,
  sortPlaygroundSessions,
} from '../lib'
import type {
  Message,
  PlaygroundSession,
  PlaygroundConfig,
  ParameterEnabled,
  ModelOption,
  GroupOption,
} from '../types'

function hasPendingAssistantMessage(messages: Message[]): boolean {
  return messages.some(
    (message) =>
      message.from === 'assistant' &&
      (message.status === 'loading' || message.status === 'streaming')
  )
}

function loadInitialSessionState() {
  const savedSessions = loadSessions()
  const sessions =
    savedSessions.length > 0 ? savedSessions : [createPlaygroundSession()]
  const savedActiveId = loadActiveSessionId()
  const activeSession =
    sessions.find((session) => session.id === savedActiveId) || sessions[0]

  if (savedSessions.length === 0) {
    saveSessions(sessions)
  }
  saveActiveSessionId(activeSession.id)
  saveMessages(activeSession.messages)

  return {
    sessions,
    activeSessionId: activeSession.id,
    messages: activeSession.messages,
  }
}

/**
 * Main state management hook for playground
 */
export function usePlaygroundState() {
  // Load initial state from localStorage
  const [config, setConfig] = useState<PlaygroundConfig>(() => {
    const savedConfig = loadConfig()
    return { ...DEFAULT_CONFIG, ...savedConfig }
  })

  const [parameterEnabled, setParameterEnabled] = useState<ParameterEnabled>(
    () => {
      const saved = loadParameterEnabled()
      return { ...DEFAULT_PARAMETER_ENABLED, ...saved }
    }
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
    const savedSessions = loadSessions()
    const nextSessions =
      savedSessions.length > 0 ? savedSessions : [createPlaygroundSession()]
    const savedActiveId = loadActiveSessionId()
    const activeSession =
      nextSessions.find((session) => session.id === savedActiveId) ||
      nextSessions[0]

    setSessions(nextSessions)
    setActiveSessionId(activeSession.id)
    setMessages(activeSession.messages)
    saveActiveSessionId(activeSession.id)
    saveMessages(activeSession.messages)
  }, [])

  useEffect(() => {
    window.addEventListener(
      PLAYGROUND_SESSIONS_CHANGED_EVENT,
      syncSessionsFromStorage
    )

    return () => {
      window.removeEventListener(
        PLAYGROUND_SESSIONS_CHANGED_EVENT,
        syncSessionsFromStorage
      )
    }
  }, [syncSessionsFromStorage])

  // Update config with automatic save
  const updateConfig = useCallback(
    <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) => {
      setConfig((prev) => {
        const updated = { ...prev, [key]: value }
        saveConfig(updated)
        return updated
      })
    },
    []
  )

  // Update parameter enabled with automatic save
  const updateParameterEnabled = useCallback(
    (key: keyof ParameterEnabled, value: boolean) => {
      setParameterEnabled((prev) => {
        const updated = { ...prev, [key]: value }
        saveParameterEnabled(updated)
        return updated
      })
    },
    []
  )

  // Update messages with automatic save
  const updateMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages((prev) => {
        const newMessages =
          typeof updater === 'function' ? updater(prev) : updater
        saveMessages(newMessages)
        setSessions((prevSessions) => {
          const now = Date.now()
          const updatedSessions = sortPlaygroundSessions(
            prevSessions.map((session) =>
              session.id === activeSessionId
                ? {
                    ...session,
                    title: getSessionTitle(newMessages),
                    messages: newMessages,
                    updatedAt: now,
                  }
                : session
            )
          )

          saveSessions(updatedSessions)
          if (!hasPendingAssistantMessage(newMessages)) {
            notifyPlaygroundSessionsChanged()
          }
          return updatedSessions
        })
        return newMessages
      })
    },
    [activeSessionId]
  )

  const selectSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((item) => item.id === sessionId)
      if (!session) return

      setActiveSessionId(session.id)
      saveActiveSessionId(session.id)
      setMessages(session.messages)
      saveMessages(session.messages)
      notifyPlaygroundSessionsChanged()
    },
    [sessions]
  )

  const createNewSession = useCallback(() => {
    const session = createPlaygroundSession()

    setSessions((prevSessions) => {
      const updatedSessions = [session, ...prevSessions]
      saveSessions(updatedSessions)
      notifyPlaygroundSessionsChanged()
      return updatedSessions
    })
    setActiveSessionId(session.id)
    saveActiveSessionId(session.id)
    setMessages([])
    saveMessages([])
  }, [])

  // Clear all messages
  const clearMessages = useCallback(() => {
    const session = createPlaygroundSession()
    setMessages([])
    setSessions([session])
    setActiveSessionId(session.id)
    clearPlaygroundMessages()
    saveSessions([session])
    saveActiveSessionId(session.id)
    saveMessages([])
    notifyPlaygroundSessionsChanged()
  }, [])

  // Reset config to defaults
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setParameterEnabled(DEFAULT_PARAMETER_ENABLED)
    saveConfig(DEFAULT_CONFIG)
    saveParameterEnabled(DEFAULT_PARAMETER_ENABLED)
  }, [])

  return {
    // State
    config,
    parameterEnabled,
    messages,
    sessions,
    activeSessionId,
    models,
    groups,

    // Setters
    setModels,
    setGroups,

    // Actions
    updateConfig,
    updateParameterEnabled,
    updateMessages,
    selectSession,
    createNewSession,
    clearMessages,
    resetConfig,
  }
}
