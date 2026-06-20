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
  asNumber,
  asString,
  asStringArray,
  compactSearch,
} from '@/lib/route-search'

const MODELS_SECTION_IDS = ['metadata', 'deployments'] as const
const MODELS_DEFAULT_SECTION = MODELS_SECTION_IDS[0]
type ModelsSearch = {
  page?: number
  pageSize?: number
  filter?: string
  vendor?: string[]
  status?: string[]
  sync?: string[]
  dPage?: number
  dPageSize?: number
  dFilter?: string
  dStatus?: string[]
}

export const Route = createFileRoute('/_authenticated/models/$section')({
  beforeLoad: ({ params }) => {
    const { auth } = useAuthStore.getState()

    if (!auth.user || auth.user.role < ROLE.ADMIN) {
      throw redirect({
        to: '/403',
      })
    }

    const validSections = MODELS_SECTION_IDS as unknown as string[]
    if (!validSections.includes(params.section)) {
      throw redirect({
        to: '/models/$section',
        params: { section: MODELS_DEFAULT_SECTION },
      })
    }
  },
  validateSearch: (search): ModelsSearch =>
    compactSearch({
      page: asNumber(search.page, 1),
      pageSize: asNumber(search.pageSize, 10),
      filter: asString(search.filter),
      vendor: asStringArray(search.vendor),
      status: asStringArray(search.status),
      sync: asStringArray(search.sync),
      dPage: asNumber(search.dPage, 1),
      dPageSize: asNumber(search.dPageSize, 10),
      dFilter: asString(search.dFilter),
      dStatus: asStringArray(search.dStatus),
    }),
  component: lazyRouteComponent(() => import('@/features/models'), 'Models'),
})
