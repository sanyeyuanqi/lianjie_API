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
*/
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Image, Plus, Save, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getPricing } from '@/features/pricing/api'
import { EXCLUDED_GROUPS } from '@/features/pricing/constants'
import { useSystemOptions } from '@/features/system-settings/hooks/use-system-options'
import { useUpdateOption } from '@/features/system-settings/hooks/use-update-option'

type ImageModelGroupSelection = {
  group: string
  models: string[]
}

type ImageModelPricingItem = {
  name: string
  model: string
  models: string[]
  group_models: ImageModelGroupSelection[]
  base_price: number | ''
  size_ratios: Record<string, number>
  qualities: string[]
  aspect_ratios: string[]
  counts: number[]
}

type ImageModelPricingConfig = {
  models: ImageModelPricingItem[]
}

type ModelOption = {
  model_name: string
  enable_groups?: string[]
}

const EMPTY_CONFIG: ImageModelPricingConfig = { models: [] }
const SIZE_TIERS = ['1K', '2K', '4K'] as const
const DEFAULT_QUALITIES = ['auto', 'high', 'medium', 'low']
const DEFAULT_ASPECT_RATIOS = [
  '1:1',
  '3:2',
  '2:3',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '1:1(2k)',
  '16:9(2k)',
  '9:16(2k)',
  '16:9(4k)',
  '9:16(4k)',
  'auto',
]
const DEFAULT_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8]

function normalizeStringList(values: string[] = []) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  )
}

function normalizeGroupModels(
  groups: ImageModelGroupSelection[] = [],
  fallbackModels: string[] = []
) {
  const normalized = groups
    .map((group) => ({
      group: group.group?.trim() || '',
      models: normalizeStringList(group.models),
    }))
    .filter((group) => group.models.length > 0)

  if (normalized.length > 0) return normalized

  const models = normalizeStringList(fallbackModels)
  return models.length ? [{ group: '', models }] : []
}

function flattenGroupModels(groups: ImageModelGroupSelection[]) {
  return normalizeStringList(groups.flatMap((group) => group.models))
}

function normalizeItem(item: Partial<ImageModelPricingItem>) {
  const groupModels = normalizeGroupModels(item.group_models, [
    ...(item.models || []),
    item.model || '',
  ])
  const models = flattenGroupModels(groupModels)
  const model = item.model?.trim() || models[0] || ''
  const sizeRatios = item.size_ratios || {}
  const basePrice: number | '' =
    item.base_price === '' || item.base_price === undefined
      ? ''
      : Number(item.base_price) || 0

  return {
    name: item.name?.trim() || '',
    model,
    models,
    group_models: groupModels,
    base_price: basePrice,
    size_ratios: {
      '1K': Number(sizeRatios['1K']) || 1,
      '2K': Number(sizeRatios['2K']) || 2,
      '4K': Number(sizeRatios['4K']) || 4,
    },
    qualities: item.qualities?.length ? item.qualities : DEFAULT_QUALITIES,
    aspect_ratios: item.aspect_ratios?.length
      ? item.aspect_ratios
      : DEFAULT_ASPECT_RATIOS,
    counts: item.counts?.length ? item.counts : DEFAULT_COUNTS,
  }
}

function parseConfig(value: string | undefined): ImageModelPricingConfig {
  if (!value) return EMPTY_CONFIG
  try {
    const parsed = JSON.parse(value) as Partial<ImageModelPricingConfig>
    return {
      models: Array.isArray(parsed.models)
        ? parsed.models.map((item) => normalizeItem(item))
        : [],
    }
  } catch {
    return EMPTY_CONFIG
  }
}

function createDefaultItem(name = ''): ImageModelPricingItem {
  return normalizeItem({ name })
}

function groupLabel(group: string) {
  return group || 'Ungrouped'
}

function modelIsSelected(
  groups: ImageModelGroupSelection[],
  group: string,
  model: string
) {
  return groups.some(
    (item) => item.group === group && item.models.includes(model)
  )
}

function upsertGroupedModel(
  groups: ImageModelGroupSelection[],
  group: string,
  model: string
) {
  const next = groups.map((item) => ({ ...item, models: [...item.models] }))
  const normalizedGroup = group.trim()
  const normalizedModel = model.trim()
  if (!normalizedModel) return next

  const existing = next.find((item) => item.group === normalizedGroup)
  if (existing) {
    if (!existing.models.includes(normalizedModel)) {
      existing.models.push(normalizedModel)
    }
  } else {
    next.push({ group: normalizedGroup, models: [normalizedModel] })
  }

  return next.filter((item) => item.models.length > 0)
}

function removeGroupedModel(
  groups: ImageModelGroupSelection[],
  group: string,
  model: string
) {
  return groups
    .map((item) => ({
      ...item,
      models:
        item.group === group
          ? item.models.filter((value) => value !== model)
          : [...item.models],
    }))
    .filter((item) => item.models.length > 0)
}

export function ImageModelManagement() {
  const { t } = useTranslation()
  const [selectedModel, setSelectedModel] = useState('')
  const [draft, setDraft] = useState<ImageModelPricingItem>(createDefaultItem())
  const [pendingGroup, setPendingGroup] = useState('')
  const [pendingModel, setPendingModel] = useState('')

  const updateOption = useUpdateOption()
  const { data: optionsData, isLoading: isOptionsLoading } = useSystemOptions()
  const { data: pricingData, isLoading: isPricingLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: getPricing,
    staleTime: 5 * 60 * 1000,
  })

  const config = useMemo(() => {
    const option = optionsData?.data?.find(
      (item) => item.key === 'ImageModelPricing'
    )
    return parseConfig(option?.value)
  }, [optionsData])

  const groupedModelOptions = useMemo(() => {
    const pricingModels = (pricingData?.data || []) as ModelOption[]
    const plazaGroups = Object.keys(pricingData?.usable_group || {})
      .map((group) => group.trim())
      .filter((group) => group && !EXCLUDED_GROUPS.includes(group))

    return plazaGroups
      .map((group) => ({
        group,
        models: pricingModels
          .filter((model) => model.enable_groups?.includes(group))
          .map((model) => model.model_name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => groupLabel(a.group).localeCompare(groupLabel(b.group)))
  }, [pricingData])

  const configuredNames = useMemo(
    () => config.models.map((item) => item.name).filter(Boolean),
    [config.models]
  )

  const selectedGroupOptions = useMemo(
    () => groupedModelOptions.map((group) => group.group),
    [groupedModelOptions]
  )

  const pendingGroupModels = useMemo(
    () =>
      groupedModelOptions.find((group) => group.group === pendingGroup)
        ?.models || [],
    [groupedModelOptions, pendingGroup]
  )

  useEffect(() => {
    if (!selectedModel || configuredNames.includes(selectedModel)) return
    setSelectedModel('')
  }, [configuredNames, selectedModel])

  useEffect(() => {
    const next =
      config.models.find((item) => item.name === selectedModel) ||
      createDefaultItem(selectedModel)
    setDraft(next)
  }, [config.models, selectedModel])

  useEffect(() => {
    if (selectedGroupOptions.length === 0) {
      setPendingGroup('')
      setPendingModel('')
      return
    }

    if (pendingGroup && !selectedGroupOptions.includes(pendingGroup)) {
      setPendingGroup('')
      setPendingModel('')
      return
    }

    if (
      pendingGroupModels.length > 0 &&
      pendingModel &&
      !pendingGroupModels.includes(pendingModel)
    ) {
      setPendingModel('')
      return
    }

    if (pendingGroupModels.length === 0) {
      setPendingModel('')
    }
  }, [pendingGroup, pendingGroupModels, selectedGroupOptions, pendingModel])

  const selectedFinalPrice = (tier: string) => {
    const multiplier = draft.size_ratios[tier] || 1
    const basePrice = Number(draft.base_price) || 0
    return (basePrice * multiplier).toFixed(6).replace(/\.?0+$/, '')
  }

  const handleAddModel = () => {
    if (!pendingModel.trim()) {
      toast.error('请选择模型')
      return
    }

    setDraft((current) => ({
      ...current,
      group_models: upsertGroupedModel(
        current.group_models,
        pendingGroup,
        pendingModel
      ),
    }))
  }

  const saveDraft = () => {
    const name = draft.name.trim()
    const groupModels = normalizeGroupModels(draft.group_models)
    const models = flattenGroupModels(groupModels)

    if (!name) {
      toast.error('请输入统一模型名称')
      return
    }

    const nextItem = normalizeItem({
      ...draft,
      name,
      base_price: Number(draft.base_price) || 0,
      model: models[0] || '',
      models,
      group_models: groupModels,
      qualities: DEFAULT_QUALITIES,
      aspect_ratios: DEFAULT_ASPECT_RATIOS,
      counts: DEFAULT_COUNTS,
    })

    const nextModels = config.models.filter((item) => item.name !== name)
    nextModels.push(nextItem)

    updateOption.mutate({
      key: 'ImageModelPricing',
      value: JSON.stringify({
        models: nextModels.sort((a, b) => a.name.localeCompare(b.name)),
      }),
    })
    setSelectedModel(name)
  }

  const removeModel = (name: string) => {
    const nextModels = config.models.filter((item) => item.name !== name)
    updateOption.mutate({
      key: 'ImageModelPricing',
      value: JSON.stringify({ models: nextModels }),
    })
    if (selectedModel === name) {
      setSelectedModel(nextModels[0]?.name || '')
    }
  }

  const addModel = () => {
    setSelectedModel('')
    setDraft(createDefaultItem())
    setPendingGroup('')
    setPendingModel('')
  }

  const isLoading = isOptionsLoading || isPricingLoading

  if (isLoading) {
    return (
      <div className='grid gap-4 lg:grid-cols-[260px_1fr]'>
        <Skeleton className='h-64 rounded-xl' />
        <Skeleton className='h-64 rounded-xl' />
      </div>
    )
  }

  return (
    <div className='grid h-full min-h-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]'>
      <Card className='min-h-0 rounded-lg !shadow-none transition-none hover:!shadow-none'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Image className='size-4 shrink-0' />
            {t('Image Model Management')}
          </CardTitle>
          <CardDescription>
            {t('Select a model and configure image generation pricing.')}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex min-h-0 flex-col gap-3'>
          <Button
            type='button'
            variant='outline'
            className='w-full justify-center gap-2'
            onClick={addModel}
          >
            <Plus className='size-4' />
            新增模型
          </Button>

          <div className='flex min-h-0 flex-1 flex-col gap-2 overflow-auto'>
            {config.models.length === 0 ? (
              <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm'>
                {t('No image model pricing configured yet')}
              </div>
            ) : (
              config.models.map((item) => {
                const summary = item.group_models.length
                  ? item.group_models
                      .map(
                        (group) =>
                          `${groupLabel(group.group)}: ${group.models.join(', ')}`
                      )
                      .join(' / ')
                  : '未添加模型'

                return (
                  <div
                    key={item.name || item.model}
                    className={cn(
                      'bg-card relative overflow-hidden rounded-lg',
                      selectedModel === item.name ? 'bg-muted/55' : ''
                    )}
                  >
                    <button
                      type='button'
                      className='w-full rounded-lg px-3 py-2 pr-9 text-left focus-visible:outline-none'
                      onClick={() => setSelectedModel(item.name)}
                    >
                      <div className='truncate font-medium'>{item.name}</div>
                      <div className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                        {summary}
                      </div>
                      <div className='text-muted-foreground mt-1 text-xs'>
                        {t('Base price')}: {item.base_price}
                      </div>
                    </button>
                    <button
                      type='button'
                      aria-label='删除模型'
                      className='text-muted-foreground absolute top-2 right-2 flex size-6 items-center justify-center rounded-full focus-visible:outline-none'
                      onClick={(event) => {
                        event.stopPropagation()
                        removeModel(item.name)
                      }}
                    >
                      <X className='size-3.5' />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className='min-h-0 rounded-lg !shadow-none transition-none hover:!shadow-none'>
        <CardHeader>
          <CardTitle>{t('Model Pricing Configuration')}</CardTitle>
          <CardDescription>
            {t(
              'Actual image price equals base price multiplied by the selected size multiplier.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-5 overflow-auto'>
          <div className='grid gap-4 md:grid-cols-[minmax(220px,1fr)_180px]'>
            <div className='space-y-2'>
              <Label>统一模型名称 *</Label>
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder='例如：gpt-image-2'
              />
            </div>

            <div className='space-y-2'>
              <Label>{t('Base Price')}</Label>
              <Input
                type='number'
                min='0'
                step='0.000001'
                value={draft.base_price}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    base_price:
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className='space-y-3'>
            <div>
              <h3 className='text-sm font-medium'>模型选择</h3>
              <p className='text-muted-foreground text-xs'>
                按模型广场分组选择，只显示当前分组下的模型。底下的模型列表可以留空。
              </p>
            </div>

            <div className='space-y-3 rounded-lg border p-3'>
              {selectedGroupOptions.length === 0 ? (
                <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm'>
                  暂无可选模型
                </div>
              ) : (
                <div className='grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_auto]'>
                  <Select
                    value={pendingGroup}
                    onValueChange={(value) => {
                      const nextGroup = value ?? ''
                      setPendingGroup(nextGroup)
                      setPendingModel('')
                    }}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='选择分组' />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        {groupedModelOptions.map((group) => (
                          <SelectItem
                            key={group.group || '__ungrouped'}
                            value={group.group}
                          >
                            {groupLabel(group.group)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={pendingModel}
                    onValueChange={(value) => setPendingModel(value ?? '')}
                    disabled={pendingGroupModels.length === 0}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='选择模型' />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectGroup>
                        {pendingGroupModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Button
                    type='button'
                    variant='outline'
                    className='gap-2'
                    onClick={handleAddModel}
                    disabled={!pendingModel}
                  >
                    <Plus className='size-4' />
                    添加模型
                  </Button>
                </div>
              )}

              <div className='space-y-3'>
                {draft.group_models.length === 0 ? (
                  <div className='text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm'>
                    还没有添加任何模型
                  </div>
                ) : (
                  draft.group_models.map((group) => (
                    <div
                      key={group.group || '__ungrouped'}
                      className='space-y-2'
                    >
                      <div className='text-muted-foreground text-xs font-medium'>
                        {groupLabel(group.group)}
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {group.models.map((model) => {
                          const active = modelIsSelected(
                            draft.group_models,
                            group.group,
                            model
                          )
                          return (
                            <button
                              key={`${group.group}:${model}`}
                              type='button'
                              className={cn(
                                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
                                active
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border'
                              )}
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  group_models: removeGroupedModel(
                                    current.group_models,
                                    group.group,
                                    model
                                  ),
                                }))
                              }
                            >
                              {active ? <Check className='size-3' /> : null}
                              {model}
                              <X className='size-3 opacity-70' />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <div>
              <h3 className='text-sm font-medium'>{t('Size Multipliers')}</h3>
              <p className='text-muted-foreground text-xs'>
                {t('Set multipliers for 1K, 2K, and 4K image sizes.')}
              </p>
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              {SIZE_TIERS.map((tier) => (
                <div key={tier} className='rounded-lg border p-3'>
                  <div className='mb-2 flex items-center justify-between gap-2'>
                    <Label>{tier}</Label>
                    <span className='text-muted-foreground text-xs'>
                      {t('Final')}: {selectedFinalPrice(tier)}
                    </span>
                  </div>
                  <Input
                    type='number'
                    min='0'
                    step='0.01'
                    value={draft.size_ratios[tier]}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        size_ratios: {
                          ...current.size_ratios,
                          [tier]: Number(event.target.value),
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className='flex flex-wrap justify-end gap-2 border-t pt-4'>
            <Button
              type='button'
              className='gap-2'
              onClick={saveDraft}
              disabled={updateOption.isPending}
            >
              <Save className='size-4' />
              {t('Save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
