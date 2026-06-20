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
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { PublicLayout } from '@/components/layout/components/public-layout'
import { Hero } from './components/sections/hero'
import { useHomePageContent } from './hooks'

const Markdown = lazy(() =>
  import('@/components/ui/markdown').then((module) => ({
    default: module.Markdown,
  }))
)

const Stats = lazy(() =>
  import('./components/sections/stats').then((module) => ({
    default: module.Stats,
  }))
)

const Features = lazy(() =>
  import('./components/sections/features').then((module) => ({
    default: module.Features,
  }))
)

const HowItWorks = lazy(() =>
  import('./components/sections/how-it-works').then((module) => ({
    default: module.HowItWorks,
  }))
)

const CTA = lazy(() =>
  import('./components/sections/cta').then((module) => ({
    default: module.CTA,
  }))
)

export function Home() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const isAuthenticated = !!auth.user
  const { content, isLoaded, isUrl } = useHomePageContent()

  if (!isLoaded) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='flex min-h-screen items-center justify-center'>
          <div className='text-muted-foreground'>{t('Loading...')}</div>
        </main>
      </PublicLayout>
    )
  }

  if (content) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='overflow-x-hidden'>
          {isUrl ? (
            <iframe
              src={content}
              className='h-screen w-full border-none'
              title={t('Custom Home Page')}
            />
          ) : (
            <div className='container mx-auto py-8'>
              <Suspense
                fallback={
                  <div className='text-muted-foreground py-8 text-sm'>
                    {t('Loading...')}
                  </div>
                }
              >
                <Markdown className='custom-home-content'>{content}</Markdown>
              </Suspense>
            </div>
          )}
        </main>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <main className='relative isolate overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_34%,#f7f7fb_72%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,#050505_0%,#0a0a0b_42%,#111113_100%)]'>
        <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,0.13),transparent_30%),radial-gradient(circle_at_76%_18%,rgba(16,185,129,0.10),transparent_28%),radial-gradient(circle_at_50%_72%,rgba(245,158,11,0.08),transparent_32%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(148,163,184,0.10),transparent_32%),radial-gradient(circle_at_76%_20%,rgba(255,255,255,0.055),transparent_28%)]' />
        <section className='relative z-10 flex min-h-[100svh] flex-col'>
          <Hero
            isAuthenticated={isAuthenticated}
            className='pt-24 pb-8 md:pt-28 md:pb-10 lg:pt-[7.5rem] lg:pb-10'
          />
          <Suspense fallback={null}>
            <Stats className='pb-14 md:pb-16' />
          </Suspense>
        </section>
        <Suspense fallback={null}>
          <Features />
          <HowItWorks />
          <CTA isAuthenticated={isAuthenticated} />
        </Suspense>
      </main>
    </PublicLayout>
  )
}
