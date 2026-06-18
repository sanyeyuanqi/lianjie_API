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
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AnimateInView } from '@/components/animate-in-view'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  if (props.isAuthenticated) {
    return null
  }

  return (
    <section className='relative z-10 overflow-hidden px-6 pt-8 pb-20 md:px-8 md:pb-24'>
      <AnimateInView
        className='mx-auto max-w-[1480px] rounded-[1.75rem] border border-white/70 bg-white/66 px-6 py-14 text-center shadow-[0_30px_110px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:px-10 md:py-16 dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_30px_110px_rgba(0,0,0,0.44)]'
        animation='scale-in'
      >
        <h2 className='text-3xl leading-tight font-semibold tracking-tight text-slate-950 md:text-5xl dark:text-white'>
          {t('home.cta.heading.line1')}
          <br />
          <span className='bg-gradient-to-r from-slate-950 via-cyan-600 to-emerald-500 bg-clip-text text-transparent dark:from-white dark:via-slate-300 dark:to-zinc-500'>
            {t('home.cta.heading.line2')}
          </span>
        </h2>
        <p className='mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-500 md:text-base dark:text-slate-400'>
          {t('home.cta.description')}
        </p>
        <div className='mt-8 flex items-center justify-center gap-3'>
          <Button
            className='group rounded-lg bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
            render={<Link to='/sign-up' />}
          >
            {t('home.hero.start')}
            <ArrowRight className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5' />
          </Button>
          <Button
            variant='outline'
            className='rounded-lg border-slate-200/80 bg-white/70 text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200 dark:hover:bg-white/[0.09]'
            render={<Link to='/pricing' />}
          >
            {t('home.cta.pricing')}
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
