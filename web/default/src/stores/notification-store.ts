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
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationTab = 'notice' | 'announcements'

interface NotificationState {
  // Last read Notice content signature (full trimmed message)
  lastReadNotice: string
  // Array of read announcement keys (id or content hash)
  readAnnouncementKeys: string[]
  // Date of last "Close Today" action for each notification type
  closedNoticeUntilDate: string | null
  closedAnnouncementsUntilDate: string | null

  // Actions
  markNoticeRead: (noticeContent: string) => void
  markAnnouncementsRead: (keys: string[]) => void
  setClosedUntilDate: (tab: NotificationTab, date: string | null) => void
  isAnnouncementRead: (key: string) => boolean
  isNoticeClosed: () => boolean
  isAnnouncementsClosed: () => boolean
}

/**
 * Notification store for tracking read status of Notice and Announcements
 * Persists to localStorage to maintain state across sessions
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      lastReadNotice: '',
      readAnnouncementKeys: [],
      closedNoticeUntilDate: null,
      closedAnnouncementsUntilDate: null,

      markNoticeRead: (noticeContent: string) => {
        // Persist the full trimmed content so edits beyond 100 chars register
        const normalizedContent = noticeContent.trim()
        set({ lastReadNotice: normalizedContent })
      },

      markAnnouncementsRead: (keys: string[]) => {
        set((state) => ({
          readAnnouncementKeys: [
            ...new Set([...state.readAnnouncementKeys, ...keys]),
          ],
        }))
      },

      setClosedUntilDate: (tab: NotificationTab, date: string | null) => {
        set(
          tab === 'notice'
            ? { closedNoticeUntilDate: date }
            : { closedAnnouncementsUntilDate: date }
        )
      },

      isAnnouncementRead: (key: string) => {
        return get().readAnnouncementKeys.includes(key)
      },

      isNoticeClosed: () => {
        const { closedNoticeUntilDate } = get()
        if (!closedNoticeUntilDate) return false

        const today = new Date().toDateString()
        return closedNoticeUntilDate === today
      },

      isAnnouncementsClosed: () => {
        const { closedAnnouncementsUntilDate } = get()
        if (!closedAnnouncementsUntilDate) return false

        const today = new Date().toDateString()
        return closedAnnouncementsUntilDate === today
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        lastReadNotice: state.lastReadNotice,
        readAnnouncementKeys: state.readAnnouncementKeys,
        closedNoticeUntilDate: state.closedNoticeUntilDate,
        closedAnnouncementsUntilDate: state.closedAnnouncementsUntilDate,
      }),
    }
  )
)
