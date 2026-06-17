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
import { STORAGE_KEYS } from '../constants'
import type {
  PlaygroundConfig,
  ParameterEnabled,
  Message,
  PlaygroundSession,
} from '../types'
import { sanitizeMessagesOnLoad } from './message-utils'

const DEFAULT_SESSION_TITLE = 'New chat'
export const PLAYGROUND_SESSIONS_CHANGED_EVENT = 'playground:sessions-changed'

export function notifyPlaygroundSessionsChanged(): void {
  if (typeof window === 'undefined') return
  window.setTimeout(() => {
    window.dispatchEvent(new Event(PLAYGROUND_SESSIONS_CHANGED_EVENT))
  }, 0)
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getMessageText(message: Message | undefined): string {
  return message?.versions?.[0]?.content?.trim() || ''
}

export function sortPlaygroundSessions(
  sessions: PlaygroundSession[]
): PlaygroundSession[] {
  return [...sessions].sort(comparePlaygroundSessions)
}

function comparePlaygroundSessions(
  a: PlaygroundSession,
  b: PlaygroundSession
): number {
  const pinnedA = a.pinnedAt || 0
  const pinnedB = b.pinnedAt || 0

  if (pinnedA !== pinnedB) {
    return pinnedB - pinnedA
  }

  return b.updatedAt - a.updatedAt
}

export function getSessionTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.from === 'user')
  const text = getMessageText(firstUserMessage)

  if (!text) {
    return DEFAULT_SESSION_TITLE
  }

  return text.length > 28 ? `${text.slice(0, 28)}...` : text
}

export function createPlaygroundSession(
  messages: Message[] = []
): PlaygroundSession {
  const now = Date.now()

  return {
    id: createSessionId(),
    title: getSessionTitle(messages),
    messages,
    createdAt: now,
    updatedAt: now,
    pinnedAt: null,
  }
}

/**
 * Load playground config from localStorage
 */
export function loadConfig(): Partial<PlaygroundConfig> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load config:', error)
  }
  return {}
}

/**
 * Save playground config to localStorage
 */
export function saveConfig(config: Partial<PlaygroundConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save config:', error)
  }
}

/**
 * Load parameter enabled state from localStorage
 */
export function loadParameterEnabled(): Partial<ParameterEnabled> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PARAMETER_ENABLED)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load parameter enabled:', error)
  }
  return {}
}

/**
 * Save parameter enabled state to localStorage
 */
export function saveParameterEnabled(
  parameterEnabled: Partial<ParameterEnabled>
): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.PARAMETER_ENABLED,
      JSON.stringify(parameterEnabled)
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save parameter enabled:', error)
  }
}

/**
 * Load messages from localStorage
 */
export function loadMessages(): Message[] | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (!Array.isArray(parsed)) {
        return null
      }
      const sanitized = sanitizeMessagesOnLoad(parsed as Message[])
      // Persist sanitized result to avoid re-sanitizing on subsequent loads
      if (sanitized !== parsed) {
        saveMessages(sanitized)
      }
      return sanitized
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load messages:', error)
  }
  return null
}

/**
 * Load playground chat sessions from localStorage
 */
export function loadSessions(): PlaygroundSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        let changed = false
        const sessions = parsed
          .map((session) => {
            const value = session as Partial<PlaygroundSession>
            const originalMessages = Array.isArray(value.messages)
              ? (value.messages as Message[])
              : []
            const messages = sanitizeMessagesOnLoad(originalMessages)
            if (messages !== originalMessages) {
              changed = true
            }

            return {
              id: typeof value.id === 'string' ? value.id : createSessionId(),
              title:
                typeof value.title === 'string' && value.title.trim()
                  ? value.title
                  : getSessionTitle(messages),
              messages,
              createdAt:
                typeof value.createdAt === 'number'
                  ? value.createdAt
                  : Date.now(),
              updatedAt:
                typeof value.updatedAt === 'number'
                  ? value.updatedAt
                  : Date.now(),
              pinnedAt:
                typeof value.pinnedAt === 'number' ? value.pinnedAt : null,
            }
          })
          .sort(comparePlaygroundSessions)

        if (changed) {
          saveSessions(sessions)
        }

        return sessions
      }
    }

    const legacyMessages = loadMessages()
    if (legacyMessages?.length) {
      const legacySession = createPlaygroundSession(legacyMessages)
      saveSessions([legacySession])
      saveActiveSessionId(legacySession.id)
      return [legacySession]
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load playground sessions:', error)
  }

  return []
}

/**
 * Save playground chat sessions to localStorage
 */
export function saveSessions(sessions: PlaygroundSession[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.SESSIONS,
      JSON.stringify(sortPlaygroundSessions(sessions))
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save playground sessions:', error)
  }
}

/**
 * Load the active playground session id
 */
export function loadActiveSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load active playground session:', error)
  }

  return null
}

/**
 * Save the active playground session id
 */
export function saveActiveSessionId(sessionId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save active playground session:', error)
  }
}

/**
 * Save messages to localStorage
 */
export function saveMessages(messages: Message[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save messages:', error)
  }
}

/**
 * Clear playground chat messages only
 */
export function clearPlaygroundMessages(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.MESSAGES)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS)
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear playground messages:', error)
  }
}

/**
 * Clear all playground data
 */
export function clearPlaygroundData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIG)
    localStorage.removeItem(STORAGE_KEYS.PARAMETER_ENABLED)
    localStorage.removeItem(STORAGE_KEYS.MESSAGES)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS)
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear playground data:', error)
  }
}
