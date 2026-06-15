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
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'
import type { RankingMover } from '../types'
import { ModelLink, VendorLink } from './entity-links'

type PulseSectionProps = {
  movers: RankingMover[]
  droppers: RankingMover[]
}

/**
 * Rank movement panel: gainers and losers calculated from the previous period.
 */
export function PulseSection(props: PulseSectionProps) {
  const { t } = useTranslation()

  return (
    <section className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
      <PulseCard
        title={t('Trending up')}
        description={t('Models climbing the leaderboard')}
      >
        {props.movers.length === 0 ? (
          <PulseEmpty label={t('No notable climbers right now')} />
        ) : (
          <ul>
            {props.movers.map((row) => (
              <MoverRow key={row.model_name} row={row} intent='up' />
            ))}
          </ul>
        )}
      </PulseCard>

      <PulseCard
        title={t('Trending down')}
        description={t('Models losing positions')}
      >
        {props.droppers.length === 0 ? (
          <PulseEmpty label={t('No notable drops right now')} />
        ) : (
          <ul>
            {props.droppers.map((row) => (
              <MoverRow key={row.model_name} row={row} intent='down' />
            ))}
          </ul>
        )}
      </PulseCard>
    </section>
  )
}

function PulseCard(props: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className='overflow-hidden rounded-3xl border border-white/70 bg-white/62 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]'>
      <header className='border-b border-slate-200/70 px-5 py-4 dark:border-white/10'>
        <h3 className='inline-flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100'>
          {props.title}
        </h3>
        <p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
          {props.description}
        </p>
      </header>
      <div className='p-3'>{props.children}</div>
    </div>
  )
}

function PulseEmpty(props: { label: string }) {
  return (
    <div className='rounded-2xl border border-dashed border-slate-200/80 bg-white/42 px-4 py-6 text-center text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400'>
      {props.label}
    </div>
  )
}

function MoverRow(props: { row: RankingMover; intent: 'up' | 'down' }) {
  return (
    <li className='flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-slate-950/[0.035] dark:hover:bg-white/[0.055]'>
      <span className='shrink-0'>{getLobeIcon(props.row.vendor_icon, 20)}</span>
      <div className='min-w-0 flex-1'>
        <ModelLink
          modelName={props.row.model_name}
          className='block truncate font-mono text-xs font-medium text-slate-950 dark:text-slate-100'
        >
          {props.row.model_name}
        </ModelLink>
        <p className='truncate text-[11px] text-slate-500 dark:text-slate-400'>
          #{props.row.current_rank} ·{' '}
          <VendorLink vendor={props.row.vendor}>
            {props.row.vendor.toLowerCase()}
          </VendorLink>
        </p>
      </div>
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-0.5 font-mono text-xs font-semibold tabular-nums',
          props.intent === 'up'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        )}
      >
        {props.intent === 'up' ? (
          <ArrowUpRight className='size-3' />
        ) : (
          <ArrowDownRight className='size-3' />
        )}
        {Math.abs(props.row.rank_delta)}
      </span>
    </li>
  )
}
