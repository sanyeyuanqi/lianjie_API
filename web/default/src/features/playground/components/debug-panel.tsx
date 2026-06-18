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
import { CheckCircle, Clock, Code, Copy, Eye, Send, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { DebugData } from '../types'

interface DebugPanelProps {
  data: DebugData
}

function formatContent(content: unknown) {
  if (content === null || content === undefined || content === '') {
    return ''
  }

  if (typeof content === 'string') {
    try {
      return JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      return content
    }
  }

  return JSON.stringify(content, null, 2)
}

function CodeBlock({
  content,
  emptyText,
}: {
  content: unknown
  emptyText: string
}) {
  const { t } = useTranslation()
  const formatted = useMemo(() => formatContent(content), [content])

  const handleCopy = async () => {
    if (!formatted) return
    try {
      await navigator.clipboard.writeText(formatted)
      toast.success(t('Copied!'))
    } catch {
      toast.error(t('复制失败'))
    }
  }

  if (!formatted) {
    return (
      <div className='text-muted-foreground flex h-full min-h-44 items-center justify-center rounded-lg border border-dashed text-sm'>
        {emptyText}
      </div>
    )
  }

  return (
    <div className='bg-muted/35 text-foreground dark:bg-zinc-900/80 dark:text-zinc-100 relative h-full min-h-0 overflow-hidden rounded-lg border border-border/80 shadow-inner'>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        className='bg-background/85 text-muted-foreground hover:bg-background hover:text-foreground dark:bg-zinc-800/85 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white absolute top-2 right-2 z-10 border shadow-sm'
        onClick={handleCopy}
        aria-label={t('Copy')}
      >
        <Copy className='size-3.5' />
      </Button>
      <pre className='selection:bg-primary/15 h-full overflow-auto p-3 pr-12 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-zinc-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2'>
        {formatted}
      </pre>
    </div>
  )
}

function SseViewer({ messages }: { messages: string[] }) {
  const { t } = useTranslation()

  if (messages.length === 0) {
    return (
      <div className='text-muted-foreground flex h-full min-h-44 items-center justify-center rounded-lg border border-dashed text-sm'>
        {t('暂无SSE响应数据')}
      </div>
    )
  }

  return (
    <div className='flex h-full min-h-0 flex-col rounded-lg border'>
      <div className='flex shrink-0 items-center justify-between border-b px-3 py-2'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <Zap className='text-primary size-4' />
          <span>SSE</span>
          <Badge variant='secondary'>{messages.length}</Badge>
        </div>
      </div>
      <div className='flex-1 space-y-2 overflow-auto p-3'>
        {messages.map((message, index) => {
          const isDone = message === '[DONE]'
          let parsed: unknown = message

          if (!isDone) {
            try {
              parsed = JSON.parse(message)
            } catch {
              parsed = message
            }
          }

          return (
            <details
              key={`${index}-${message.slice(0, 12)}`}
              className='group rounded-md border bg-background'
              open={index === messages.length - 1 || isDone}
            >
              <summary className='flex cursor-pointer items-center gap-2 px-3 py-2 text-xs'>
                <Badge variant='outline'>#{index + 1}</Badge>
                {isDone ? (
                  <>
                    <CheckCircle className='size-3.5 text-green-600' />
                    <span className='font-medium text-green-600'>[DONE]</span>
                  </>
                ) : (
                  <span className='text-muted-foreground truncate'>
                    {typeof parsed === 'object' && parsed !== null
                      ? ((parsed as { id?: string; object?: string }).id ??
                        (parsed as { object?: string }).object ??
                        t('SSE 事件'))
                      : t('SSE 事件')}
                  </span>
                )}
              </summary>
              <div className='border-t p-2'>
                <CodeBlock
                  content={isDone ? '[DONE]' : parsed}
                  emptyText={t('暂无响应数据')}
                />
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}

export function DebugPanel({ data }: DebugPanelProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('preview')

  const lastTime = data.timestamp
    ? new Date(data.timestamp).toLocaleString()
    : data.previewTimestamp
      ? new Date(data.previewTimestamp).toLocaleString()
      : ''

  return (
    <aside className='bg-background hidden h-full w-[360px] shrink-0 border-l xl:flex xl:flex-col'>
      <div className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
        <Code className='text-muted-foreground size-4' />
        <h2 className='text-sm font-semibold'>{t('调试信息')}</h2>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='flex min-h-0 flex-1 flex-col gap-0'
      >
        <div className='border-b px-3 py-2'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='preview' className='gap-1'>
              <Eye className='size-3.5' />
              {t('预览')}
            </TabsTrigger>
            <TabsTrigger value='request' className='gap-1'>
              <Send className='size-3.5' />
              {t('请求')}
            </TabsTrigger>
            <TabsTrigger value='response' className='gap-1'>
              <Zap className='size-3.5' />
              {t('响应')}
              {data.sseMessages.length > 0 && (
                <Badge className='h-4 px-1 text-[10px]'>
                  {data.sseMessages.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value='preview'
          className={cn('min-h-0 flex-1 p-3', activeTab !== 'preview' && 'hidden')}
        >
          <CodeBlock
            content={data.previewRequest}
            emptyText={t('正在构造请求体预览...')}
          />
        </TabsContent>
        <TabsContent
          value='request'
          className={cn('min-h-0 flex-1 p-3', activeTab !== 'request' && 'hidden')}
        >
          <CodeBlock content={data.request} emptyText={t('暂无请求数据')} />
        </TabsContent>
        <TabsContent
          value='response'
          className={cn('min-h-0 flex-1 p-3', activeTab !== 'response' && 'hidden')}
        >
          {data.sseMessages.length > 0 ? (
            <SseViewer messages={data.sseMessages} />
          ) : (
            <CodeBlock content={data.response} emptyText={t('暂无响应数据')} />
          )}
        </TabsContent>
      </Tabs>

      <div className='text-muted-foreground flex h-10 shrink-0 items-center gap-2 border-t px-4 text-xs'>
        <Clock className='size-3.5' />
        <span>
          {lastTime ? `${t('最后请求')}: ${lastTime}` : t('暂无请求数据')}
        </span>
      </div>
    </aside>
  )
}
