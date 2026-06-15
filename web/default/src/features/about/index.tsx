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
import { useQuery } from '@tanstack/react-query'
import { FileQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Markdown } from '@/components/ui/markdown'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { getAboutContent } from './api'

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isLikelyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function EmptyAboutState() {
  return (
    <div className='relative min-h-svh overflow-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#eef6fb_48%,#f8fbff_100%)] dark:bg-[linear-gradient(180deg,#050505_0%,#0a0a0b_42%,#111113_100%)]'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.58)_26%,transparent_56%),radial-gradient(circle_at_22%_18%,rgba(125,211,252,0.22)_0%,transparent_34%),radial-gradient(circle_at_82%_12%,rgba(153,246,228,0.18)_0%,transparent_32%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(148,163,184,0.1),transparent_32%),radial-gradient(circle_at_76%_20%,rgba(255,255,255,0.055),transparent_28%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.035),transparent_44%)]'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.018)_1px,transparent_1px)] bg-[size:96px_96px] opacity-60 dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] dark:opacity-35'
      />

      <div className='relative mx-auto flex min-h-svh w-full max-w-[1500px] items-center justify-center px-3 pt-20 pb-10 sm:px-5 sm:pt-24 sm:pb-12 xl:px-6'>
        <div className='flex max-w-sm -translate-y-[432px] flex-col items-center text-center sm:-translate-y-[440px]'>
          <div className='flex size-14 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:shadow-[0_20px_60px_rgba(0,0,0,0.42)]'>
            <FileQuestion className='size-6' />
          </div>
          <h1 className='mt-6 text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100'>
            主人暂未设置
          </h1>
          <p className='mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400'>
            关于页面还没有配置内容，稍后再来看看。
          </p>
        </div>
      </div>
    </div>
  )
}

export function About() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isValidUrl(rawContent)
  const isHtml = hasContent && !isUrl && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-3 pt-20 pb-10 sm:px-5 sm:pt-24 sm:pb-12 xl:px-6'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout showMainContainer={false}>
        <EmptyAboutState />
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='mx-auto w-full max-w-[1500px] px-3 pt-20 pb-10 sm:px-5 sm:pt-24 sm:pb-12 xl:px-6'>
        {isHtml ? (
          <div
            className='prose prose-neutral dark:prose-invert max-w-none [&_.about-page]:!mx-0 [&_.about-page]:!w-full [&_.about-page]:!max-w-none [&_.about-page]:!px-0'
            dangerouslySetInnerHTML={{ __html: rawContent }}
          />
        ) : (
          <Markdown className='prose-neutral dark:prose-invert max-w-none [&_.about-page]:!mx-0 [&_.about-page]:!w-full [&_.about-page]:!max-w-none [&_.about-page]:!px-0'>
            {rawContent}
          </Markdown>
        )}
      </div>
    </PublicLayout>
  )
}
