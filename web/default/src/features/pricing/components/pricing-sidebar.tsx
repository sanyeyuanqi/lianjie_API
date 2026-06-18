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
import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ENDPOINT_TYPES,
  FILTER_ALL,
  QUOTA_TYPES,
  getEndpointTypeLabels,
  getQuotaTypeLabels,
} from '../constants'
import { parseTags } from '../lib/filters'
import type { PricingModel, PricingVendor } from '../types'

type FilterOption = {
  value: string
  label: string
  count?: number
  suffix?: string
  icon?: ReactNode
}

type FilterSectionProps = {
  title: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}

export interface PricingSidebarProps {
  quotaTypeFilter: string
  endpointTypeFilter: string
  vendorFilter: string
  groupFilter: string
  tagFilter: string
  onQuotaTypeChange: (value: string) => void
  onEndpointTypeChange: (value: string) => void
  onVendorChange: (value: string) => void
  onGroupChange: (value: string) => void
  onTagChange: (value: string) => void
  vendors: PricingVendor[]
  groups: string[]
  groupRatios?: Record<string, number>
  tags: string[]
  models: PricingModel[]
  hasActiveFilters: boolean
  onClearFilters: () => void
  className?: string
  compact?: boolean
}

function countBy(
  models: PricingModel[],
  predicate: (model: PricingModel) => boolean
): number {
  return models.reduce((count, model) => count + (predicate(model) ? 1 : 0), 0)
}

function modelHasGroup(model: PricingModel, group: string): boolean {
  return group === FILTER_ALL || Boolean(model.enable_groups?.includes(group))
}

function modelHasVendor(model: PricingModel, vendor: string): boolean {
  return vendor === FILTER_ALL || model.vendor_name === vendor
}

function modelHasTag(model: PricingModel, tag: string): boolean {
  if (tag === FILTER_ALL) return true
  return parseTags(model.tags)
    .map((item) => item.toLowerCase())
    .includes(tag.toLowerCase())
}

function modelHasQuotaType(model: PricingModel, quotaType: string): boolean {
  if (quotaType === QUOTA_TYPES.ALL) return true
  return quotaType === QUOTA_TYPES.TOKEN
    ? model.quota_type === 0
    : model.quota_type === 1
}

function formatGroupRatio(ratio: number | undefined): string | undefined {
  if (ratio == null) return undefined
  const formatted = Number.isInteger(ratio)
    ? ratio.toString()
    : ratio.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  return `x${formatted}`
}

function FilterChip(props: {
  option: FilterOption
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={props.onClick}
      className={cn(
        'group inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        props.active
          ? 'border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950'
          : 'border-slate-200/80 bg-white/45 text-slate-500 hover:border-slate-300 hover:bg-white/85 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400 dark:hover:bg-white/[0.075] dark:hover:text-white'
      )}
      title={props.option.label}
    >
      {props.option.icon && (
        <span className='shrink-0'>{props.option.icon}</span>
      )}
      <span className='truncate'>{props.option.label}</span>
      {(props.option.suffix || props.option.count != null) && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px]',
            props.active
              ? 'bg-white/18 text-white dark:bg-black/10 dark:text-slate-950'
              : 'bg-slate-100/80 text-slate-500 dark:bg-white/10 dark:text-slate-400'
          )}
        >
          {props.option.suffix ?? props.option.count}
        </span>
      )}
    </button>
  )
}

function FilterSection(props: FilterSectionProps) {
  const [allOption, ...options] = props.options
  const isAllActive = props.value === allOption?.value

  return (
    <section className='border-b border-slate-200/70 py-3 last:border-b-0 dark:border-white/10'>
      <div className='mb-2.5 flex items-center justify-between gap-3'>
        <span className='text-sm font-semibold text-slate-950 dark:text-slate-100'>
          {props.title}
        </span>
        <div className='flex shrink-0 items-center gap-2'>
          {allOption && (
            <FilterChip
              option={allOption}
              active={isAllActive}
              onClick={() => props.onChange(allOption.value)}
            />
          )}
        </div>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {options.map((option) => (
          <FilterChip
            key={option.value}
            option={option}
            active={props.value === option.value}
            onClick={() => props.onChange(option.value)}
          />
        ))}
      </div>
    </section>
  )
}

export function PricingSidebar(props: PricingSidebarProps) {
  const { t } = useTranslation()
  const quotaTypeLabels = getQuotaTypeLabels(t)
  const endpointTypeLabels = getEndpointTypeLabels(t)
  const groupModels = props.models.filter((model) =>
    modelHasGroup(model, props.groupFilter)
  )
  const vendorModels = groupModels.filter((model) =>
    modelHasVendor(model, props.vendorFilter)
  )
  const tagModels = vendorModels.filter((model) =>
    modelHasTag(model, props.tagFilter)
  )
  const quotaModels = tagModels.filter((model) =>
    modelHasQuotaType(model, props.quotaTypeFilter)
  )
  const availableTags = Array.from(
    new Set(
      vendorModels.flatMap((model) =>
        parseTags(model.tags).map((tag) => tag.toLowerCase())
      )
    )
  ).sort((a, b) => a.localeCompare(b))

  const vendorOptions: FilterOption[] = [
    {
      value: FILTER_ALL,
      label: t('All'),
    },
    ...props.vendors
      .map((vendor) => ({
        value: vendor.name,
        label: vendor.name,
        count: countBy(
          groupModels,
          (model) => model.vendor_name === vendor.name
        ),
        icon: vendor.icon ? getLobeIcon(vendor.icon, 14) : undefined,
      }))
      .filter((vendor) => vendor.count > 0),
  ]

  const groupOptions: FilterOption[] = [
    {
      value: FILTER_ALL,
      label: t('All'),
    },
    ...props.groups.map((group) => ({
      value: group,
      label: group,
      suffix: formatGroupRatio(props.groupRatios?.[group]),
    })),
  ]

  const quotaOptions: FilterOption[] = [
    {
      value: QUOTA_TYPES.ALL,
      label: t('All'),
    },
    {
      value: QUOTA_TYPES.TOKEN,
      label: quotaTypeLabels[QUOTA_TYPES.TOKEN],
      count: countBy(tagModels, (model) => model.quota_type === 0),
    },
    {
      value: QUOTA_TYPES.REQUEST,
      label: quotaTypeLabels[QUOTA_TYPES.REQUEST],
      count: countBy(tagModels, (model) => model.quota_type === 1),
    },
  ].filter((option) => option.value === QUOTA_TYPES.ALL || option.count > 0)

  const tagOptions: FilterOption[] = [
    {
      value: FILTER_ALL,
      label: t('All'),
    },
    ...availableTags.map((tag) => ({
      value: tag,
      label: tag,
      count: countBy(vendorModels, (model) => modelHasTag(model, tag)),
    })),
  ]

  const endpointOptions: FilterOption[] = [
    {
      value: ENDPOINT_TYPES.ALL,
      label: t('All'),
    },
    ...Object.entries(endpointTypeLabels)
      .filter(([value]) => value !== ENDPOINT_TYPES.ALL)
      .map(([value, label]) => ({
        value,
        label,
        count: countBy(
          quotaModels,
          (model) => model.supported_endpoint_types?.includes(value) ?? false
        ),
      }))
      .filter((option) => option.count > 0),
  ]

  return (
    <aside
      className={cn(
        props.compact
          ? 'p-0'
          : 'rounded-2xl border border-slate-200/70 bg-white/58 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.055)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)]',
        props.className
      )}
    >
      <div className='flex min-h-8 items-center justify-between gap-3 border-b border-slate-200/70 pb-3 dark:border-white/10'>
        <div className='flex min-w-0 items-center'>
          <div className='flex items-center gap-2'>
            <h2 className='text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100'>
              {t('Filter')}
            </h2>
            {props.hasActiveFilters && (
              <Badge className='rounded-full bg-slate-950 px-2 py-0.5 text-[11px] text-white dark:bg-white dark:text-slate-950'>
                {t('Enabled')}
              </Badge>
            )}
          </div>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={props.onClearFilters}
          disabled={!props.hasActiveFilters}
          className='h-7 shrink-0 gap-1.5 rounded-full px-2.5 text-xs text-slate-500 hover:bg-slate-950/[0.04] hover:text-slate-950 disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
        >
          <RotateCcw className='size-3.5' />
          {t('Reset')}
        </Button>
      </div>

      <div>
        <FilterSection
          title={t('Groups')}
          value={props.groupFilter}
          options={groupOptions}
          onChange={props.onGroupChange}
        />
        <FilterSection
          title={t('All Vendors')}
          value={props.vendorFilter}
          options={vendorOptions}
          onChange={props.onVendorChange}
        />
        <FilterSection
          title={t('Model Tags')}
          value={props.tagFilter}
          options={tagOptions}
          onChange={props.onTagChange}
        />
        <FilterSection
          title={t('Pricing Type')}
          value={props.quotaTypeFilter}
          options={quotaOptions}
          onChange={props.onQuotaTypeChange}
        />
        <FilterSection
          title={t('Endpoint Type')}
          value={props.endpointTypeFilter}
          options={endpointOptions}
          onChange={props.onEndpointTypeChange}
        />
      </div>
    </aside>
  )
}
