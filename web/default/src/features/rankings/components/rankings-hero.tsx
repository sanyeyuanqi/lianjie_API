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
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { formatTokens } from '../lib/format'
import type { RankingPeriod, RankingsSnapshot } from '../types'

const PERIODS: { id: RankingPeriod; labelKey: string }[] = [
  { id: 'today', labelKey: 'Today' },
  { id: 'week', labelKey: 'Week' },
  { id: 'month', labelKey: 'Month' },
  { id: 'year', labelKey: 'Year' },
  { id: 'all', labelKey: 'All-time' },
]

type RankingsHeroProps = {
  period: RankingPeriod
  onPeriodChange: (period: RankingPeriod) => void
  snapshot?: RankingsSnapshot
}

export function RankingsHero(props: RankingsHeroProps) {
  const { t } = useTranslation()
  const totalTokens =
    props.snapshot?.models.reduce((sum, row) => sum + row.total_tokens, 0) ?? 0

  return (
    <section className='rounded-xl border border-white/70 bg-white/64 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-4 dark:border-white/10 dark:bg-white/[0.045]'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='inline-flex h-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/74 px-4 text-xs font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400'>
          <span className='tracking-widest uppercase'>{t('tokens')}:</span>
          <span className='ml-2 font-mono text-sm font-semibold text-slate-950 tabular-nums dark:text-slate-100'>
            {formatTokens(totalTokens)}
          </span>
        </div>

        <div className='flex justify-end'>
          <div
            role='tablist'
            aria-label={t('Period')}
            className='inline-flex h-10 items-center rounded-full border border-slate-200/80 bg-white/74 p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.06]'
          >
            {PERIODS.map((p) => {
              const isActive = props.period === p.id
              return (
                <button
                  key={p.id}
                  role='tab'
                  type='button'
                  aria-selected={isActive}
                  onClick={() => props.onPeriodChange(p.id)}
                  className={cn(
                    'h-8 rounded-full px-3 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:outline-none',
                    isActive
                      ? 'bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950'
                      : 'text-slate-500 hover:bg-slate-950/[0.04] hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100'
                  )}
                >
                  {t(p.labelKey)}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
