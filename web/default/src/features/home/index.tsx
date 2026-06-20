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
import { useAuthStore } from '@/stores/auth-store'
import { Markdown } from '@/components/ui/markdown'
import { PublicLayout } from '@/components/layout/components/public-layout'
import { CTA } from './components/sections/cta'
import { Features } from './components/sections/features'
import { Hero } from './components/sections/hero'
import { HowItWorks } from './components/sections/how-it-works'
import { Stats } from './components/sections/stats'
import { useHomePageContent } from './hooks'

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
              <Markdown className='custom-home-content'>{content}</Markdown>
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
          <Stats className='pb-14 md:pb-16' />
        </section>
        <Features />
        <HowItWorks />
        <CTA isAuthenticated={isAuthenticated} />
      </main>
    </PublicLayout>
  )
}
