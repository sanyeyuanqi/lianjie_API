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
import { useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

interface CounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
}

function Counter(props: CounterProps) {
  const { end, suffix = '', prefix = '', duration = 1600, decimals = 0 } = props
  const ref = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)

  const formatValue = useCallback(
    (v: number) =>
      decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
    [decimals]
  )

  const animate = useCallback(() => {
    const el = ref.current
    if (!el) return
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = `${prefix}${formatValue(eased * end)}${suffix}`
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, prefix, suffix, formatValue])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      el.textContent = `${prefix}${formatValue(end)}${suffix}`
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          animate()
          observer.unobserve(el)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [animate, end, prefix, suffix, formatValue])

  return (
    <span ref={ref} className='tabular-nums'>
      {prefix}0{suffix}
    </span>
  )
}

interface StatsProps {
  className?: string
}

interface StatItem {
  end: number
  suffix: string
  label: string
  decimals?: number
}

interface ProviderItem {
  model: string
  vendor: string
  icon: string
}

function renderProviderIcon(icon: string, size: number) {
  if (icon.startsWith('/')) {
    return (
      <img
        src={icon}
        alt=''
        className='size-[78%] rounded-lg object-contain'
        width={size}
        height={size}
        draggable={false}
      />
    )
  }

  return getLobeIcon(icon, size)
}

export function Stats(props: StatsProps) {
  const { t } = useTranslation()

  const stats: StatItem[] = [
    { end: 50, suffix: '+', label: 'home.stats.upstream' },
    { end: 100, suffix: '+', label: 'home.stats.billing' },
    { end: 50, suffix: '+', label: 'home.stats.routes' },
    { end: 10, suffix: '+', label: 'home.stats.operations' },
  ]

  const providers: ProviderItem[] = [
    { model: 'GPT', vendor: 'OpenAI', icon: 'OpenAI' },
    { model: 'Claude', vendor: 'Anthropic', icon: 'Claude.Color' },
    { model: 'Gemini', vendor: 'Google', icon: 'Gemini.Color' },
    { model: 'DeepSeek', vendor: 'DeepSeek', icon: 'DeepSeek.Color' },
    { model: 'Qwen', vendor: 'Alibaba Cloud', icon: 'Qwen.Color' },
    { model: 'Kimi', vendor: 'Moonshot AI', icon: '/model-icons/kimi.png' },
    { model: 'Llama', vendor: 'Meta', icon: 'Meta.Color' },
    { model: 'Mistral', vendor: 'Mistral AI', icon: 'Mistral.Color' },
    { model: 'Doubao', vendor: 'ByteDance', icon: 'Doubao.Color' },
    { model: 'Hunyuan', vendor: 'Tencent', icon: 'Hunyuan.Color' },
    { model: 'ERNIE', vendor: 'Baidu', icon: 'Wenxin.Color' },
    { model: 'GLM', vendor: 'Zhipu AI', icon: 'Zhipu.Color' },
  ]

  const scrollingProviders = [...providers, ...providers]

  return (
    <section
      className={cn(
        'relative z-10 mt-8 px-6 md:mt-10 md:px-8 lg:mt-12',
        props.className
      )}
    >
      <div className='mx-auto max-w-[1480px]'>
        <div className='relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_7%,black_93%,transparent)]'>
          <div className='home-provider-marquee flex w-max gap-4 pr-4 md:gap-5 md:pr-5 lg:gap-6 lg:pr-6'>
            {scrollingProviders.map((provider, index) => (
              <article
                key={`${provider.vendor}-${provider.model}-${index}`}
                className='flex min-h-[4.75rem] w-[13rem] shrink-0 items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-colors duration-200 hover:bg-white/80 md:w-[13.75rem] dark:border-white/10 dark:bg-white/[0.045] dark:hover:bg-white/[0.075]'
              >
                <span className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/65 bg-white/70 text-slate-900 dark:border-white/10 dark:bg-white/[0.06] dark:text-white'>
                  {renderProviderIcon(provider.icon, 22)}
                </span>
                <span className='min-w-0 text-left'>
                  <span className='block truncate text-sm font-semibold text-slate-950 dark:text-white'>
                    {provider.model}
                  </span>
                  <span className='mt-0.5 block truncate text-xs font-medium text-slate-500 dark:text-slate-400'>
                    {provider.vendor}
                  </span>
                </span>
              </article>
            ))}
          </div>
        </div>

        <div className='mt-10 grid grid-cols-2 gap-5 md:mt-12 md:grid-cols-4 md:gap-6 lg:mt-14'>
          {stats.map((s) => (
            <article
              key={s.label}
              className='flex min-h-[6.25rem] flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_14px_42px_rgba(15,23,42,0.07)] backdrop-blur-xl transition-colors duration-200 hover:bg-white/86 md:min-h-[6.75rem] md:px-6 md:py-4 dark:border-white/10 dark:bg-white/[0.055] dark:hover:bg-white/[0.08]'
            >
              <span className='block text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-white'>
                <Counter end={s.end} suffix={s.suffix} decimals={s.decimals} />
              </span>
              <span className='mt-2 block text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400'>
                {t(s.label)}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
