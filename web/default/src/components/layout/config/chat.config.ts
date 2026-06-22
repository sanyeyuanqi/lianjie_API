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
import { type TFunction } from 'i18next'
import { FlaskConical, MessageSquare } from 'lucide-react'
import { isSidebarModuleEnabled } from '@/lib/nav-modules'
import type { NavGroup, SidebarView } from '../types'

function getChatNavGroups(t: TFunction): NavGroup[] {
  const navGroups: NavGroup[] = []

  if (isSidebarModuleEnabled('chat', 'playground')) {
    navGroups.push({
      id: 'playground',
      title: '',
      items: [
        {
          title: t('Playground'),
          url: '/playground',
          icon: FlaskConical,
        },
      ],
    })
  }

  if (isSidebarModuleEnabled('chat', 'chat')) {
    navGroups.push({
      id: 'chat',
      title: t('Features'),
      items: [
        {
          title: t('Conversation'),
          url: '/chat',
          icon: MessageSquare,
        },
        {
          title: t('Chat'),
          icon: MessageSquare,
          type: 'chat-presets',
          variant: 'flat',
        },
      ],
    })
  }

  return navGroups
}

export const CHAT_VIEW: SidebarView = {
  id: 'chat',
  pathPattern: /^\/(chat|playground)(\/|$)/,
  parent: {
    to: '/dashboard/overview',
    label: 'Back to Dashboard',
  },
  getNavGroups: getChatNavGroups,
}
