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
import { getFreshModuleAccess } from '@/lib/nav-modules'
import {
  asBoolean,
  asEnum,
  asOptionalString,
  compactSearch,
} from '@/lib/route-search'
import { Pricing } from '@/features/pricing'

const TOKEN_UNITS = ['M', 'K'] as const
const PRICING_VIEWS = ['card', 'table'] as const
type PricingSearch = {
  search?: string
  sort?: string
  vendor?: string
  group?: string
  quotaType?: string
  endpointType?: string
  tag?: string
  tokenUnit?: (typeof TOKEN_UNITS)[number]
  view?: (typeof PRICING_VIEWS)[number]
  rechargePrice?: boolean
}

export const Route = createFileRoute('/pricing/')({
  validateSearch: (search): PricingSearch =>
    compactSearch({
      search: asOptionalString(search.search),
      sort: asOptionalString(search.sort),
      vendor: asOptionalString(search.vendor),
      group: asOptionalString(search.group),
      quotaType: asOptionalString(search.quotaType),
      endpointType: asOptionalString(search.endpointType),
      tag: asOptionalString(search.tag),
      tokenUnit: asEnum(search.tokenUnit, TOKEN_UNITS),
      view: asEnum(search.view, PRICING_VIEWS),
      rechargePrice: asBoolean(search.rechargePrice),
    }),
  beforeLoad: async ({ location }) => {
    const access = await getFreshModuleAccess('pricing')
    if (!access.enabled) {
      throw redirect({ to: '/' })
    }
    if (access.requireAuth) {
      const { auth } = useAuthStore.getState()
      if (!auth.user) {
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.href },
        })
      }
    }
  },
  component: Pricing,
})
