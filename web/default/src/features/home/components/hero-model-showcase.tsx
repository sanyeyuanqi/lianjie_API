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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getLobeIcon } from '@/lib/lobe-icon'
import { cn } from '@/lib/utils'

type ModelTone = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky'

type HeroModel = {
  id: string
  name: string
  icon: string
  vendor: string
  context: string
  latency: string
  accent: ModelTone
}

const MODELS: HeroModel[] = [
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    icon: 'Claude.Color',
    vendor: 'Anthropic',
    context: 'Reason',
    latency: '118ms',
    accent: 'amber',
  },
  {
    id: 'claude-opus-4-8',
    name: 'Claude Opus 4.8',
    icon: 'Anthropic.Color',
    vendor: 'Anthropic',
    context: 'Agent',
    latency: '126ms',
    accent: 'violet',
  },
  {
    id: 'gpt-5-5',
    name: 'GPT-5.5',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'General',
    latency: '104ms',
    accent: 'emerald',
  },
  {
    id: 'gpt-5-5-pro',
    name: 'GPT-5.5 Pro',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'Tools',
    latency: '112ms',
    accent: 'cyan',
  },
  {
    id: 'gemini-3-5-flash',
    name: 'Gemini 3.5 Flash',
    icon: 'Gemini.Color',
    vendor: 'Google',
    context: 'Omni',
    latency: '72ms',
    accent: 'sky',
  },
  {
    id: 'gemini-3-1-pro',
    name: 'Gemini 3.1 Pro',
    icon: 'Google.Color',
    vendor: 'Google',
    context: 'Long ctx',
    latency: '96ms',
    accent: 'emerald',
  },
  {
    id: 'minimax-m2-5-high',
    name: 'MiniMax M2.5 high reasoning',
    icon: 'Minimax.Color',
    vendor: 'MiniMax',
    context: 'Coding',
    latency: '98ms',
    accent: 'rose',
  },
  {
    id: 'gemini-3-flash-coding',
    name: 'Gemini 3 Flash high reasoning',
    icon: 'Gemini.Color',
    vendor: 'Google',
    context: 'Coding',
    latency: '78ms',
    accent: 'sky',
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    icon: 'Claude.Color',
    vendor: 'Anthropic',
    context: 'Coding',
    latency: '122ms',
    accent: 'amber',
  },
  {
    id: 'gpt-5-2-codex',
    name: 'GPT-5-2 Codex',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'Codex',
    latency: '106ms',
    accent: 'emerald',
  },
  {
    id: 'glm-5-2',
    name: 'GLM-5.2',
    icon: 'Zhipu.Color',
    vendor: 'Zhipu AI',
    context: 'Open',
    latency: '101ms',
    accent: 'cyan',
  },
  {
    id: 'minimax-m3',
    name: 'MiniMax-M3',
    icon: 'Minimax.Color',
    vendor: 'MiniMax',
    context: 'Open',
    latency: '97ms',
    accent: 'violet',
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    icon: 'DeepSeek.Color',
    vendor: 'DeepSeek',
    context: 'Open',
    latency: '109ms',
    accent: 'emerald',
  },
  {
    id: 'kimi-k2-6',
    name: 'Kimi K2.6',
    icon: '/model-icons/kimi.png',
    vendor: 'Moonshot AI',
    context: 'Agent',
    latency: '108ms',
    accent: 'amber',
  },
  {
    id: 'gpt-5-5-vision',
    name: 'GPT-5.5 Vision',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'Vision',
    latency: '114ms',
    accent: 'emerald',
  },
  {
    id: 'gemini-3-5-flash-vision',
    name: 'Gemini 3.5 Flash Vision',
    icon: 'Gemini.Color',
    vendor: 'Google',
    context: 'Vision',
    latency: '82ms',
    accent: 'sky',
  },
  {
    id: 'gemini-3-1-pro-vision',
    name: 'Gemini 3.1 Pro Vision',
    icon: 'Google.Color',
    vendor: 'Google',
    context: 'Vision',
    latency: '96ms',
    accent: 'cyan',
  },
  {
    id: 'claude-fable-5-vision',
    name: 'Claude Fable 5 Vision',
    icon: 'Anthropic.Color',
    vendor: 'Anthropic',
    context: 'PDF',
    latency: '123ms',
    accent: 'amber',
  },
  {
    id: 'gpt-image-2-high',
    name: 'GPT Image 2 high',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'Image',
    latency: '1.5s',
    accent: 'emerald',
  },
  {
    id: 'gpt-image-1-5-high',
    name: 'GPT Image 1.5 high',
    icon: 'Dalle.Color',
    vendor: 'OpenAI',
    context: 'Image',
    latency: '1.7s',
    accent: 'sky',
  },
  {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    icon: 'Gemini.Color',
    vendor: 'Google',
    context: 'Image',
    latency: '1.1s',
    accent: 'rose',
  },
  {
    id: 'gemini-3-1-flash-image',
    name: 'Gemini 3.1 Flash Image',
    icon: 'Google.Color',
    vendor: 'Google',
    context: 'Edit',
    latency: '1.2s',
    accent: 'cyan',
  },
  {
    id: 'gpt-image-2-medium',
    name: 'gpt-image-2 medium',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'Edit',
    latency: '1.3s',
    accent: 'emerald',
  },
  {
    id: 'mai-image-2-5',
    name: 'MAI Image 2.5',
    icon: 'Microsoft.Color',
    vendor: 'Microsoft',
    context: 'Edit',
    latency: '1.4s',
    accent: 'violet',
  },
  {
    id: 'chatgpt-image-latest-high-fidelity',
    name: 'ChatGPT Image high-fidelity',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'Edit',
    latency: '1.6s',
    accent: 'amber',
  },
  {
    id: 'flux-2-flex',
    name: 'FLUX.2 flex',
    icon: 'Flux.Color',
    vendor: 'Black Forest Labs',
    context: 'Edit',
    latency: '1.2s',
    accent: 'rose',
  },
  {
    id: 'gemini-omni-flash-video',
    name: 'Gemini Omni Flash',
    icon: 'Gemini.Color',
    vendor: 'Google',
    context: 'Video',
    latency: '2.0s',
    accent: 'sky',
  },
  {
    id: 'dreamina-seedance-2',
    name: 'Dreamina Seedance 2.0',
    icon: 'ByteDance.Color',
    vendor: 'ByteDance',
    context: 'Video',
    latency: '2.1s',
    accent: 'rose',
  },
  {
    id: 'kling-3',
    name: 'Kling 3.0',
    icon: 'Kling.Color',
    vendor: 'Kuaishou',
    context: 'Video',
    latency: '2.3s',
    accent: 'emerald',
  },
  {
    id: 'veo-3-1',
    name: 'Veo 3.1',
    icon: 'Google.Color',
    vendor: 'Google',
    context: 'Video',
    latency: '2.4s',
    accent: 'sky',
  },
  {
    id: 'voxtral-small',
    name: 'Voxtral Small',
    icon: 'Mistral.Color',
    vendor: 'Mistral AI',
    context: 'STT',
    latency: '64ms',
    accent: 'cyan',
  },
  {
    id: 'voxtral-mini-transcribe',
    name: 'Voxtral Mini Transcribe',
    icon: 'Mistral.Color',
    vendor: 'Mistral AI',
    context: 'STT',
    latency: '48ms',
    accent: 'violet',
  },
  {
    id: 'voxtral-mini-transcribe-2',
    name: 'Voxtral Mini Transcribe 2',
    icon: 'Mistral.Color',
    vendor: 'Mistral AI',
    context: 'STT',
    latency: '44ms',
    accent: 'emerald',
  },
  {
    id: 'gpt-4o-transcribe',
    name: 'GPT-4o Transcribe',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'STT',
    latency: '72ms',
    accent: 'sky',
  },
  {
    id: 'elevenlabs-tts',
    name: 'ElevenLabs TTS',
    icon: 'ElevenLabs.Color',
    vendor: 'ElevenLabs',
    context: 'TTS',
    latency: '46ms',
    accent: 'amber',
  },
  {
    id: 'openai-tts',
    name: 'OpenAI TTS',
    icon: 'OpenAI',
    vendor: 'OpenAI',
    context: 'TTS',
    latency: '51ms',
    accent: 'sky',
  },
  {
    id: 'gemini-embedding-2',
    name: 'Gemini Embedding 2',
    icon: 'Gemini.Color',
    vendor: 'Google',
    context: 'Embed',
    latency: '34ms',
    accent: 'violet',
  },
  {
    id: 'qwen3-embedding-8b',
    name: 'Qwen3-Embedding-8B',
    icon: 'Qwen.Color',
    vendor: 'Alibaba Cloud',
    context: 'Embed',
    latency: '38ms',
    accent: 'sky',
  },
  {
    id: 'qwen3-vl-embedding-8b',
    name: 'Qwen3-VL-Embedding-8B',
    icon: 'Qwen.Color',
    vendor: 'Alibaba Cloud',
    context: 'MM Embed',
    latency: '42ms',
    accent: 'emerald',
  },
  {
    id: 'voyage-multimodal-3-5',
    name: 'Voyage Multimodal 3.5',
    icon: 'Voyage.Color',
    vendor: 'Voyage AI',
    context: 'Embed',
    latency: '36ms',
    accent: 'cyan',
  },
  {
    id: 'jina-embeddings-v4',
    name: 'Jina Embeddings v4',
    icon: 'Jina.Color',
    vendor: 'Jina AI',
    context: 'Embed',
    latency: '37ms',
    accent: 'rose',
  },
  {
    id: 'qwen3-vl-reranker-8b',
    name: 'Qwen3-VL-Reranker-8B',
    icon: 'Qwen.Color',
    vendor: 'Alibaba Cloud',
    context: 'Rerank',
    latency: '45ms',
    accent: 'emerald',
  },
  {
    id: 'jina-reranker-v2',
    name: 'Jina Reranker v2',
    icon: 'Jina.Color',
    vendor: 'Jina AI',
    context: 'Rerank',
    latency: '44ms',
    accent: 'cyan',
  },
  {
    id: 'cohere-rerank',
    name: 'Cohere Rerank',
    icon: 'Cohere.Color',
    vendor: 'Cohere',
    context: 'Rerank',
    latency: '41ms',
    accent: 'rose',
  },
  {
    id: 'voyage-rerank',
    name: 'Voyage Rerank',
    icon: 'Voyage.Color',
    vendor: 'Voyage AI',
    context: 'Rerank',
    latency: '39ms',
    accent: 'sky',
  },
  {
    id: 'suno-v5-5',
    name: 'Suno v5.5',
    icon: 'Suno.Color',
    vendor: 'Suno',
    context: 'Music',
    latency: '2.4s',
    accent: 'emerald',
  },
  {
    id: 'udio',
    name: 'Udio',
    icon: 'Udio.Color',
    vendor: 'Udio',
    context: 'Music',
    latency: '2.5s',
    accent: 'violet',
  },
  {
    id: 'lyria-3-pro',
    name: 'Lyria 3 Pro',
    icon: 'Google.Color',
    vendor: 'Google',
    context: 'Music',
    latency: '2.6s',
    accent: 'sky',
  },
  {
    id: 'stable-audio-3',
    name: 'Stable Audio 3.0',
    icon: 'Stability.Color',
    vendor: 'Stability AI',
    context: 'Music',
    latency: '2.7s',
    accent: 'amber',
  },
  {
    id: 'doubao-seed',
    name: 'Doubao Seed',
    icon: 'Doubao.Color',
    vendor: 'ByteDance',
    context: 'Omni',
    latency: '76ms',
    accent: 'rose',
  },
  {
    id: 'seedream-4',
    name: 'Seedream 4.0',
    icon: 'ByteDance.Color',
    vendor: 'ByteDance',
    context: 'Image',
    latency: '1.2s',
    accent: 'amber',
  },
  {
    id: 'seedance-pro',
    name: 'Seedance Pro',
    icon: 'ByteDance.Color',
    vendor: 'ByteDance',
    context: 'Video',
    latency: '2.0s',
    accent: 'cyan',
  },
  {
    id: 'wan-2-2',
    name: 'Wan 2.2',
    icon: 'Qwen.Color',
    vendor: 'Alibaba Cloud',
    context: 'Video',
    latency: '2.2s',
    accent: 'emerald',
  },
  {
    id: 'hunyuan-video',
    name: 'Hunyuan Video',
    icon: 'Hunyuan.Color',
    vendor: 'Tencent',
    context: 'Video',
    latency: '2.5s',
    accent: 'sky',
  },
  {
    id: 'hailuo-2',
    name: 'Hailuo 2',
    icon: 'Hailuo.Color',
    vendor: 'MiniMax',
    context: 'Video',
    latency: '2.1s',
    accent: 'rose',
  },
  {
    id: 'vidu-q1',
    name: 'Vidu Q1',
    icon: 'Vidu.Color',
    vendor: 'Shengshu',
    context: 'Video',
    latency: '2.3s',
    accent: 'amber',
  },
]

const TONE_CLASSES: Record<
  ModelTone,
  {
    glow: string
    ring: string
    text: string
    chip: string
    beam: string
  }
> = {
  cyan: {
    glow: 'from-cyan-400/45 via-cyan-300/18 to-transparent',
    ring: 'border-cyan-300/60 shadow-cyan-500/20',
    text: 'text-cyan-600 dark:text-cyan-300',
    chip: 'bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200',
    beam: 'bg-cyan-400/70',
  },
  violet: {
    glow: 'from-violet-400/45 via-violet-300/18 to-transparent',
    ring: 'border-violet-300/60 shadow-violet-500/20',
    text: 'text-violet-600 dark:text-violet-300',
    chip: 'bg-violet-500/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200',
    beam: 'bg-violet-400/70',
  },
  emerald: {
    glow: 'from-emerald-400/45 via-emerald-300/18 to-transparent',
    ring: 'border-emerald-300/60 shadow-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-300',
    chip: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200',
    beam: 'bg-emerald-400/70',
  },
  amber: {
    glow: 'from-amber-400/45 via-amber-300/18 to-transparent',
    ring: 'border-amber-300/60 shadow-amber-500/20',
    text: 'text-amber-600 dark:text-amber-300',
    chip: 'bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200',
    beam: 'bg-amber-400/70',
  },
  rose: {
    glow: 'from-rose-400/45 via-rose-300/18 to-transparent',
    ring: 'border-rose-300/60 shadow-rose-500/20',
    text: 'text-rose-600 dark:text-rose-300',
    chip: 'bg-rose-500/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200',
    beam: 'bg-rose-400/70',
  },
  sky: {
    glow: 'from-sky-400/45 via-sky-300/18 to-transparent',
    ring: 'border-sky-300/60 shadow-sky-500/20',
    text: 'text-sky-600 dark:text-sky-300',
    chip: 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200',
    beam: 'bg-sky-400/70',
  },
}

const WHEEL_STEP_PX = 82
const WHEEL_RESET_MS = 180
const SWIPE_THRESHOLD_PX = 42
const AUTO_SWITCH_MS = 2600

function normalizeModelIndex(value: number) {
  const index = value % MODELS.length
  return index < 0 ? index + MODELS.length : index
}

function renderModelIcon(icon: string, size: number) {
  if (icon.startsWith('/')) {
    return (
      <img
        src={icon}
        alt=''
        className='size-[78%] rounded-xl object-contain'
        width={size}
        height={size}
        draggable={false}
      />
    )
  }

  return getLobeIcon(icon, size)
}

interface HeroModelShowcaseProps {
  autoPlay?: boolean
  className?: string
  variant?: 'full' | 'stage'
}

export function HeroModelShowcase(props: HeroModelShowcaseProps) {
  const variant = props.variant ?? 'full'
  const isStageOnly = variant === 'stage'
  const [activeStep, setActiveStep] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const wheelRemainderRef = useRef(0)
  const wheelResetRef = useRef<number | null>(null)
  const pointerStartXRef = useRef<number | null>(null)
  const activeIndex = normalizeModelIndex(activeStep)
  const activeModel = MODELS[activeIndex]
  const activeTone = TONE_CLASSES[activeModel.accent]

  const selectRelative = useCallback((offset: number) => {
    if (offset === 0) return
    setActiveStep((prev) => prev + offset)
  }, [])

  const selectModel = useCallback((index: number) => {
    setActiveStep((prev) => {
      const current = normalizeModelIndex(prev)
      let diff = index - current
      if (diff > MODELS.length / 2) diff -= MODELS.length
      if (diff < -MODELS.length / 2) diff += MODELS.length
      return prev + diff
    })
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const handleWheel = (event: globalThis.WheelEvent) => {
      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX

      if (Math.abs(delta) < 8) return
      event.preventDefault()

      wheelRemainderRef.current += delta
      const steps = Math.trunc(wheelRemainderRef.current / WHEEL_STEP_PX)

      if (steps !== 0) {
        const boundedSteps = Math.max(-5, Math.min(5, steps))
        wheelRemainderRef.current -= boundedSteps * WHEEL_STEP_PX
        selectRelative(boundedSteps)
      }

      if (wheelResetRef.current) {
        window.clearTimeout(wheelResetRef.current)
      }
      wheelResetRef.current = window.setTimeout(() => {
        wheelRemainderRef.current = 0
      }, WHEEL_RESET_MS)
    }

    root.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      root.removeEventListener('wheel', handleWheel)
      if (wheelResetRef.current) {
        window.clearTimeout(wheelResetRef.current)
      }
    }
  }, [selectRelative])

  useEffect(() => {
    if (!props.autoPlay) return
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) return

    const interval = window.setInterval(() => {
      selectRelative(1)
    }, AUTO_SWITCH_MS)

    return () => window.clearInterval(interval)
  }, [props.autoPlay, selectRelative])

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      pointerStartXRef.current = event.clientX
    },
    []
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const startX = pointerStartXRef.current
      pointerStartXRef.current = null
      if (startX == null) return

      const diff = event.clientX - startX
      if (Math.abs(diff) < SWIPE_THRESHOLD_PX) return
      selectRelative(diff < 0 ? 1 : -1)
    },
    [selectRelative]
  )

  const stageItems = useMemo(() => {
    const visibleOffsets = isStageOnly
      ? [-3, -2, -1, 0, 1, 2, 3]
      : [-2, -1, 0, 1, 2]

    return visibleOffsets.map((offset) => {
      const step = activeStep + offset
      const index = normalizeModelIndex(step)
      return { index, model: MODELS[index], offset, step }
    })
  }, [activeStep, isStageOnly])

  if (isStageOnly) {
    return (
      <div
        ref={rootRef}
        className={cn('mx-auto w-full max-w-[1180px]', props.className)}
        onPointerDown={handlePointerDown}
        onPointerCancel={() => {
          pointerStartXRef.current = null
        }}
        onPointerUp={handlePointerUp}
      >
        <div className='relative isolate h-[400px] overflow-visible'>
          <div className='relative h-full [perspective:1200px]'>
            {stageItems.map(({ model, offset, index, step }) => (
              <ModelPanel
                key={step}
                model={model}
                active={index === activeIndex}
                offset={offset}
                stageOnly
                onSelect={() => selectModel(index)}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={cn('mx-auto w-full max-w-[780px]', props.className)}
      onPointerDown={handlePointerDown}
      onPointerCancel={() => {
        pointerStartXRef.current = null
      }}
      onPointerUp={handlePointerUp}
    >
      <div className='relative isolate min-h-[520px] overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/56 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:p-6 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_30px_90px_rgba(0,0,0,0.32)]'>
        <div
          aria-hidden
          className={cn(
            'absolute inset-x-10 top-12 -z-10 h-80 rounded-full bg-radial blur-3xl transition-colors duration-700',
            activeTone.glow
          )}
        />
        <div
          aria-hidden
          className='absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.055)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_58%_at_50%_40%,black_18%,transparent_100%)] bg-[size:3rem_3rem] opacity-60 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]'
        />

        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <div className='text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500'>
              Model Router
            </div>
            <div className='mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100'>
              {activeModel.vendor}
            </div>
          </div>
          <div className='flex items-center gap-1.5'>
            <button
              type='button'
              className='flex size-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/72 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1] dark:hover:text-white'
              onClick={() => selectRelative(-1)}
            >
              <ChevronLeft className='size-4' />
              <span className='sr-only'>Previous model</span>
            </button>
            <button
              type='button'
              className='flex size-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/72 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/[0.1] dark:hover:text-white'
              onClick={() => selectRelative(1)}
            >
              <ChevronRight className='size-4' />
              <span className='sr-only'>Next model</span>
            </button>
          </div>
        </div>

        <div className='relative mt-2 h-[340px] [perspective:1200px] sm:h-[365px]'>
          <div
            aria-hidden
            className='absolute top-[76%] left-1/2 h-28 w-[72%] -translate-x-1/2 [transform:rotateX(72deg)] rounded-[50%] border border-slate-300/60 bg-slate-200/18 shadow-[0_24px_60px_rgba(15,23,42,0.13)] dark:border-white/10 dark:bg-white/[0.03]'
          />

          {stageItems.map(({ model, offset, index, step }) => (
            <ModelPanel
              key={step}
              model={model}
              active={index === activeIndex}
              offset={offset}
              onSelect={() => selectModel(index)}
            />
          ))}
        </div>

        <div className='relative z-10 -mt-2 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end'>
          <div>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-2xl font-semibold tracking-tight text-slate-950 dark:text-white'>
                {activeModel.name}
              </h3>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                  activeTone.chip
                )}
              >
                Active
              </span>
            </div>
            <div className='mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400'>
              <span className='rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-white/10 dark:bg-white/[0.045]'>
                {activeModel.context}
              </span>
              <span className='rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-white/10 dark:bg-white/[0.045]'>
                {activeModel.latency}
              </span>
              <span className='rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 dark:border-white/10 dark:bg-white/[0.045]'>
                API ready
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2 sm:justify-end'>
            {MODELS.map((model, index) => (
              <button
                key={model.id}
                type='button'
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  index === activeIndex
                    ? cn('w-8', TONE_CLASSES[model.accent].beam)
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-white/20 dark:hover:bg-white/35'
                )}
                onClick={() => selectModel(index)}
              >
                <span className='sr-only'>{model.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ModelPanel(props: {
  model: HeroModel
  active: boolean
  offset: number
  stageOnly?: boolean
  onSelect: () => void
}) {
  const { model, active, offset } = props
  const absOffset = Math.abs(offset)
  const tone = TONE_CLASSES[model.accent]
  const visibleLimit = props.stageOnly ? 3 : 2
  const isVisible = absOffset <= visibleLimit
  const translateX = offset * (props.stageOnly ? 218 : 132)
  const translateZ = active ? 92 : 18 - absOffset * 48
  const rotateY = offset * -22
  const rotateZ = offset * -2.8
  const scale = active ? 1 : Math.max(0.54, 0.8 - absOffset * 0.07)
  const opacity = active
    ? 1
    : absOffset === 1
      ? 0.72
      : absOffset === 2
        ? 0.34
        : 0.12
  const zIndex = 20 - absOffset
  const blur = props.stageOnly && absOffset === 3 ? 2 : 0

  return (
    <button
      type='button'
      className={cn(
        'absolute left-1/2 touch-pan-y rounded-[1.35rem] border bg-white/72 p-4 text-left shadow-2xl backdrop-blur-xl transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d]',
        props.stageOnly
          ? 'top-6 h-70 w-56 p-5 sm:h-82 sm:w-68'
          : 'top-10 h-56 w-44 sm:h-64 sm:w-52',
        active
          ? cn('border shadow-[0_30px_80px_rgba(15,23,42,0.18)]', tone.ring)
          : 'border-slate-200/70 shadow-[0_20px_54px_rgba(15,23,42,0.1)] dark:border-white/10',
        'dark:bg-slate-950/72',
        (!isVisible || absOffset === 3) && 'pointer-events-none'
      )}
      onClick={props.onSelect}
      style={{
        opacity: isVisible ? opacity : 0,
        zIndex,
        filter: blur ? `blur(${blur}px)` : undefined,
        transform: `translateX(-50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
      }}
    >
      <div
        aria-hidden
        className={cn(
          'absolute inset-x-4 top-4 h-24 rounded-full bg-radial blur-2xl transition-colors duration-500',
          tone.glow
        )}
      />
      <div
        aria-hidden
        className='absolute inset-3 [transform:translateZ(-18px)] rounded-[1rem] border border-white/60 dark:border-white/10'
      />
      <div
        aria-hidden
        className='absolute inset-x-7 bottom-4 h-2 rounded-full bg-slate-950/10 blur-md dark:bg-black/40'
      />

      <div className='relative flex h-full [transform:translateZ(34px)] flex-col justify-between'>
        <div className='flex items-start justify-between gap-3'>
          <div
            className={cn(
              'flex items-center justify-center rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.06]',
              props.stageOnly ? 'size-16 sm:size-18' : 'size-14'
            )}
          >
            {renderModelIcon(model.icon, props.stageOnly ? 42 : 34)}
          </div>
          <div
            className={cn(
              'rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.14em] uppercase',
              tone.chip
            )}
          >
            {model.context}
          </div>
        </div>

        <div>
          <div
            className={cn(
              'mb-3 h-px w-full bg-linear-to-r from-transparent via-current to-transparent opacity-55',
              tone.text
            )}
          />
          <div
            className={cn(
              'leading-tight font-semibold tracking-tight [overflow-wrap:anywhere] text-slate-950 dark:text-white',
              props.stageOnly ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
            )}
          >
            {model.name}
          </div>
          <div className='mt-1 text-xs leading-snug font-medium [overflow-wrap:anywhere] text-slate-500 dark:text-slate-400'>
            {model.vendor}
          </div>
          <div className='mt-5 grid grid-cols-2 gap-2 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase dark:text-slate-500'>
            <div>
              <div className={tone.text}>{model.latency}</div>
              <div className='mt-1'>Latency</div>
            </div>
            <div>
              <div className={tone.text}>99.9%</div>
              <div className='mt-1'>Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
