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
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'
import { formatShare, formatTokens } from './lib/format'
import {
  MarketShareSection,
  ModelsSection,
  PulseSection,
  RankingsHero,
} from './components'
import { useRankings } from './hooks/use-rankings'
import type { RankingPeriod, RankingsSnapshot } from './types'

const VALID_PERIODS: RankingPeriod[] = ['today', 'week', 'month', 'year', 'all']

export function Rankings() {
  const { t } = useTranslation()
  const search = useSearch({ from: '/rankings/' })
  const navigate = useNavigate()

  const period: RankingPeriod = VALID_PERIODS.includes(
    search.period as RankingPeriod
  )
    ? (search.period as RankingPeriod)
    : 'week'

  const rankingsQuery = useRankings(period)
  const snapshot = rankingsQuery.data?.data

  const handlePeriodChange = (next: RankingPeriod) => {
    navigate({
      to: '/rankings',
      search: (prev) => ({ ...prev, period: next }),
    })
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative'>
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-20 dark:opacity-[0.10]'
          style={{
            background: [
              'radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%)',
              'radial-gradient(ellipse 50% 40% at 80% 15%, oklch(0.65 0.15 200 / 60%) 0%, transparent 70%)',
              'radial-gradient(ellipse 40% 35% at 50% 70%, oklch(0.70 0.12 280 / 40%) 0%, transparent 70%)',
            ].join(', '),
            maskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 40%, transparent 100%)',
          }}
        />
        <PageTransition className='relative mx-auto w-full max-w-[1500px] space-y-5 px-3 pt-20 pb-10 sm:px-5 sm:pt-24 sm:pb-12 xl:px-6'>
          <RankingsHero
            period={period}
            onPeriodChange={handlePeriodChange}
            snapshot={snapshot}
          />

          {rankingsQuery.isLoading ? (
            <RankingsLoading />
          ) : !snapshot ? (
            <RankingsError
              message={
                rankingsQuery.error instanceof Error
                  ? rankingsQuery.error.message
                  : t('Unable to load rankings data')
              }
            />
          ) : (
            <div className='space-y-5'>
              <RankingStats snapshot={snapshot} />

              <div className='grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.85fr)]'>
                <ModelsSection
                  history={snapshot.models_history}
                  rows={snapshot.models}
                  period={period}
                />

                <MarketShareSection
                  history={snapshot.vendor_share_history}
                  rows={snapshot.vendors}
                  period={period}
                />
              </div>
              <PulseSection
                movers={snapshot.top_movers}
                droppers={snapshot.top_droppers}
              />
            </div>
          )}
        </PageTransition>
      </div>
    </PublicLayout>
  )
}

function RankingStats(props: { snapshot: RankingsSnapshot }) {
  const { t } = useTranslation()
  const totalTokens = props.snapshot.models.reduce(
    (sum, row) => sum + row.total_tokens,
    0
  )
  const topModel = props.snapshot.models[0]
  const topVendor = props.snapshot.vendors[0]
  const activeModels = props.snapshot.models.length
  const activeVendors = props.snapshot.vendors.length

  const stats = [
    {
      label: t('Token volume'),
      value: formatTokens(totalTokens),
      helper: t('Total routed tokens'),
    },
    {
      label: t('Top model'),
      value: topModel?.model_name || t('No data'),
      helper: topModel ? formatShare(topModel.share) : t('Awaiting data'),
    },
    {
      label: t('Top vendor'),
      value: topVendor?.vendor || t('No data'),
      helper: topVendor ? formatShare(topVendor.share) : t('Awaiting data'),
    },
    {
      label: t('Active rankings'),
      value: `${activeModels}/${activeVendors}`,
      helper: t('Models / vendors'),
    },
  ]

  return (
    <section className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className='rounded-2xl border border-white/70 bg-white/62 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]'
        >
          <div className='text-xs font-medium text-slate-500 dark:text-slate-400'>
            {stat.label}
          </div>
          <div className='mt-6 truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100'>
            {stat.value}
          </div>
          <div className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
            {stat.helper}
          </div>
        </div>
      ))}
    </section>
  )
}

function RankingsLoading() {
  return (
    <div className='space-y-5'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-28 rounded-2xl' />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.85fr)]'>
        <Skeleton className='h-[560px] rounded-2xl' />
        <Skeleton className='h-[560px] rounded-2xl' />
      </div>
      <Skeleton className='h-48 rounded-2xl' />
    </div>
  )
}

function RankingsError(props: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className='rounded-2xl border border-dashed border-slate-200/80 bg-white/60 px-6 py-12 text-center shadow-[0_18px_55px_rgba(15,23,42,0.05)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]'>
      <h2 className='text-base font-semibold text-slate-950 dark:text-slate-100'>
        {t('Unable to load rankings')}
      </h2>
      <p className='mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400'>
        {props.message}
      </p>
    </div>
  )
}
