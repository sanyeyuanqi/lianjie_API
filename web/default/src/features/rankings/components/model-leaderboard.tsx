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
import { getLobeIcon } from '@/lib/lobe-icon'
import { formatTokens } from '../lib/format'
import type { ModelRanking } from '../types'
import { ModelLink, VendorLink } from './entity-links'
import { GrowthText } from './growth-text'

type ModelLeaderboardProps = {
  rows: ModelRanking[]
  /** Density variant. `compact` is used inside per-category sections; the
   * default fits the larger overall "Top Models" section. */
  variant?: 'default' | 'compact'
  /** Optional cap (rows beyond this are dropped). */
  limit?: number
}

/**
 * Two-column model leaderboard list: "rank · model
 * (with vendor below) · tokens (with growth below)" rendering. Splits
 * `rows` evenly between the two columns so the visual rhythm matches a
 * single ranked list rather than two independent lists.
 *
 * Both the model name and vendor name are clickable: model jumps to
 * `/pricing/{modelName}` and vendor jumps to `/pricing?vendor={vendor}`.
 */
export function ModelLeaderboard(props: ModelLeaderboardProps) {
  const limited = props.limit ? props.rows.slice(0, props.limit) : props.rows
  const half = Math.ceil(limited.length / 2)
  const left = limited.slice(0, half)
  const right = limited.slice(half)
  const variant = props.variant ?? 'default'

  if (limited.length === 0) {
    return null
  }

  return (
    <div className='grid grid-cols-1 gap-x-5 md:grid-cols-2'>
      <ModelList rows={left} variant={variant} />
      {right.length > 0 && <ModelList rows={right} variant={variant} />}
    </div>
  )
}

function ModelList(props: {
  rows: ModelRanking[]
  variant: 'default' | 'compact'
}) {
  const { t } = useTranslation()
  const compact = props.variant === 'compact'
  return (
    <ul>
      {props.rows.map((row) => (
        <li
          key={row.model_name}
          className={
            compact
              ? 'flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-950/[0.035] dark:hover:bg-white/[0.055]'
              : 'flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-slate-950/[0.035] dark:hover:bg-white/[0.055]'
          }
        >
          <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-semibold text-slate-500 tabular-nums dark:bg-white/10 dark:text-slate-400'>
            {row.rank}
          </span>
          <span className='shrink-0'>
            {getLobeIcon(row.vendor_icon, compact ? 20 : 22)}
          </span>
          <div className='min-w-0 flex-1'>
            <ModelLink
              modelName={row.model_name}
              className={
                compact
                  ? 'block truncate font-mono text-xs font-medium text-slate-950 dark:text-slate-100'
                  : 'block truncate font-mono text-sm font-medium text-slate-950 dark:text-slate-100'
              }
            >
              {row.model_name}
            </ModelLink>
            <p
              className={
                compact
                  ? 'truncate text-[11px] text-slate-500 italic dark:text-slate-400'
                  : 'truncate text-xs text-slate-500 italic dark:text-slate-400'
              }
            >
              by{' '}
              <VendorLink vendor={row.vendor}>
                {row.vendor.toLowerCase()}
              </VendorLink>
            </p>
          </div>
          <div className='shrink-0 text-right'>
            <div
              className={
                compact
                  ? 'font-mono text-xs font-semibold text-slate-950 tabular-nums dark:text-slate-100'
                  : 'font-mono text-sm font-semibold text-slate-950 tabular-nums dark:text-slate-100'
              }
            >
              {formatTokens(row.total_tokens)}
              {!compact && (
                <>
                  {' '}
                  <span className='font-normal text-slate-400 dark:text-slate-500'>
                    {t('tokens')}
                  </span>
                </>
              )}
            </div>
            <GrowthText
              value={row.growth_pct}
              className={compact ? 'text-[10px]' : 'text-[11px]'}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
