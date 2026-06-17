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
import { useLocation, useNavigate } from '@tanstack/react-router'
import {
  MessageSquarePlusIcon,
  MoreHorizontalIcon,
  Pencil,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
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
  CHAT_SESSIONS_CHANGED_EVENT,
  createChatSession,
  loadActiveChatSessionId,
  loadChatSessions,
  notifyChatSessionsChanged,
  saveActiveChatSessionId,
  saveChatMessages,
  saveChatSessions,
  sortChatSessions,
} from '@/features/chat/lib/local-chat-storage'
import type { PlaygroundSession } from '@/features/playground/types'

export function PlaygroundSessionsItem() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setOpenMobile } = useSidebar()
  const [sessions, setSessions] = useState<PlaygroundSession[]>(() =>
    loadChatSessions()
  )
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    loadActiveChatSessionId()
  )
  const [renameSession, setRenameSession] = useState<PlaygroundSession | null>(
    null
  )
  const [renameTitle, setRenameTitle] = useState('')

  const recentSessions = useMemo(
    () =>
      sessions.filter((session) => session.messages.length > 0).slice(0, 24),
    [sessions]
  )
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/')
  const activeSession = sessions.find((session) => session.id === activeSessionId)
  const isNewChatActive =
    isChatPage && (!activeSession || activeSession.messages.length === 0)

  useEffect(() => {
    const sync = () => {
      setSessions(loadChatSessions())
      setActiveSessionId(loadActiveChatSessionId())
    }

    window.addEventListener(CHAT_SESSIONS_CHANGED_EVENT, sync)

    return () => {
      window.removeEventListener(CHAT_SESSIONS_CHANGED_EVENT, sync)
    }
  }, [])

  const goChat = () => {
    setOpenMobile(false)
    void navigate({ to: '/chat' })
  }

  const handleNewSession = () => {
    const session = createChatSession()
    const updatedSessions = [session, ...loadChatSessions()]

    saveChatSessions(updatedSessions)
    saveActiveChatSessionId(session.id)
    saveChatMessages([])
    setSessions(updatedSessions)
    setActiveSessionId(session.id)
    notifyChatSessionsChanged()
    goChat()
  }

  const handleSelectSession = (session: PlaygroundSession) => {
    saveActiveChatSessionId(session.id)
    saveChatMessages(session.messages)
    setActiveSessionId(session.id)
    notifyChatSessionsChanged()
    goChat()
  }

  const handleTogglePin = (session: PlaygroundSession) => {
    const updatedSessions = sortChatSessions(
      loadChatSessions().map((item) =>
        item.id === session.id
          ? {
              ...item,
              pinnedAt: item.pinnedAt ? null : Date.now(),
            }
          : item
      )
    )

    saveChatSessions(updatedSessions)
    setSessions(updatedSessions)
    notifyChatSessionsChanged()
  }

  const handleOpenRename = (session: PlaygroundSession) => {
    setRenameSession(session)
    setRenameTitle(session.title)
  }

  const handleRenameSession = () => {
    if (!renameSession) return

    const nextTitle = renameTitle.trim()
    if (!nextTitle) return

    const updatedSessions = sortChatSessions(
      loadChatSessions().map((item) =>
        item.id === renameSession.id
          ? {
              ...item,
              title: nextTitle,
              customTitle: true,
              updatedAt: Date.now(),
            }
          : item
      )
    )

    saveChatSessions(updatedSessions)
    setSessions(updatedSessions)
    setRenameSession(null)
    setRenameTitle('')
    notifyChatSessionsChanged()
  }

  const handleDeleteSession = (session: PlaygroundSession) => {
    const remainingSessions = loadChatSessions().filter(
      (item) => item.id !== session.id
    )
    const nextSessions =
      remainingSessions.length > 0
        ? sortChatSessions(remainingSessions)
        : [createChatSession()]
    const nextActiveSession =
      session.id === activeSessionId
        ? nextSessions[0]
        : nextSessions.find((item) => item.id === activeSessionId) ||
          nextSessions[0]

    saveChatSessions(nextSessions)
    saveActiveChatSessionId(nextActiveSession.id)
    saveChatMessages(nextActiveSession.messages)
    setSessions(nextSessions)
    setActiveSessionId(nextActiveSession.id)
    notifyChatSessionsChanged()
  }

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isNewChatActive}
          onClick={handleNewSession}
          tooltip={t('New chat')}
        >
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
                    isActive={isChatPage && session.id === activeSessionId}
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
                          className='text-muted-foreground hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:opacity-100 group-hover/session-row:opacity-100 focus-visible:opacity-100 flex size-7 shrink-0 items-center justify-center rounded-md opacity-0 outline-none transition-opacity'
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
                        onClick={() => handleOpenRename(session)}
                      >
                        <Pencil className='size-4' />
                        {t('Rename')}
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

      <Dialog
        open={renameSession !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameSession(null)
            setRenameTitle('')
          }
        }}
      >
        <DialogContent className='max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 p-0 shadow-[0_22px_70px_rgba(15,23,42,0.14)] ring-zinc-950/10 sm:max-w-[420px] dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:ring-white/10'>
          <DialogHeader className='px-5 pt-5 pb-3'>
            <DialogTitle className='text-[15px] font-semibold tracking-normal'>
              {t('Rename chat')}
            </DialogTitle>
          </DialogHeader>
          <form
            className='px-5 pb-5'
            onSubmit={(event) => {
              event.preventDefault()
              handleRenameSession()
            }}
          >
            <Input
              autoFocus
              className='h-9 rounded-xl border-zinc-200 bg-zinc-50/70 px-3 text-[14px] shadow-none transition-colors focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-900/70 dark:focus-visible:border-zinc-600 dark:focus-visible:ring-white/10'
              maxLength={80}
              onChange={(event) => setRenameTitle(event.target.value)}
              placeholder={t('Name')}
              value={renameTitle}
            />
            <DialogFooter className='-mx-5 -mb-5 mt-5 flex-row justify-end gap-2 border-t border-zinc-200/70 bg-zinc-50/55 px-5 py-4 dark:border-zinc-800/80 dark:bg-zinc-900/45'>
              <DialogClose
                render={
                  <Button
                    className='h-8 rounded-lg border-zinc-200 bg-white/80 px-4 text-[13px] font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-200 dark:hover:bg-zinc-900'
                    variant='outline'
                    type='button'
                  />
                }
              >
                {t('Cancel')}
              </DialogClose>
              <Button
                className='h-8 rounded-lg bg-zinc-950 px-4 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(24,24,27,0.18)] hover:bg-zinc-800 disabled:shadow-none dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200'
                disabled={!renameTitle.trim()}
                type='submit'
              >
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
