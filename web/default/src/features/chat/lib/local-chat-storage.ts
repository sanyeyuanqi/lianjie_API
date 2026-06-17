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
import type {
  Message,
  PlaygroundConfig,
  PlaygroundSession,
} from '@/features/playground/types'
import { sanitizeMessagesOnLoad } from '@/features/playground/lib'

const DEFAULT_SESSION_TITLE = 'New chat'
const CHAT_STORAGE_KEYS = {
  CONFIG: 'chat_config',
  MESSAGES: 'chat_messages',
  SESSIONS: 'chat_sessions',
  ACTIVE_SESSION_ID: 'chat_active_session_id',
} as const

export const CHAT_SESSIONS_CHANGED_EVENT = 'chat:sessions-changed'

export function notifyChatSessionsChanged(): void {
  if (typeof window === 'undefined') return
  window.setTimeout(() => {
    window.dispatchEvent(new Event(CHAT_SESSIONS_CHANGED_EVENT))
  }, 0)
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `chat-session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getMessageText(message: Message | undefined): string {
  return message?.versions?.[0]?.content?.trim() || ''
}

function compareChatSessions(
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

export function sortChatSessions(
  sessions: PlaygroundSession[]
): PlaygroundSession[] {
  return [...sessions].sort(compareChatSessions)
}

export function getChatSessionTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((message) => message.from === 'user')
  const text = getMessageText(firstUserMessage)

  if (!text) {
    return DEFAULT_SESSION_TITLE
  }

  return text.length > 28 ? `${text.slice(0, 28)}...` : text
}

export function createChatSession(
  messages: Message[] = []
): PlaygroundSession {
  const now = Date.now()

  return {
    id: createSessionId(),
    title: getChatSessionTitle(messages),
    customTitle: false,
    messages,
    createdAt: now,
    updatedAt: now,
    pinnedAt: null,
  }
}

export function loadChatConfig(): Partial<PlaygroundConfig> {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEYS.CONFIG)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chat config:', error)
  }
  return {}
}

export function saveChatConfig(config: Partial<PlaygroundConfig>): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEYS.CONFIG, JSON.stringify(config))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save chat config:', error)
  }
}

export function loadChatMessages(): Message[] | null {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEYS.MESSAGES)
    if (saved) {
      const parsed: unknown = JSON.parse(saved)
      if (!Array.isArray(parsed)) {
        return null
      }
      const sanitized = sanitizeMessagesOnLoad(parsed as Message[])
      if (sanitized !== parsed) {
        saveChatMessages(sanitized)
      }
      return sanitized
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chat messages:', error)
  }
  return null
}

export function loadChatSessions(): PlaygroundSession[] {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEYS.SESSIONS)
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
                  : getChatSessionTitle(messages),
              customTitle: value.customTitle === true,
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
          .sort(compareChatSessions)

        if (changed) {
          saveChatSessions(sessions)
        }

        return sessions
      }
    }

    const legacyMessages = loadChatMessages()
    if (legacyMessages?.length) {
      const legacySession = createChatSession(legacyMessages)
      saveChatSessions([legacySession])
      saveActiveChatSessionId(legacySession.id)
      return [legacySession]
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chat sessions:', error)
  }

  return []
}

export function saveChatSessions(sessions: PlaygroundSession[]): void {
  try {
    localStorage.setItem(
      CHAT_STORAGE_KEYS.SESSIONS,
      JSON.stringify(sortChatSessions(sessions))
    )
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save chat sessions:', error)
  }
}

export function loadActiveChatSessionId(): string | null {
  try {
    return localStorage.getItem(CHAT_STORAGE_KEYS.ACTIVE_SESSION_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load active chat session:', error)
  }

  return null
}

export function saveActiveChatSessionId(sessionId: string): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save active chat session:', error)
  }
}

export function saveChatMessages(messages: Message[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save chat messages:', error)
  }
}

export function clearChatMessages(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEYS.MESSAGES)
    localStorage.removeItem(CHAT_STORAGE_KEYS.SESSIONS)
    localStorage.removeItem(CHAT_STORAGE_KEYS.ACTIVE_SESSION_ID)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear chat messages:', error)
  }
}
