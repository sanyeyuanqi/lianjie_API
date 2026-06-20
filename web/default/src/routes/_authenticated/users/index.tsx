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
import {
  createFileRoute,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import {
  asEnumArray,
  asNumber,
  asString,
  compactSearch,
} from '@/lib/route-search'

const USER_STATUSES = ['-1', '1', '2'] as const
const USER_ROLES = ['1', '10', '100'] as const
type UsersSearch = {
  page?: number
  pageSize?: number
  filter?: string
  status?: (typeof USER_STATUSES)[number][]
  role?: (typeof USER_ROLES)[number][]
  group?: string
}

export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({
        to: '/403',
      })
    }
  },
  validateSearch: (search): UsersSearch =>
    compactSearch({
      page: asNumber(search.page, 1),
      pageSize: asNumber(search.pageSize),
      filter: asString(search.filter),
      status: asEnumArray(search.status, USER_STATUSES),
      role: asEnumArray(search.role, USER_ROLES),
      group: asString(search.group),
    }),
  component: lazyRouteComponent(() => import('@/features/users'), 'Users'),
})
