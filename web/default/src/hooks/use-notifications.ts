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
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  type NotificationTab,
  useNotificationStore,
} from '@/stores/notification-store'
import { getNotice } from '@/lib/api'
import { useStatus } from '@/hooks/use-status'

function hashString(input: string): string {
  let hash = 0
  if (!input) return '0'

  for (let i = 0; i < input.length; i += 1) {
    const chr = input.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }

  return hash.toString(36)
}

/**
 * Generate a unique key for an announcement
 * Prefer backend id, fall back to a content hash so edits register
 */
function getAnnouncementKey(item: Record<string, unknown>): string {
  if (!item) return ''

  if (item.id !== undefined && item.id !== null) {
    return `id:${item.id}`
  }

  const fingerprint = JSON.stringify({
    publishDate: (item?.publishDate as string) || '',
    content: ((item?.content as string) || '').trim(),
    extra: ((item?.extra as string) || '').trim(),
    type: (item?.type as string) || '',
    title: ((item?.title as string) || '').trim(),
    link: ((item?.link as string) || '').trim(),
  })
  return `hash:${hashString(fingerprint)}`
}

/**
 * Hook to manage notifications (Notice + Announcements)
 * Provides unread counts and read status management
 */
export function useNotifications(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [, setAutoQueue] = useState<NotificationTab[]>([])
  const [pendingAutoTab, setPendingAutoTab] = useState<NotificationTab | null>(
    null
  )
  const [isAutoPrompt, setIsAutoPrompt] = useState(false)
  const [autoPromptKey, setAutoPromptKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<NotificationTab>('notice')

  // Fetch Notice from API
  const {
    data: noticeResponse,
    isLoading: noticeLoading,
    refetch: refetchNotice,
  } = useQuery({
    queryKey: ['notice'],
    queryFn: getNotice,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Fetch Announcements from status
  const { status, loading: statusLoading } = useStatus({ enabled })
  const announcementsEnabled = status?.announcements_enabled ?? false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const announcements: Record<string, unknown>[] = announcementsEnabled
    ? ((status?.announcements || []) as Record<string, unknown>[]).slice(0, 20)
    : []

  // Notification store
  const {
    lastReadNotice,
    markNoticeRead,
    markAnnouncementsRead,
    isAnnouncementRead,
    setClosedUntilDate,
    isNoticeClosed,
    isAnnouncementsClosed,
  } = useNotificationStore()

  // Extract notice content
  const noticeContent = noticeResponse?.success
    ? (noticeResponse.data || '').trim()
    : ''

  // Calculate unread counts
  const unreadCounts = useMemo(() => {
    const noticeUnread =
      noticeContent && noticeContent !== lastReadNotice ? 1 : 0

    const announcementsUnread = announcements.filter(
      (item: Record<string, unknown>) => {
        const key = getAnnouncementKey(item)
        return !isAnnouncementRead(key)
      }
    ).length

    return {
      notice: noticeUnread,
      announcements: announcementsUnread,
      total: noticeUnread + announcementsUnread,
    }
  }, [noticeContent, lastReadNotice, announcements, isAnnouncementRead])

  const markAnnouncementsAsRead = useCallback(() => {
    if (announcements.length > 0) {
      const allKeys = announcements.map((item: Record<string, unknown>) =>
        getAnnouncementKey(item)
      )
      markAnnouncementsRead(allKeys)
    }
  }, [announcements, markAnnouncementsRead])

  const announcementKeys = useMemo(
    () =>
      announcements
        .map((item: Record<string, unknown>) => getAnnouncementKey(item))
        .filter(Boolean),
    [announcements]
  )

  // Handle popover open
  const handleOpenPopover = useCallback(
    (tab?: NotificationTab) => {
      const nextTab = tab || activeTab

      // Mark currently visible content as read when opening the notification center
      if (nextTab === 'notice' && noticeContent) {
        markNoticeRead(noticeContent)
      }
      if (nextTab === 'announcements') {
        markAnnouncementsAsRead()
      }

      setActiveTab(nextTab)
      setPopoverOpen(true)
    },
    [activeTab, markAnnouncementsAsRead, markNoticeRead, noticeContent]
  )

  const closePopover = useCallback(() => {
    setPopoverOpen(false)
    setAutoQueue((queue) => {
      const [nextTab, ...restTabs] = queue
      setPendingAutoTab(nextTab || null)
      if (!nextTab) {
        setIsAutoPrompt(false)
      }
      return restTabs
    })
  }, [])

  const handlePopoverOpenChange = (open: boolean) => {
    if (open) {
      setAutoQueue([])
      setPendingAutoTab(null)
      setIsAutoPrompt(false)
      handleOpenPopover(activeTab)
      return
    }

    closePopover()
  }

  // Handle tab change - mark announcements as read when switching to that tab
  const handleTabChange = (tab: NotificationTab) => {
    setActiveTab(tab)

    if (tab === 'notice' && noticeContent) {
      markNoticeRead(noticeContent)
    } else if (tab === 'announcements') {
      markAnnouncementsAsRead()
    }
  }

  const closeToday = useCallback(
    (tab: NotificationTab = activeTab) => {
      setClosedUntilDate(tab, new Date().toDateString())
      closePopover()
    },
    [activeTab, closePopover, setClosedUntilDate]
  )

  useEffect(() => {
    if (!enabled) return
    if (popoverOpen) return
    if (noticeLoading || statusLoading) return

    const shouldShowNotice = Boolean(noticeContent) && !isNoticeClosed()
    const shouldShowAnnouncements =
      announcements.length > 0 && !isAnnouncementsClosed()

    if (!shouldShowNotice && !shouldShowAnnouncements) return

    const nextPromptKey = [
      shouldShowAnnouncements ? `announcements:${announcementKeys.join(',')}` : '',
      shouldShowNotice ? `notice:${hashString(noticeContent)}` : '',
    ]
      .filter(Boolean)
      .join('|')

    if (!nextPromptKey || nextPromptKey === autoPromptKey) return

    const tabsToShow: NotificationTab[] = [
      ...(shouldShowNotice ? (['notice'] as const) : []),
      ...(shouldShowAnnouncements ? (['announcements'] as const) : []),
    ]
    const [firstTab, ...restTabs] = tabsToShow
    if (!firstTab) return

    setAutoPromptKey(nextPromptKey)
    setIsAutoPrompt(true)
    setAutoQueue(restTabs)
    handleOpenPopover(firstTab)
  }, [
    announcementKeys,
    announcements.length,
    autoPromptKey,
    handleOpenPopover,
    isAnnouncementsClosed,
    isNoticeClosed,
    noticeContent,
    noticeLoading,
    popoverOpen,
    statusLoading,
    enabled,
  ])

  useEffect(() => {
    if (popoverOpen || !isAutoPrompt || !pendingAutoTab) return

    const timer = window.setTimeout(() => {
      const nextTab = pendingAutoTab
      setPendingAutoTab(null)
      handleOpenPopover(nextTab)
    }, 120)

    return () => window.clearTimeout(timer)
  }, [handleOpenPopover, isAutoPrompt, pendingAutoTab, popoverOpen])

  const openPopover = useCallback(
    (tab?: NotificationTab) => {
      setAutoQueue([])
      setPendingAutoTab(null)
      setIsAutoPrompt(false)
      handleOpenPopover(tab)
    },
    [handleOpenPopover]
  )

  return {
    // Data
    notice: noticeContent,
    announcements,
    loading: noticeLoading || statusLoading,

    // Unread counts
    unreadCount: unreadCounts.total,
    unreadNoticeCount: unreadCounts.notice,
    unreadAnnouncementsCount: unreadCounts.announcements,

    // Popover state
    popoverOpen,
    setPopoverOpen: handlePopoverOpenChange,
    activeTab,
    setActiveTab: handleTabChange,
    isAutoPrompt,

    // Actions
    openPopover,
    closePopover,
    closeToday,
    refetchNotice,
  }
}
