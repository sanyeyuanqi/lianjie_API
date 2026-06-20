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
import { ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

// Stylized three-dots indicator representing "More"
const MoreIcon = () => (
  <svg
    className='text-muted-foreground/60 group-hover:text-foreground size-6 shrink-0 transition-colors'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='6' cy='12' r='2' fill='currentColor' />
    <circle cx='12' cy='12' r='2' fill='currentColor' />
    <circle cx='18' cy='12' r='2' fill='currentColor' />
  </svg>
)

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  const renderDocsButton = () => {
    return (
      <Button
        variant='outline'
        className='group inline-flex h-11 items-center gap-1.5 rounded-lg border-slate-200/80 bg-white/70 px-5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200 dark:hover:bg-white/[0.09]'
        render={<Link to='/docs' />}
      >
        <BookOpen className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
        <span>{t('home.hero.docs')}</span>
      </Button>
    )
  }

  return (
    <section
      className={cn(
        'relative z-10 overflow-hidden px-6 pt-20 pb-10 md:px-8 md:pt-28 md:pb-14 lg:pt-[7.5rem] lg:pb-16',
        props.className
      )}
    >
      <div className='pointer-events-none absolute top-20 left-1/2 -z-10 h-[42rem] w-[92rem] -translate-x-1/2 rounded-full bg-white/50 blur-3xl dark:bg-white/[0.035]' />
      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_68%_50%_at_50%_20%,black_12%,transparent_100%)] bg-[size:4.5rem_4.5rem] opacity-70 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] dark:opacity-40'
      />

      <div className='mx-auto grid max-w-[1480px] grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-12 xl:gap-x-16'>
        {/* Left Column: Title, description, action buttons and application support */}
        <div className='flex max-w-3xl flex-col items-start text-left lg:col-span-6 xl:col-span-5'>
          {/* Top Pill Badge */}
          <div
            className='landing-animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3.5 py-1.5 text-[11px] font-semibold text-slate-700 opacity-0 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200'
            style={{ animationDelay: '0ms' }}
          >
            <span className='relative flex size-1.5'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex size-1.5 rounded-full bg-emerald-500' />
            </span>
            <span>{t('home.hero.badge')}</span>
          </div>

          <h1
            className='landing-animate-fade-up max-w-3xl text-[clamp(2.65rem,4.9vw,4.95rem)] leading-[0.98] font-semibold tracking-tight text-slate-950 dark:text-white'
            style={{ animationDelay: '60ms' }}
          >
            {t('home.hero.title.line1')}
            <br />
            <span className='bg-gradient-to-r from-slate-950 via-cyan-600 to-emerald-500 bg-clip-text text-transparent dark:from-white dark:via-slate-300 dark:to-zinc-500'>
              {t('home.hero.title.line2')}
            </span>
          </h1>
          <p
            className='landing-animate-fade-up mt-6 max-w-2xl text-base leading-7 text-slate-600 opacity-0 md:text-[16px] dark:text-slate-400'
            style={{ animationDelay: '120ms' }}
          >
            {t('home.hero.description')}
          </p>

          <div
            className='landing-animate-fade-up mt-7 flex flex-wrap items-center gap-3 opacity-0'
            style={{ animationDelay: '180ms' }}
          >
            {props.isAuthenticated ? (
              <>
                <Button
                  className='group h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
                  render={<Link to='/dashboard' />}
                >
                  {t('home.hero.console')}
                  <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
                {renderDocsButton()}
              </>
            ) : (
              <>
                <Button
                  className='group h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
                  render={<Link to='/sign-up' />}
                >
                  {t('home.hero.start')}
                  <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
                <Button
                  variant='outline'
                  className='h-11 rounded-lg border-slate-200/80 bg-white/70 px-5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200 dark:hover:bg-white/[0.09]'
                  render={<Link to='/pricing' />}
                >
                  {t('home.hero.pricing')}
                </Button>
                {renderDocsButton()}
              </>
            )}
          </div>

          <div
            className='landing-animate-fade-up mt-8 w-full max-w-2xl opacity-0'
            style={{ animationDelay: '240ms' }}
          >
            <div className='mb-4 flex flex-col gap-1'>
              <span className='text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase dark:text-slate-500'>
                {t('home.hero.clients.title')}
              </span>
              <p className='text-xs leading-relaxed text-slate-500 dark:text-slate-400'>
                {t('home.hero.clients.description')}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              {/* CC Switch */}
              <a
                href='https://ccswitch.io'
                target='_blank'
                rel='noopener noreferrer'
                className='group flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/65 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:bg-white/[0.09] dark:hover:text-white'
              >
                <img
                  src='https://ccswitch.io/favicon.png'
                  alt='CC Switch'
                  className='size-6 shrink-0 rounded-md object-contain'
                  onError={(e) => {
                    // Fallback to a styled text avatar if the remote favicon fails to load in sandbox or local environments
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <span
                  style={{ display: 'none' }}
                  className='size-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'
                >
                  CC
                </span>
                <span>CC Switch 一键接入</span>
              </a>

              <div className='group flex cursor-default items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/65 px-5 py-2.5 text-sm font-medium text-slate-500 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-400 dark:hover:bg-white/[0.09] dark:hover:text-white'>
                <MoreIcon />
                <span>{t('home.hero.moreIntegrations')}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className='landing-animate-fade-up w-full opacity-0 lg:col-span-6 lg:pt-9 xl:col-span-7'
          style={{ animationDelay: '260ms' }}
        >
          <HeroTerminalDemo className='mx-auto w-full max-w-[760px] lg:mr-0' />
        </div>
      </div>
    </section>
  )
}
