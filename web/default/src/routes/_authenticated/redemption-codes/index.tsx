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
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import {
  asEnumArray,
  asNumber,
  asString,
  compactSearch,
} from '@/lib/route-search'
import { Redemptions } from '@/features/redemption-codes'
import { REDEMPTION_STATUS_VALUES } from '@/features/redemption-codes/constants'

type RedemptionsSearch = {
  page?: number
  pageSize?: number
  filter?: string
  status?: (typeof REDEMPTION_STATUS_VALUES)[number][]
}

export const Route = createFileRoute('/_authenticated/redemption-codes/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()

    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({
        to: '/403',
      })
    }
  },
  validateSearch: (search): RedemptionsSearch =>
    compactSearch({
      page: asNumber(search.page, 1),
      pageSize: asNumber(search.pageSize, 10),
      filter: asString(search.filter),
      status: asEnumArray(search.status, REDEMPTION_STATUS_VALUES),
    }),
  component: Redemptions,
})
