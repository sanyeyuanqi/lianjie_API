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
import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { formatNumber, formatQuota } from '@/lib/format'
import { computeTimeRange } from '@/lib/time'
import { Skeleton } from '@/components/ui/skeleton'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { useModelStatCardsConfig } from '@/features/dashboard/hooks/use-dashboard-config'
import {
  buildQueryParams,
  calculateDashboardStats,
  getDefaultDays,
} from '@/features/dashboard/lib'
import type {
  QuotaDataItem,
  DashboardFilters,
} from '@/features/dashboard/types'

interface LogStatCardsProps {
  filters?: DashboardFilters
  onDataUpdate?: (data: QuotaDataItem[], loading: boolean) => void
}

const MODEL_QUOTA_STALE_TIME = 60_000

export function LogStatCards(props: LogStatCardsProps) {
  const statCardsConfig = useModelStatCardsConfig()
  const user = useAuthStore((state) => state.auth.user)
  const isAdmin = !!(user?.role && user.role >= 10)

  const { filters, onDataUpdate } = props
  const timeRange = useMemo(
    () =>
      computeTimeRange(
        getDefaultDays(filters?.time_granularity),
        filters?.start_timestamp,
        filters?.end_timestamp
      ),
    [
      filters?.time_granularity,
      filters?.start_timestamp,
      filters?.end_timestamp,
    ]
  )
  const queryParams = useMemo(
    () => buildQueryParams(timeRange, filters),
    [timeRange, filters]
  )
  const timeRangeMinutes = useMemo(
    () => (timeRange.end_timestamp - timeRange.start_timestamp) / 60,
    [timeRange]
  )

  const quotaQuery = useQuery({
    queryKey: ['dashboard', 'model-quota', isAdmin, queryParams],
    queryFn: async () => {
      const res = await getUserQuotaDates(queryParams, isAdmin)
      return res?.data || []
    },
    staleTime: MODEL_QUOTA_STALE_TIME,
    refetchOnWindowFocus: false,
  })

  const data = quotaQuery.data ?? []
  const stats = useMemo(() => calculateDashboardStats(data), [data])
  const loading = quotaQuery.isLoading
  const error = quotaQuery.isError

  useEffect(() => {
    onDataUpdate?.(data, quotaQuery.isFetching && data.length === 0)
  }, [data, quotaQuery.isFetching, onDataUpdate])

  const adaptedStats = useMemo(
    () => ({
      rpm: stats?.totalCount ?? 0,
      quota: stats?.totalQuota ?? 0,
      tpm: stats?.totalTokens ?? 0,
    }),
    [stats]
  )

  const items = useMemo(
    () =>
      statCardsConfig.map((config) => ({
        title: config.title,
        value:
          config.key === 'quota'
            ? formatQuota(config.getValue(adaptedStats, timeRangeMinutes))
            : formatNumber(config.getValue(adaptedStats, timeRangeMinutes)),
        desc: config.description,
        icon: config.icon,
      })),
    [statCardsConfig, adaptedStats, timeRangeMinutes]
  )

  return (
    <div className='overflow-hidden rounded-lg border'>
      <div className='divide-border/60 grid grid-cols-2 divide-x sm:grid-cols-3 lg:grid-cols-5'>
        {items.map((it, idx) => {
          const Icon = it.icon
          return (
            <div
              key={it.title}
              className={`px-3 py-2.5 sm:px-5 sm:py-4 ${idx === items.length - 1 && items.length % 2 !== 0 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className='flex items-center gap-2'>
                <Icon className='text-muted-foreground/60 size-3.5 shrink-0' />
                <div className='text-muted-foreground truncate text-xs font-medium tracking-wider uppercase'>
                  {it.title}
                </div>
              </div>

              {loading ? (
                <div className='mt-2 space-y-1.5'>
                  <Skeleton className='h-7 w-20' />
                  <Skeleton className='h-3.5 w-28' />
                </div>
              ) : error ? (
                <>
                  <div className='text-muted-foreground mt-1.5 font-mono text-lg font-bold tracking-tight tabular-nums sm:mt-2 sm:text-2xl'>
                    --
                  </div>
                  <div className='text-muted-foreground/40 mt-1 hidden text-xs md:block'>
                    {it.desc}
                  </div>
                </>
              ) : (
                <>
                  <div className='text-foreground mt-1.5 font-mono text-lg font-bold tracking-tight tabular-nums sm:mt-2 sm:text-2xl'>
                    {it.value}
                  </div>
                  <div className='text-muted-foreground/60 mt-1 hidden text-xs md:block'>
                    {it.desc}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
