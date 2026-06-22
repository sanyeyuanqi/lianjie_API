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
import { useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useChatSessionsSidebar } from '@/context/chat-sessions-sidebar-provider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SidebarContent, SidebarMenu } from '@/components/ui/sidebar'
import { PlaygroundSessionsItem } from './playground-sessions-item'

export function ChatSessionsSidebar() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { desktopOpen, mobileOpen, setMobileOpen } = useChatSessionsSidebar()
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/')

  if (!isChatPage) {
    return null
  }

  return (
    <>
      <aside
        aria-label='Chat sessions'
        className={cn(
          'hidden h-[calc(100svh-var(--app-header-height,0px))] shrink-0 overflow-hidden py-2 pr-2 transition-[width,opacity,padding] duration-200 ease-out md:flex',
          desktopOpen ? 'w-[10.75rem] opacity-100' : 'w-0 pr-0 opacity-0'
        )}
      >
        <ChatSessionsPanel />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side='left'
          className='top-2 bottom-2 left-2 h-auto w-[min(68vw,17.5rem)] rounded-[1.5rem] border border-slate-200/80 bg-white/94 p-0 shadow-[18px_18px_58px_rgba(15,23,42,0.20),0_1px_0_rgba(255,255,255,0.86)_inset] backdrop-blur-2xl md:hidden dark:border-white/10 dark:bg-zinc-950/94 dark:shadow-[18px_18px_64px_rgba(0,0,0,0.58),0_1px_0_rgba(255,255,255,0.08)_inset]'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>Chat sessions</SheetTitle>
          </SheetHeader>
          <ChatSessionsPanel />
        </SheetContent>
      </Sheet>
    </>
  )
}

function ChatSessionsPanel() {
  return (
    <div className='border-sidebar-border bg-background flex size-full flex-col overflow-hidden rounded-lg border shadow-sm md:rounded-lg'>
      <SidebarContent className='px-3 py-3'>
        <SidebarMenu>
          <PlaygroundSessionsItem />
        </SidebarMenu>
      </SidebarContent>
    </div>
  )
}
