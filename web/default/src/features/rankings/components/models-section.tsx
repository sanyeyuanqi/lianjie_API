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
import { useMemo } from 'react'
import { VChart } from '@visactor/react-vchart'
import { useTranslation } from 'react-i18next'
import { useChartTheme } from '@/lib/use-chart-theme'
import { VCHART_OPTION } from '@/lib/vchart'
import { formatTokens } from '../lib/format'
import type { ModelHistorySeries, ModelRanking, RankingPeriod } from '../types'
import { ModelLeaderboard } from './model-leaderboard'

const PERIOD_DESCRIPTIONS: Record<RankingPeriod, string> = {
  today: 'Hourly token usage by model across the last 24 hours',
  week: 'Weekly token usage by model across the past few weeks',
  month: 'Daily token usage by model across the past month',
  year: 'Weekly token usage by model across the past year',
  all: 'Token usage by model since launch',
}

const TOOLTIP_MAX_ROWS = 10

type ModelsSectionProps = {
  history: ModelHistorySeries
  rows: ModelRanking[]
  period: RankingPeriod
}

/**
 * Combined "Top Models" card: a stacked bar chart showing token usage by
 * model over time, paired below with a two-column LLM Leaderboard. The
 * chart anchors the eye while the leaderboard provides the detailed key.
 */
export function ModelsSection(props: ModelsSectionProps) {
  const { t } = useTranslation()
  const { resolvedTheme, themeReady } = useChartTheme()
  const chartTextColor =
    resolvedTheme === 'dark'
      ? 'rgba(255, 255, 255, 0.68)'
      : 'rgba(15, 23, 42, 0.58)'
  const chartGridColor =
    resolvedTheme === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(15, 23, 42, 0.12)'

  // Order points so the largest model appears at the bottom of every stack.
  const orderedPoints = useMemo(() => {
    const order = new Map(
      props.history.models.map((m, idx) => [m.name, idx] as const)
    )
    return [...props.history.points].sort((a, b) => {
      const tsCmp = a.ts.localeCompare(b.ts)
      if (tsCmp !== 0) return tsCmp
      return (order.get(a.model) ?? 999) - (order.get(b.model) ?? 999)
    })
  }, [props.history])

  const totalTokens = useMemo(
    () => props.rows.reduce((s, r) => s + r.total_tokens, 0),
    [props.rows]
  )

  const spec = useMemo(() => {
    if (orderedPoints.length === 0) return null
    return {
      type: 'bar' as const,
      data: [{ id: 'models-history', values: orderedPoints }],
      xField: 'label',
      yField: 'tokens',
      seriesField: 'model',
      stack: true,
      legends: { visible: false },
      axes: [
        {
          orient: 'bottom',
          label: {
            style: { fill: chartTextColor, fontSize: 10 },
            autoHide: true,
            autoLimit: true,
          },
          tick: { visible: false },
        },
        {
          orient: 'left',
          label: {
            formatMethod: (val: number | string) => formatTokens(Number(val)),
            style: { fill: chartTextColor, fontSize: 10 },
          },
          grid: {
            visible: true,
            style: { lineDash: [3, 3], stroke: chartGridColor },
          },
        },
      ],
      tooltip: {
        mark: {
          content: [
            {
              key: (datum: Record<string, unknown>) =>
                String(datum?.model ?? ''),
              value: (datum: Record<string, unknown>) =>
                formatTokens(Number(datum?.tokens) || 0),
            },
          ],
        },
        dimension: {
          title: {
            value: (datum: Record<string, unknown>) =>
              String(datum?.label ?? ''),
          },
          content: [
            {
              key: (datum: Record<string, unknown>) =>
                String(datum?.model ?? ''),
              value: (datum: Record<string, unknown>) =>
                Number(datum?.tokens) || 0,
            },
          ],
          updateContent: (
            array: Array<{ key: string; value: string | number }>
          ) => {
            array.sort((a, b) => Number(b.value) - Number(a.value))
            const sum = array.reduce((s, x) => s + (Number(x.value) || 0), 0)
            const visible = array.slice(0, TOOLTIP_MAX_ROWS)
            const overflow = array.slice(TOOLTIP_MAX_ROWS)
            const result = visible.map((item) => ({
              key: item.key,
              value: formatTokens(Number(item.value) || 0),
            }))
            if (overflow.length > 0) {
              const otherSum = overflow.reduce(
                (s, item) => s + (Number(item.value) || 0),
                0
              )
              result.push({
                key: t('+{{count}} more', { count: overflow.length }),
                value: formatTokens(otherSum),
              })
            }
            result.unshift({ key: t('Total:'), value: formatTokens(sum) })
            return result
          },
        },
      },
      animationAppear: { duration: 500 },
    }
  }, [chartGridColor, chartTextColor, orderedPoints, t])

  return (
    <section className='overflow-hidden rounded-3xl border border-white/70 bg-white/62 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]'>
      {/* Chart block ----------------------------------------------------- */}
      <header className='flex items-start justify-between gap-4 px-5 py-4 sm:px-6'>
        <div className='min-w-0 flex-1'>
          <h2 className='inline-flex items-center gap-2 text-base font-semibold text-slate-950 dark:text-slate-100'>
            {t('Top Models')}
          </h2>
          <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>
            {t(PERIOD_DESCRIPTIONS[props.period])}
          </p>
        </div>
        <div className='shrink-0 text-right'>
          <div className='font-mono text-2xl font-semibold text-slate-950 tabular-nums dark:text-slate-100'>
            {formatTokens(totalTokens)}
          </div>
          <div className='text-[10px] font-medium tracking-widest text-slate-400 uppercase dark:text-slate-500'>
            {t('tokens')}
          </div>
        </div>
      </header>

      <div className='px-5 pb-5 sm:px-6'>
        <div className='h-64 rounded-2xl border border-slate-200/70 bg-white/42 p-3 dark:border-white/10 dark:bg-white/[0.035]'>
          {themeReady && spec ? (
            <VChart
              key={`models-history-${resolvedTheme}-${props.period}`}
              spec={{
                ...spec,
                theme: resolvedTheme === 'dark' ? 'dark' : 'light',
                background: 'transparent',
              }}
              option={VCHART_OPTION}
            />
          ) : (
            <ChartEmpty label={t('No history data available')} />
          )}
        </div>
      </div>

      {/* Leaderboard block ----------------------------------------------- */}
      <div className='border-t border-slate-200/70 dark:border-white/10'>
        <header className='px-5 pt-4 pb-2 sm:px-6'>
          <h3 className='inline-flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-100'>
            {t('LLM Leaderboard')}
          </h3>
          <p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
            {t('Compare the most popular models on the platform')}
          </p>
        </header>
        {props.rows.length === 0 ? (
          <div className='mx-5 mb-5 rounded-2xl border border-dashed border-slate-200/80 bg-white/42 px-5 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400 sm:mx-6'>
            {t('No models match the selected filters')}
          </div>
        ) : (
          <div className='px-5 pt-1 pb-5 sm:px-6'>
            <ModelLeaderboard rows={props.rows} />
          </div>
        )}
      </div>
    </section>
  )
}

function ChartEmpty(props: { label: string }) {
  return (
    <div className='flex h-full items-center justify-center'>
      <div className='rounded-full border border-dashed border-slate-200/80 bg-white/60 px-4 py-2 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400'>
        {props.label}
      </div>
    </div>
  )
}
