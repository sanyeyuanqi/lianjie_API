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
import { createContext, useContext, useMemo, useState } from 'react'

type ChatSessionsSidebarContextType = {
  desktopOpen: boolean
  setDesktopOpen: (open: boolean) => void
  toggleDesktopOpen: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggleMobileOpen: () => void
}

const ChatSessionsSidebarContext =
  createContext<ChatSessionsSidebarContextType | null>(null)

export function ChatSessionsSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const value = useMemo(
    () => ({
      desktopOpen,
      setDesktopOpen,
      toggleDesktopOpen: () => setDesktopOpen((current) => !current),
      mobileOpen,
      setMobileOpen,
      toggleMobileOpen: () => setMobileOpen((current) => !current),
    }),
    [desktopOpen, mobileOpen]
  )

  return (
    <ChatSessionsSidebarContext value={value}>
      {children}
    </ChatSessionsSidebarContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatSessionsSidebar() {
  const context = useContext(ChatSessionsSidebarContext)

  if (!context) {
    throw new Error(
      'useChatSessionsSidebar must be used within a ChatSessionsSidebarProvider'
    )
  }

  return context
}
