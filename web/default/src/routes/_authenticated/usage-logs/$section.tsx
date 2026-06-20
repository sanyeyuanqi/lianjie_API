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
import {
  asEnumArray,
  asNumber,
  asString,
  asStringArray,
  compactSearch,
} from '@/lib/route-search'

const USAGE_LOGS_SECTION_IDS = ['common', 'drawing', 'task'] as const
const USAGE_LOGS_DEFAULT_SECTION = USAGE_LOGS_SECTION_IDS[0]

function isUsageLogsSectionId(s: string) {
  return (USAGE_LOGS_SECTION_IDS as readonly string[]).includes(s)
}

const logTypeValues = ['0', '1', '2', '3', '4', '5', '6'] as const
type UsageLogsSearch = {
  page?: number
  pageSize?: number
  type?: (typeof logTypeValues)[number][]
  filter?: string
  model?: string
  token?: string
  channel?: string
  group?: string
  username?: string
  requestId?: string
  upstreamRequestId?: string
  startTime?: number
  endTime?: number
}

export const Route = createFileRoute('/_authenticated/usage-logs/$section')({
  beforeLoad: ({ params, search }) => {
    if (!isUsageLogsSectionId(params.section)) {
      throw redirect({
        to: '/usage-logs/$section',
        params: { section: USAGE_LOGS_DEFAULT_SECTION },
      })
    }
    // type 仅 common 使用，非 common 时清掉 URL 里的 type
    const rawSearch = search as Record<string, unknown>
    const hasTypeSearch =
      asStringArray(rawSearch.type).length > 0 ||
      (rawSearch.type != null && rawSearch.type !== '')
    if (params.section !== 'common' && hasTypeSearch) {
      throw redirect({
        to: '/usage-logs/$section',
        params: { section: params.section },
        search: { ...search, type: undefined },
        replace: true,
      })
    }
  },
  validateSearch: (search): UsageLogsSearch =>
    compactSearch({
      page: asNumber(search.page, 1),
      pageSize: asNumber(search.pageSize),
      type: asEnumArray(search.type, logTypeValues),
      filter: asString(search.filter),
      model: asString(search.model),
      token: asString(search.token),
      channel: asString(search.channel),
      group: asString(search.group),
      username: asString(search.username),
      requestId: asString(search.requestId),
      upstreamRequestId: asString(search.upstreamRequestId),
      startTime: asNumber(search.startTime),
      endTime: asNumber(search.endTime),
    }),
  component: lazyRouteComponent(
    () => import('@/features/usage-logs'),
    'UsageLogs'
  ),
})
