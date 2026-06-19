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
import { ExternalLink, FileWarning } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/dialog'
import type { LegalDocumentResponse } from '@/features/legal/types'

type LegalDocumentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  queryKey: string
  fetchDocument: () => Promise<LegalDocumentResponse>
  emptyMessage: string
}

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

export function LegalDocumentDialog({
  open,
  onOpenChange,
  queryKey,
  fetchDocument,
  emptyMessage,
}: LegalDocumentDialogProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: fetchDocument,
    enabled: open,
    staleTime: 10 * 60 * 1000,
  })

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isValidUrl(rawContent)
  const isHtml = hasContent && !isUrl && isLikelyHtml(rawContent)
  const success = data?.success ?? false

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title=''
      contentHeight='min(70vh, 620px)'
      contentClassName='sm:max-w-3xl gap-0 overflow-hidden rounded-2xl p-0'
      headerClassName='hidden'
      bodyClassName='px-7 py-6 text-sm sm:px-8'
      footerClassName='bg-background justify-center border-t px-6 py-4 sm:justify-center sm:p-4'
      showCloseButton
      footer={
        <Button
          type='button'
          className='h-9 min-w-24 rounded-full px-6'
          onClick={() => onOpenChange(false)}
        >
          {t('Confirm')}
        </Button>
      }
    >
      {isLoading ? (
        <div className='space-y-3'>
          <Skeleton className='h-7 w-2/5' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[92%]' />
          <Skeleton className='h-4 w-[84%]' />
          <Skeleton className='h-4 w-[74%]' />
        </div>
      ) : !success || !hasContent ? (
        <div className='border-border/70 bg-muted/30 flex items-start gap-3 rounded-lg border p-4'>
          <FileWarning className='text-muted-foreground mt-0.5 size-5 shrink-0' />
          <p className='text-muted-foreground text-sm'>
            {data?.message || emptyMessage}
          </p>
        </div>
      ) : isUrl ? (
        <div className='border-border/70 bg-muted/30 space-y-3 rounded-lg border p-4'>
          <p className='text-muted-foreground text-sm'>
            {t(
              'The administrator configured an external link for this document.'
            )}
          </p>
          <Button
            render={
              <a href={rawContent} target='_blank' rel='noopener noreferrer' />
            }
          >
            <ExternalLink />
            {t('View document')}
          </Button>
        </div>
      ) : isHtml ? (
        <div className='legal-html-content [&_a]:text-primary [&_:first-child]:mt-0 [&_a:hover]:underline [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse'>
          <div
            className='prose prose-neutral dark:prose-invert max-w-none'
            dangerouslySetInnerHTML={{ __html: rawContent }}
          />
        </div>
      ) : (
        <div className='[&_a]:text-primary [&_:first-child]:mt-0 [&_a:hover]:underline [&_img]:max-w-full [&_table]:w-full [&_table]:border-collapse'>
          <Markdown className='prose-neutral dark:prose-invert max-w-none'>
            {rawContent}
          </Markdown>
        </div>
      )}
    </Dialog>
  )
}
