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
import { useState } from 'react'
import {
  ArrowRight,
  AudioLines,
  BadgeDollarSign,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  CreditCard,
  FileText,
  Image,
  KeyRound,
  ListChecks,
  MessageSquareText,
  Network,
  PanelLeft,
  RadioTower,
  Route,
  ShieldCheck,
  TerminalSquare,
  Video,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'

type GuideSection = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  bullets: string[]
}

type EndpointGroup = {
  title: string
  icon: LucideIcon
  rows: Array<[method: string, path: string, description: string]>
}

const guideSections: GuideSection[] = [
  {
    id: 'quick-start',
    title: '快速接入',
    description: '从控制台创建 API 密钥后，即可用统一地址调用已启用的模型。',
    icon: Zap,
    bullets: [
      '进入控制台的 API 密钥页面，创建用于服务端调用的密钥。',
      '在模型广场确认模型名称、供应商、接口类型和可用分组。',
      '使用 Bearer Token 认证，请求地址统一使用当前站点的 /v1 前缀。',
      '调用记录、消耗、错误与耗时可在使用日志中查看。',
    ],
  },
  {
    id: 'authentication',
    title: '认证与密钥',
    description:
      '每次请求都需要携带 API 密钥，密钥可按模型、分组和额度策略进行管理。',
    icon: ShieldCheck,
    bullets: [
      '推荐请求头格式：Authorization: Bearer sk-xxxx。',
      'Claude / Anthropic 格式接口也可使用 x-api-key 请求头。',
      '不要在浏览器前端暴露密钥，请从自己的服务端发起请求。',
      '如密钥泄露，请立即在控制台禁用或删除后重新创建。',
    ],
  },
  {
    id: 'routing',
    title: '模型路由',
    description: '中转站会根据模型、渠道、分组和系统策略选择可用上游。',
    icon: Route,
    bullets: [
      '模型名称以模型广场展示为准，请直接复制完整模型标识。',
      '同一模型可以配置多个渠道，用于故障切换、优先级调度和负载分摊。',
      '分组会影响可用模型范围和计费倍率，具体以控制台配置为准。',
      '上游异常时，系统会按渠道策略记录失败并尝试可用路由。',
    ],
  },
  {
    id: 'billing',
    title: '额度与日志',
    description: '请求会按模型倍率、分组倍率和接口类型折算额度。',
    icon: BadgeDollarSign,
    bullets: [
      '余额不足、密钥无权限或分组不可用时，请求会被拒绝。',
      'Token 计费模型按输入、输出、缓存、音频等用量折算。',
      '按次计费模型会根据请求次数或任务结果扣除额度。',
      '使用日志可用于排查状态码、耗时、Token、费用和渠道命中情况。',
    ],
  },
]

const endpointGroups: EndpointGroup[] = [
  {
    title: '文本与对话',
    icon: MessageSquareText,
    rows: [
      ['GET', '/v1/models', '获取当前可用模型列表'],
      ['POST', '/v1/chat/completions', 'OpenAI 兼容聊天对话'],
      ['POST', '/v1/responses', 'Responses API 响应生成'],
      ['POST', '/v1/messages', 'Claude Messages 格式调用'],
      ['POST', '/v1/completions', '文本补全'],
    ],
  },
  {
    title: '多模态能力',
    icon: Image,
    rows: [
      ['POST', '/v1/images/generations', '图像生成'],
      ['POST', '/v1/images/edits', '图像编辑'],
      ['POST', '/v1/audio/transcriptions', '音频转录'],
      ['POST', '/v1/audio/translations', '音频翻译'],
      ['POST', '/v1/audio/speech', '文本转语音'],
    ],
  },
  {
    title: '视频与任务',
    icon: Video,
    rows: [
      ['POST', '/v1/videos', 'OpenAI 兼容视频任务'],
      ['GET', '/v1/videos/{task_id}', '查询视频任务状态'],
      ['POST', '/v1/video/generations', '创建视频生成任务'],
      ['GET', '/v1/video/generations/{task_id}', '查询视频生成结果'],
      ['POST', '/kling/v1/videos/text2video', 'Kling 文生视频'],
    ],
  },
  {
    title: '向量与工具',
    icon: Network,
    rows: [
      ['POST', '/v1/embeddings', '文本向量嵌入'],
      ['POST', '/v1/rerank', '文档重排序'],
      ['POST', '/v1/moderations', '内容审核'],
      ['GET', '/v1/realtime', '实时 WebSocket 对话'],
      ['GET', '/v1beta/models', 'Gemini 格式模型列表'],
    ],
  },
]

const workflow = [
  {
    title: '创建密钥',
    text: '在控制台创建 API 密钥，并按需要配置模型范围、分组、额度与速率限制。',
  },
  {
    title: '选择模型',
    text: '在模型广场查看可用模型、接口类型、价格倍率、供应商和性能指标。',
  },
  {
    title: '发起请求',
    text: '把 SDK 的 base_url 指向当前站点 /v1，并使用创建的密钥完成认证。',
  },
  {
    title: '观察用量',
    text: '通过概览、使用日志和任务日志查看费用、耗时、错误和路由结果。',
  },
]

const setupSteps = [
  {
    title: '创建 API 密钥',
    description: '为你的应用或服务生成访问凭证。',
    href: '/keys',
    icon: KeyRound,
  },
  {
    title: '添加额度',
    description: '生产流量前确认账户余额充足。',
    href: '/wallet',
    icon: CreditCard,
  },
  {
    title: '发送请求',
    description: '使用 Playground 或客户端验证路由。',
    href: '/playground',
    icon: TerminalSquare,
  },
]

const recommendedActions = [
  {
    title: 'API 密钥',
    description: '创建、禁用和审计调用密钥。',
    href: '/keys',
    icon: KeyRound,
  },
  {
    title: '渠道',
    description: '配置上游供应商和模型路由。',
    href: '/channels',
    icon: RadioTower,
  },
  {
    title: '使用日志',
    description: '查看请求、错误和计费详情。',
    href: '/usage-logs',
    icon: FileText,
  },
  {
    title: '模型广场',
    description: '查看模型能力、倍率和供应商。',
    href: '/pricing',
    icon: BookOpen,
  },
]

function useBaseUrl() {
  if (typeof window === 'undefined') return '/v1'
  return `${window.location.origin}/v1`
}

function AnchorLink(props: { section: GuideSection }) {
  const Icon = props.section.icon

  return (
    <a
      href={`#${props.section.id}`}
      className='hover:bg-accent flex items-center gap-2 rounded-md px-2 py-2 text-sm leading-5 transition-colors'
    >
      <Icon className='text-muted-foreground size-4' />
      <span>{props.section.title}</span>
    </a>
  )
}

function ApiDocsMobileNavigation() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            className='h-9 gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-950/[0.05] sm:hidden dark:text-slate-300 dark:hover:bg-white/[0.06]'
            aria-label='打开文档导航'
          />
        }
      >
        <PanelLeft className='size-4' aria-hidden='true' />
        <span>目录</span>
      </SheetTrigger>

      <SheetContent
        side='left'
        showCloseButton={false}
        className='top-2 bottom-2 left-2 h-auto w-[min(68vw,17.5rem)] gap-0 rounded-[1.5rem] border border-slate-200/80 bg-white/94 p-0 shadow-[18px_18px_58px_rgba(15,23,42,0.20),0_1px_0_rgba(255,255,255,0.86)_inset] backdrop-blur-2xl sm:max-w-none dark:border-white/10 dark:bg-zinc-950/94 dark:shadow-[18px_18px_64px_rgba(0,0,0,0.58),0_1px_0_rgba(255,255,255,0.08)_inset]'
      >
        <SheetHeader className='px-5 pt-5 pb-2'>
          <SheetTitle className='text-xs font-medium text-slate-400 dark:text-slate-500'>
            文档导航
          </SheetTitle>
          <SheetDescription className='sr-only'>
            跳转到 API 文档的指定章节
          </SheetDescription>
        </SheetHeader>

        <nav className='flex flex-col gap-1 px-3 py-1'>
          {guideSections.map((section) => {
            const Icon = section.icon
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setOpen(false)}
                className='flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium tracking-tight text-slate-700 transition-colors duration-300 hover:bg-white/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
              >
                <Icon className='size-4' aria-hidden='true' />
                <span>{section.title}</span>
              </a>
            )
          })}
          <a
            href='#endpoints'
            onClick={() => setOpen(false)}
            className='flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium tracking-tight text-slate-700 transition-colors duration-300 hover:bg-white/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
          >
            <ListChecks className='size-4' aria-hidden='true' />
            <span>接口清单</span>
          </a>
          <a
            href='#examples'
            onClick={() => setOpen(false)}
            className='flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium tracking-tight text-slate-700 transition-colors duration-300 hover:bg-white/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white'
          >
            <Code2 className='size-4' aria-hidden='true' />
            <span>请求示例</span>
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

function EndpointTable(props: { group: EndpointGroup }) {
  const Icon = props.group.icon

  return (
    <section className='bg-card rounded-2xl border shadow-xs'>
      <div className='border-b p-4'>
        <div className='flex items-center gap-2 font-semibold'>
          <Icon className='text-muted-foreground size-4' />
          {props.group.title}
        </div>
      </div>
      <div className='divide-y'>
        {props.group.rows.map(([method, path, description]) => (
          <div
            key={`${method}-${path}`}
            className='grid gap-2 p-4 sm:grid-cols-[84px_minmax(0,1fr)_180px] sm:items-center'
          >
            <span className='bg-muted inline-flex w-fit rounded-md px-2 py-1 font-mono text-xs font-semibold'>
              {method}
            </span>
            <code className='min-w-0 truncate text-sm'>{path}</code>
            <span className='text-muted-foreground text-sm'>{description}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SetupGuideCard() {
  return (
    <section className='grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]'>
      <div className='bg-card relative overflow-hidden rounded-2xl border shadow-xs'>
        <div
          className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_48%_120%_at_78%_0%,color-mix(in_oklch,var(--primary)_8%,transparent)_0%,transparent_62%),linear-gradient(112deg,color-mix(in_oklch,var(--card)_98%,var(--primary)_2%)_0%,color-mix(in_oklch,var(--card)_94%,var(--muted)_6%)_48%,color-mix(in_oklch,var(--background)_92%,var(--accent)_8%)_100%)] opacity-85 dark:opacity-65'
          aria-hidden='true'
        />
        <div className='relative grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_21rem]'>
          <div className='flex min-w-0 flex-col gap-5'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='flex max-w-2xl flex-col gap-1'>
                <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase'>
                  <ListChecks className='size-3.5' aria-hidden='true' />
                  开始使用
                </div>
                <h2 className='text-xl font-semibold tracking-tight sm:text-2xl'>
                  几分钟内开始使用你的 API 网关
                </h2>
                <p className='text-muted-foreground max-w-xl text-sm leading-relaxed'>
                  集中完成密钥、余额、路由和请求验证配置，把中转站接入流程放在文档中统一查看。
                </p>
              </div>
              <a
                href='/keys'
                className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium shadow-xs transition-colors'
              >
                <KeyRound className='size-4' />
                创建 API 密钥
              </a>
            </div>

            <ol className='bg-background/45 rounded-2xl border p-2 backdrop-blur'>
              {setupSteps.map((step, index) => {
                const Icon = step.icon

                return (
                  <li
                    key={step.title}
                    className='relative flex gap-3 pb-2.5 last:pb-0'
                  >
                    {index < setupSteps.length - 1 && (
                      <span
                        className='bg-border absolute top-9 bottom-0 left-4 w-px'
                        aria-hidden='true'
                      />
                    )}
                    <span className='bg-background relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border shadow-xs'>
                      <CheckCircle2 className='text-muted-foreground size-4' />
                    </span>
                    <a
                      href={step.href}
                      className='bg-background/70 hover:bg-muted/50 focus-visible:ring-ring flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left shadow-xs transition-colors outline-none focus-visible:ring-2'
                    >
                      <span className='flex min-w-0 items-start gap-2.5'>
                        <span className='bg-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg'>
                          <Icon className='size-3.5' aria-hidden='true' />
                        </span>
                        <span className='flex min-w-0 flex-col gap-0.5'>
                          <span className='flex items-center gap-2 text-sm font-medium'>
                            <span className='text-muted-foreground font-mono text-xs tabular-nums'>
                              {index + 1}.
                            </span>
                            <span className='truncate'>{step.title}</span>
                          </span>
                          <span className='text-muted-foreground line-clamp-1 text-xs'>
                            {step.description}
                          </span>
                        </span>
                      </span>
                      <ArrowRight
                        className='text-muted-foreground size-4 shrink-0'
                        aria-hidden='true'
                      />
                    </a>
                  </li>
                )
              })}
            </ol>
          </div>

          <div className='bg-background/75 rounded-2xl border p-3 shadow-sm backdrop-blur'>
            <div className='flex items-center justify-between gap-3 border-b pb-3'>
              <div className='flex min-w-0 items-center gap-2'>
                <span className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-lg'>
                  <TerminalSquare className='size-4' aria-hidden='true' />
                </span>
                <div className='min-w-0'>
                  <div className='truncate text-sm font-medium'>
                    首个 API 请求
                  </div>
                  <div className='text-muted-foreground truncate text-xs'>
                    创建 API 密钥后即可复制真实请求
                  </div>
                </div>
              </div>
              <a
                href='/keys'
                className='hover:bg-accent inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium transition-colors'
              >
                创建 API 密钥
              </a>
            </div>

            <pre className='bg-foreground/[0.035] my-3 overflow-hidden rounded-xl p-3 font-mono text-xs leading-5'>
              <code>{`curl ${useBaseUrl()}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-..." \\
  -d '{"model":"gpt-4o-mini",...}'`}</code>
            </pre>

            <div className='grid gap-2'>
              {[
                ['路由已启用', '当前域名', RadioTower],
                ['认证已配置', '需要 API 密钥', ShieldCheck],
                ['已选择模型', '模型广场', Bot],
              ].map(([label, value, Icon]) => {
                const SignalIcon = Icon as typeof RadioTower

                return (
                  <div
                    key={label as string}
                    className='bg-muted/40 flex items-center justify-between gap-3 rounded-xl px-3 py-2'
                  >
                    <span className='flex min-w-0 items-center gap-2'>
                      <SignalIcon className='text-muted-foreground size-3.5 shrink-0' />
                      <span className='truncate text-xs font-medium'>
                        {label as string}
                      </span>
                    </span>
                    <span className='text-muted-foreground shrink-0 text-xs'>
                      {value as string}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className='bg-card rounded-2xl border p-4 shadow-xs sm:p-5'>
        <div className='flex h-full flex-col gap-4'>
          <div className='flex flex-col gap-1'>
            <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
              推荐操作
            </div>
            <h2 className='text-lg font-semibold tracking-tight'>
              保持平台就绪
            </h2>
          </div>
          <div className='grid gap-2'>
            {recommendedActions.map((action) => {
              const Icon = action.icon

              return (
                <a
                  key={action.title}
                  href={action.href}
                  className='hover:bg-muted/50 flex min-w-0 items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors'
                >
                  <span className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg'>
                    <Icon className='size-4' aria-hidden='true' />
                  </span>
                  <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                    <span className='truncate text-sm font-medium'>
                      {action.title}
                    </span>
                    <span className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
                      {action.description}
                    </span>
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ApiDocs() {
  const baseUrl = useBaseUrl()

  return (
    <PublicLayout
      showMainContainer={false}
      headerProps={{
        hideMobileBrand: true,
        mobileLeadingContent: <ApiDocsMobileNavigation />,
      }}
    >
      <PageTransition className='mx-auto w-full max-w-[1800px] px-3 pt-20 pb-8 sm:px-5 sm:pt-24 sm:pb-10 xl:px-6'>
        <div className='grid w-full gap-4 xl:grid-cols-[240px_minmax(0,1fr)]'>
          <aside className='hidden xl:block'>
            <div className='bg-card sticky top-20 rounded-xl border p-2.5 shadow-xs'>
              <div className='flex items-center gap-2 px-2 py-2'>
                <BookOpen className='text-muted-foreground size-4' />
                <span className='text-sm leading-5 font-semibold'>API文档</span>
              </div>
              <div className='mt-1.5 space-y-1'>
                {guideSections.map((section) => (
                  <AnchorLink key={section.id} section={section} />
                ))}
                <a
                  href='#endpoints'
                  className='hover:bg-accent flex items-center gap-2 rounded-md px-2 py-2 text-sm leading-5 transition-colors'
                >
                  <ListChecks className='text-muted-foreground size-4' />
                  <span>接口清单</span>
                </a>
                <a
                  href='#examples'
                  className='hover:bg-accent flex items-center gap-2 rounded-md px-2 py-2 text-sm leading-5 transition-colors'
                >
                  <Code2 className='text-muted-foreground size-4' />
                  <span>请求示例</span>
                </a>
              </div>
            </div>
          </aside>

          <main className='min-w-0 space-y-4'>
            <SetupGuideCard />

            <section className='bg-card rounded-2xl border p-5 shadow-xs sm:p-6'>
              <div className='flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
                <div className='max-w-3xl'>
                  <div className='border-border text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium'>
                    <BookOpen className='size-3.5' />
                    连界 API 智能网关
                  </div>
                  <h1 className='mt-4 text-2xl font-semibold tracking-normal sm:text-3xl'>
                    API文档
                  </h1>
                  <p className='text-muted-foreground mt-3 max-w-2xl text-sm leading-6'>
                    通过统一的接口调用多家上游模型服务，集中管理 API
                    密钥、模型路由、渠道状态、额度计费和调用日志。
                  </p>
                </div>

                <div className='bg-muted/40 rounded-2xl border p-3 font-mono text-xs'>
                  <div className='text-muted-foreground mb-2 flex items-center gap-2'>
                    <TerminalSquare className='size-3.5' />
                    Base URL
                  </div>
                  <code>{baseUrl}</code>
                </div>
              </div>
            </section>

            <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              {workflow.map((step, index) => (
                <article
                  key={step.title}
                  className='bg-card rounded-2xl border p-4 shadow-xs'
                >
                  <div className='mb-4 flex items-center justify-between'>
                    <span className='bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-sm font-semibold'>
                      {index + 1}
                    </span>
                    <CheckCircle2 className='text-muted-foreground size-4' />
                  </div>
                  <h2 className='font-semibold'>{step.title}</h2>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    {step.text}
                  </p>
                </article>
              ))}
            </section>

            <section className='grid gap-4 md:grid-cols-2'>
              {guideSections.map((section) => {
                const Icon = section.icon

                return (
                  <article
                    id={section.id}
                    key={section.id}
                    className='bg-card scroll-mt-24 rounded-2xl border p-5 shadow-xs'
                  >
                    <div className='bg-muted/50 mb-4 flex size-10 items-center justify-center rounded-xl'>
                      <Icon className='size-5' />
                    </div>
                    <h2 className='font-semibold'>{section.title}</h2>
                    <p className='text-muted-foreground mt-2 text-sm leading-6'>
                      {section.description}
                    </p>
                    <div className='mt-4 space-y-2'>
                      {section.bullets.map((item) => (
                        <div
                          key={item}
                          className='text-muted-foreground flex items-start gap-2 text-sm leading-6'
                        >
                          <span className='bg-primary mt-2 size-1.5 shrink-0 rounded-full' />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </section>

            <section id='endpoints' className='scroll-mt-24 space-y-4'>
              <div className='flex items-center gap-2 font-semibold'>
                <FileText className='text-muted-foreground size-4' />
                接口清单
              </div>
              <div className='grid gap-4 xl:grid-cols-2'>
                {endpointGroups.map((group) => (
                  <EndpointTable key={group.title} group={group} />
                ))}
              </div>
            </section>

            <section
              id='examples'
              className='grid scroll-mt-24 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]'
            >
              <div className='bg-card rounded-2xl border p-4 shadow-xs'>
                <div className='flex items-center gap-2 font-semibold'>
                  <Code2 className='text-muted-foreground size-4' />
                  cURL 请求示例
                </div>
                <pre className='bg-muted/50 mt-4 overflow-x-auto rounded-xl p-4 text-xs leading-6'>
                  <code>{`curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer sk-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      { "role": "user", "content": "你好，介绍一下你自己" }
    ],
    "stream": false
  }'`}</code>
                </pre>
              </div>

              <div className='space-y-4'>
                <div className='bg-card rounded-2xl border p-4 shadow-xs'>
                  <div className='flex items-center gap-2 font-semibold'>
                    <Bot className='text-muted-foreground size-4' />
                    SDK 配置
                  </div>
                  <pre className='bg-muted/50 mt-4 overflow-x-auto rounded-xl p-4 text-xs leading-6'>
                    <code>{`import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: "${baseUrl}",
})`}</code>
                  </pre>
                </div>

                <div className='bg-card rounded-2xl border p-4 shadow-xs'>
                  <div className='flex items-center gap-2 font-semibold'>
                    <KeyRound className='text-muted-foreground size-4' />
                    调用前检查
                  </div>
                  <div className='text-muted-foreground mt-4 space-y-2 text-sm leading-6'>
                    <p>确认密钥未过期、余额充足，并具备所选模型和分组权限。</p>
                    <p>确认模型名称与模型广场展示一致，避免使用上游别名。</p>
                    <p>如果请求失败，请优先查看使用日志中的错误详情。</p>
                  </div>
                </div>
              </div>
            </section>

            <section className='grid gap-4 md:grid-cols-3'>
              <div className='bg-card rounded-2xl border p-4 shadow-xs'>
                <AudioLines className='text-muted-foreground mb-3 size-5' />
                <h2 className='font-semibold'>音频能力</h2>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  支持转录、翻译和语音合成，具体模型能力以模型广场为准。
                </p>
              </div>
              <div className='bg-card rounded-2xl border p-4 shadow-xs'>
                <Image className='text-muted-foreground mb-3 size-5' />
                <h2 className='font-semibold'>图像能力</h2>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  可通过图像生成和编辑接口调用已接入的多模态供应商。
                </p>
              </div>
              <div className='bg-card rounded-2xl border p-4 shadow-xs'>
                <Video className='text-muted-foreground mb-3 size-5' />
                <h2 className='font-semibold'>视频任务</h2>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  视频生成通常为异步任务，提交后通过任务 ID 查询状态和结果。
                </p>
              </div>
            </section>
          </main>
        </div>
      </PageTransition>
    </PublicLayout>
  )
}
