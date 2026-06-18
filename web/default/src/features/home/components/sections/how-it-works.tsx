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
import { Settings, Zap, BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      num: '1',
      title: 'home.workflow.connect.title',
      desc: 'home.workflow.connect.description',
      icon: <Settings className='size-6' strokeWidth={1.5} />,
    },
    {
      num: '2',
      title: 'home.workflow.distribute.title',
      desc: 'home.workflow.distribute.description',
      icon: <Zap className='size-6' strokeWidth={1.5} />,
    },
    {
      num: '3',
      title: 'home.workflow.optimize.title',
      desc: 'home.workflow.optimize.description',
      icon: <BarChart3 className='size-6' strokeWidth={1.5} />,
    },
  ]

  return (
    <section className='relative z-10 px-6 py-20 md:px-8 md:py-28'>
      <div className='mx-auto max-w-[1480px]'>
        <AnimateInView className='mb-12 text-center md:mb-14'>
          <p className='mb-3 text-xs font-semibold tracking-widest text-slate-400 uppercase dark:text-slate-500'>
            {t('home.workflow.eyebrow')}
          </p>
          <h2 className='text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl dark:text-white'>
            {t('home.workflow.heading')}
          </h2>
        </AnimateInView>

        <div className='grid gap-5 md:grid-cols-3'>
          {steps.map((step, i) => (
            <AnimateInView
              key={step.num}
              delay={i * 150}
              animation='fade-up'
              className='relative rounded-[1.5rem] border border-white/70 bg-white/58 px-8 py-10 text-center shadow-[0_22px_76px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_22px_70px_rgba(0,0,0,0.30)]'
            >
              <div className='relative mx-auto mb-6 w-fit'>
                <div className='flex size-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors dark:border-white/10 dark:bg-black/20 dark:text-slate-300'>
                  {step.icon}
                </div>
                <div className='absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white shadow-lg dark:bg-white dark:text-slate-950'>
                  {step.num}
                </div>
              </div>
              <h3 className='mb-2 text-base font-semibold text-slate-950 dark:text-slate-100'>
                {t(step.title)}
              </h3>
              <p className='mx-auto max-w-[240px] text-sm leading-relaxed text-slate-500 dark:text-slate-400'>
                {t(step.desc)}
              </p>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
