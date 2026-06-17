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
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  MessageSquarePlusIcon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  createPlaygroundSession,
  loadActiveSessionId,
  loadSessions,
  notifyPlaygroundSessionsChanged,
  PLAYGROUND_SESSIONS_CHANGED_EVENT,
  saveActiveSessionId,
  saveMessages,
  saveSessions,
  sortPlaygroundSessions,
} from '@/features/playground/lib'
import type { PlaygroundSession } from '@/features/playground/types'

export function PlaygroundSessionsItem() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()
  const [sessions, setSessions] = useState<PlaygroundSession[]>(() =>
    loadSessions()
  )
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    loadActiveSessionId()
  )

  const recentSessions = useMemo(
    () =>
      sessions.filter((session) => session.messages.length > 0).slice(0, 24),
    [sessions]
  )

  useEffect(() => {
    const sync = () => {
      setSessions(loadSessions())
      setActiveSessionId(loadActiveSessionId())
    }

    window.addEventListener(PLAYGROUND_SESSIONS_CHANGED_EVENT, sync)

    return () => {
      window.removeEventListener(PLAYGROUND_SESSIONS_CHANGED_EVENT, sync)
    }
  }, [])

  const goPlayground = () => {
    setOpenMobile(false)
    void navigate({ to: '/playground' })
  }

  const handleNewSession = () => {
    const session = createPlaygroundSession()
    const updatedSessions = [session, ...loadSessions()]

    saveSessions(updatedSessions)
    saveActiveSessionId(session.id)
    saveMessages([])
    setSessions(updatedSessions)
    setActiveSessionId(session.id)
    notifyPlaygroundSessionsChanged()
    goPlayground()
  }

  const handleSelectSession = (session: PlaygroundSession) => {
    saveActiveSessionId(session.id)
    saveMessages(session.messages)
    setActiveSessionId(session.id)
    notifyPlaygroundSessionsChanged()
    goPlayground()
  }

  const handleTogglePin = (session: PlaygroundSession) => {
    const updatedSessions = sortPlaygroundSessions(
      loadSessions().map((item) =>
        item.id === session.id
          ? {
              ...item,
              pinnedAt: item.pinnedAt ? null : Date.now(),
            }
          : item
      )
    )

    saveSessions(updatedSessions)
    setSessions(updatedSessions)
    notifyPlaygroundSessionsChanged()
  }

  const handleDeleteSession = (session: PlaygroundSession) => {
    const remainingSessions = loadSessions().filter(
      (item) => item.id !== session.id
    )
    const nextSessions =
      remainingSessions.length > 0
        ? sortPlaygroundSessions(remainingSessions)
        : [createPlaygroundSession()]
    const nextActiveSession =
      session.id === activeSessionId
        ? nextSessions[0]
        : nextSessions.find((item) => item.id === activeSessionId) ||
          nextSessions[0]

    saveSessions(nextSessions)
    saveActiveSessionId(nextActiveSession.id)
    saveMessages(nextActiveSession.messages)
    setSessions(nextSessions)
    setActiveSessionId(nextActiveSession.id)
    notifyPlaygroundSessionsChanged()
  }

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleNewSession} tooltip={t('New chat')}>
          <MessageSquarePlusIcon className='shrink-0' />
          <span className='min-w-0 flex-1 truncate'>{t('New chat')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarGroupLabel className='text-muted-foreground/65 mt-3 h-7 px-2 font-mono text-[12px] font-medium tracking-normal'>
          {t('Recent')}
        </SidebarGroupLabel>
        <SidebarMenuSub className='mx-0 border-l-0 px-0'>
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <SidebarMenuSubItem key={session.id}>
                <div className='group/session-row flex items-center gap-0.5'>
                  <SidebarMenuSubButton
                    className='flex-1 pr-1'
                    isActive={session.id === activeSessionId}
                    onClick={() => handleSelectSession(session)}
                  >
                    <span className='min-w-0 flex-1 truncate whitespace-nowrap'>
                      {session.title}
                    </span>
                  </SidebarMenuSubButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          className='text-muted-foreground hover:bg-muted hover:text-foreground data-popup-open:bg-muted flex size-7 shrink-0 items-center justify-center rounded-md outline-none'
                          type='button'
                          aria-label={t('More actions')}
                        />
                      }
                    >
                      <MoreHorizontalIcon className='size-4' />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align='end'
                      className='w-36'
                      side='right'
                      sideOffset={8}
                    >
                      <DropdownMenuItem
                        onClick={() => handleTogglePin(session)}
                      >
                        {session.pinnedAt ? (
                          <PinOffIcon className='size-4' />
                        ) : (
                          <PinIcon className='size-4' />
                        )}
                        {session.pinnedAt ? t('Unpin chat') : t('Pin chat')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteSession(session)}
                        variant='destructive'
                      >
                        <Trash2Icon className='size-4' />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SidebarMenuSubItem>
            ))
          ) : (
            <SidebarMenuSubItem>
              <div className='text-muted-foreground px-2 py-1.5 text-xs'>
                {t('No recent chats')}
              </div>
            </SidebarMenuSubItem>
          )}
        </SidebarMenuSub>
      </SidebarMenuItem>
    </>
  )
}
