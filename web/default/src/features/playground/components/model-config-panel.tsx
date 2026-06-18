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
  Ban,
  Hash,
  Repeat,
  Settings,
  Shuffle,
  Target,
  Thermometer,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { ParameterEnabled, PlaygroundConfig } from '../types'

type NumericConfigKey =
  | 'temperature'
  | 'top_p'
  | 'frequency_penalty'
  | 'presence_penalty'

type OptionalConfigKey = keyof ParameterEnabled

interface ParameterControlProps {
  description: string
  enabled: boolean
  icon: React.ReactNode
  label: string
  max: number
  min: number
  onEnabledChange: (checked: boolean) => void
  onValueChange: (value: number) => void
  step: number
  value: number
}

interface ModelConfigPanelProps {
  config: PlaygroundConfig
  parameterEnabled: ParameterEnabled
  onConfigChange: <K extends keyof PlaygroundConfig>(
    key: K,
    value: PlaygroundConfig[K]
  ) => void
  onParameterToggle: (key: OptionalConfigKey) => void
}

function ParameterControl({
  description,
  enabled,
  icon,
  label,
  max,
  min,
  onEnabledChange,
  onValueChange,
  step,
  value,
}: ParameterControlProps) {
  return (
    <div className={cn('space-y-2 transition-opacity', !enabled && 'opacity-50')}>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='text-muted-foreground'>{icon}</span>
          <span className='truncate text-sm font-medium'>{label}</span>
          <Badge variant='secondary' className='h-5 px-1.5 tabular-nums'>
            {value}
          </Badge>
        </div>
        <Switch
          checked={enabled}
          size='sm'
          onCheckedChange={onEnabledChange}
          aria-label={enabled ? `Disable ${label}` : `Enable ${label}`}
        />
      </div>
      <p className='text-muted-foreground text-xs'>{description}</p>
      <Slider
        className='py-1'
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={!enabled}
        onValueChange={(nextValue) => {
          const next = typeof nextValue === 'number' ? nextValue : value
          onValueChange(Number(next.toFixed(2)))
        }}
      />
    </div>
  )
}

export function ModelConfigPanel({
  config,
  parameterEnabled,
  onConfigChange,
  onParameterToggle,
}: ModelConfigPanelProps) {
  const { t } = useTranslation()

  const controls: Array<{
    key: NumericConfigKey
    label: string
    description: string
    icon: React.ReactNode
    min: number
    max: number
    step: number
  }> = [
    {
      key: 'temperature',
      label: 'Temperature',
      description: t('控制输出的随机性和创造性'),
      icon: <Thermometer className='size-4' />,
      min: 0.1,
      max: 1,
      step: 0.1,
    },
    {
      key: 'top_p',
      label: 'Top P',
      description: t('核采样，控制词汇选择的多样性'),
      icon: <Target className='size-4' />,
      min: 0.1,
      max: 1,
      step: 0.1,
    },
    {
      key: 'frequency_penalty',
      label: 'Frequency Penalty',
      description: t('频率惩罚，减少重复词汇的出现'),
      icon: <Repeat className='size-4' />,
      min: -2,
      max: 2,
      step: 0.1,
    },
    {
      key: 'presence_penalty',
      label: 'Presence Penalty',
      description: t('存在惩罚，鼓励讨论新话题'),
      icon: <Ban className='size-4' />,
      min: -2,
      max: 2,
      step: 0.1,
    },
  ]

  return (
    <aside className='bg-background hidden h-full w-[280px] shrink-0 border-r xl:flex xl:flex-col'>
      <div className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
        <Settings className='text-muted-foreground size-4' />
        <h2 className='text-sm font-semibold'>{t('模型配置')}</h2>
      </div>

      <div className='flex-1 space-y-5 overflow-y-auto px-4 py-4'>
        {controls.map((control) => (
          <ParameterControl
            key={control.key}
            description={control.description}
            enabled={parameterEnabled[control.key]}
            icon={control.icon}
            label={control.label}
            max={control.max}
            min={control.min}
            step={control.step}
            value={config[control.key]}
            onEnabledChange={() => onParameterToggle(control.key)}
            onValueChange={(value) => onConfigChange(control.key, value)}
          />
        ))}

        <div
          className={cn(
            'space-y-2 transition-opacity',
            !parameterEnabled.max_tokens && 'opacity-50'
          )}
        >
          <div className='flex items-center justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-2'>
              <Hash className='text-muted-foreground size-4' />
              <span className='truncate text-sm font-medium'>Max Tokens</span>
            </div>
            <Switch
              checked={parameterEnabled.max_tokens}
              size='sm'
              onCheckedChange={() => onParameterToggle('max_tokens')}
              aria-label={
                parameterEnabled.max_tokens
                  ? 'Disable Max Tokens'
                  : 'Enable Max Tokens'
              }
            />
          </div>
          <Input
            type='number'
            min={0}
            step={1}
            value={config.max_tokens}
            disabled={!parameterEnabled.max_tokens}
            onChange={(event) =>
              onConfigChange('max_tokens', Number(event.target.value || 0))
            }
          />
        </div>

        <div
          className={cn(
            'space-y-2 transition-opacity',
            !parameterEnabled.seed && 'opacity-50'
          )}
        >
          <div className='flex items-center justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-2'>
              <Shuffle className='text-muted-foreground size-4' />
              <span className='truncate text-sm font-medium'>Seed</span>
            </div>
            <Switch
              checked={parameterEnabled.seed}
              size='sm'
              onCheckedChange={() => onParameterToggle('seed')}
              aria-label={parameterEnabled.seed ? 'Disable Seed' : 'Enable Seed'}
            />
          </div>
          <p className='text-muted-foreground text-xs'>
            {t('可选，用于复现结果')}
          </p>
          <Input
            placeholder={t('随机种子 (留空为随机)')}
            value={config.seed ?? ''}
            disabled={!parameterEnabled.seed}
            onChange={(event) => {
              const value = event.target.value.trim()
              onConfigChange('seed', value === '' ? null : Number(value))
            }}
          />
        </div>

        <div className='flex items-center justify-between gap-3 border-t pt-4'>
          <div>
            <div className='text-sm font-medium'>{t('流式输出')}</div>
            <p className='text-muted-foreground text-xs'>SSE</p>
          </div>
          <Switch
            checked={config.stream}
            onCheckedChange={(checked) => onConfigChange('stream', checked)}
          />
        </div>
      </div>
    </aside>
  )
}
