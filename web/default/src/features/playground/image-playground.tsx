import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckSquare,
  Clipboard,
  Download,
  ImageIcon,
  Inbox,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { sendImageGeneration, sendImageEdit } from './api'
import type { ImageData, ImageGenerationResponse } from './types'

const qualityOptions = [
  { label: '自动', value: 'auto' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
] as const

const countOptions = [1, 2, 3, 4, 5, 6, 7, 8]
const imageSizeTiers = ['1K', '2K', '4K'] as const
const selectedOptionClassName =
  'border-gray-400 bg-zinc-100 text-zinc-950 shadow-[0_8px_24px_rgba(63,63,70,0.16)] dark:border-gray-500 dark:bg-zinc-800/70 dark:text-zinc-50 dark:shadow-[0_8px_24px_rgba(24,24,27,0.36)]'

const ratios = [
  { label: '1:1', size: '1024x1024', shape: 'aspect-square w-4' },
  { label: '3:2', size: '1536x1024', shape: 'aspect-[3/2] w-5' },
  { label: '2:3', size: '1024x1536', shape: 'aspect-[2/3] w-3' },
  { label: '4:3', size: '1536x1152', shape: 'aspect-[4/3] w-5' },
  { label: '3:4', size: '1152x1536', shape: 'aspect-[3/4] w-3.5' },
  { label: '16:9', size: '1536x864', shape: 'aspect-video w-5' },
  { label: '9:16', size: '864x1536', shape: 'aspect-[9/16] w-2.5' },
  { label: '1:1(2k)', size: '2048x2048', shape: 'aspect-square w-4' },
  { label: '16:9(2k)', size: '2048x1152', shape: 'aspect-video w-5' },
  { label: '9:16(2k)', size: '1152x2048', shape: 'aspect-[9/16] w-2.5' },
  { label: '16:9(4k)', size: '3840x2160', shape: 'aspect-video w-5' },
  { label: '9:16(4k)', size: '2160x3840', shape: 'aspect-[9/16] w-2.5' },
  { label: 'auto', size: 'auto', shape: 'aspect-square w-4' },
]

type GeneratedImage = ImageData & {
  id: string
  src: string
  aspectRatio?: string
}

type GenerationRecord = {
  id: string
  prompt: string
  model: string
  count: number
  createdAt: number
  ratio: string
  size: string
  images: GeneratedImage[]
}

type ImageModelPricingItem = {
  name?: string
  model?: string
  models?: string[]
  base_price?: number
  size_ratios?: Record<string, number>
}

type ImageModelOption = {
  name: string
  model: string
  models: string[]
  base_price: number
  size_ratios: Record<string, number>
}

const lastImageResultStorageKey = 'playground:last-image-result'
const imageRecordsStorageKey = 'playground:image-records'
const fallbackImageModelOptions: ImageModelOption[] = [
  {
    name: 'gpt-image-2',
    model: 'gpt-image-2',
    models: ['gpt-image-2'],
    base_price: 0,
    size_ratios: { '1K': 1, '2K': 2, '4K': 4 },
  },
  {
    name: 'gpt-image-1',
    model: 'gpt-image-1',
    models: ['gpt-image-1'],
    base_price: 0,
    size_ratios: { '1K': 1, '2K': 2, '4K': 4 },
  },
  {
    name: 'gemini-image-preview',
    model: 'gemini-image-preview',
    models: ['gemini-image-preview'],
    base_price: 0,
    size_ratios: { '1K': 1, '2K': 2, '4K': 4 },
  },
]

type ImageResponseLike = {
  data?: ImageData[] | { data?: ImageData[] }
  error?: {
    message?: string
  }
}

function imageDataToSrc(item: ImageData): string {
  if (item.url) return item.url
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`
  return ''
}

async function downloadGeneratedImage(
  image: GeneratedImage,
  index: number,
  onProgress?: (progress: number) => void
) {
  const filename = `image-${index + 1}.png`
  const response = await api.get('/pg/images/download', {
    params: { url: image.src },
    responseType: 'blob',
    skipErrorHandler: true,
    onDownloadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        )
        onProgress?.(progress)
      }
    },
  })
  const blob = response.data
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}

function sizeToAspectRatio(size: string): string | undefined {
  if (size === 'auto') return undefined
  const [width, height] = size.split('x').map(Number)
  if (!width || !height) return undefined
  return `${width} / ${height}`
}

function parseAspectRatio(aspectRatio?: string): number {
  if (!aspectRatio) return 1
  const [width, height] = aspectRatio.split('/').map((value) => Number(value))
  if (!width || !height) return 1
  return width / height
}

function normalizeGenerationCount(count: number): number {
  if (!Number.isFinite(count)) return countOptions[0]
  const normalized = Math.trunc(count)
  return countOptions.includes(normalized) ? normalized : countOptions[0]
}

function getGalleryItemStyle({
  count,
  aspectRatio,
  stageHeight,
  stageWidth,
}: {
  count: number
  aspectRatio: string
  stageHeight: number
  stageWidth: number
}): React.CSSProperties | undefined {
  if (!count || !stageHeight || !stageWidth) return undefined

  const gap = 12
  const padding = 16
  const availableWidth = Math.max(stageWidth - padding, 280)
  const availableHeight = Math.max(stageHeight - padding, 280)
  const ratio = parseAspectRatio(aspectRatio)
  const maxColumns = Math.min(count, 4)

  let best = {
    width: 0,
    height: 0,
    area: 0,
  }

  for (let columns = 1; columns <= maxColumns; columns += 1) {
    const rows = Math.ceil(count / columns)
    const cellWidth = (availableWidth - gap * (columns - 1)) / columns
    const cellHeight = (availableHeight - gap * (rows - 1)) / rows
    const fittedByWidth = {
      width: cellWidth,
      height: cellWidth / ratio,
    }
    const fitted =
      fittedByWidth.height <= cellHeight
        ? fittedByWidth
        : {
            width: cellHeight * ratio,
            height: cellHeight,
          }
    const area = fitted.width * fitted.height

    if (area > best.area) {
      best = {
        ...fitted,
        area,
      }
    }
  }

  return {
    height: `${Math.floor(best.height)}px`,
    width: `${Math.floor(best.width)}px`,
  }
}

function extractImageData(response: ImageResponseLike): ImageData[] {
  if (Array.isArray(response.data)) return response.data
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data
  }
  return []
}

function normalizeImageModelOptions(items: ImageModelPricingItem[]) {
  return items
    .map((item) => {
      const name = item.name || item.model || item.models?.[0] || ''
      const models = Array.from(
        new Set([item.model || '', ...(item.models || [])].filter(Boolean))
      )
      const sizeRatios = item.size_ratios || {}
      return {
        name,
        model: item.model || models[0] || name,
        models: models.length ? models : [name],
        base_price: Number(item.base_price) || 0,
        size_ratios: {
          '1K': Number(sizeRatios['1K']) || 1,
          '2K': Number(sizeRatios['2K']) || 2,
          '4K': Number(sizeRatios['4K']) || 4,
        },
      }
    })
    .filter((item) => item.name)
}

function getImageTierPrices(model: ImageModelOption) {
  return imageSizeTiers.map((tier) => ({
    tier,
    price: (model.base_price * (model.size_ratios[tier] || 1)).toFixed(2),
  }))
}

function parseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const maybe = error as {
      response?: { data?: { error?: { message?: string }; message?: string } }
      message?: string
    }
    return (
      maybe.response?.data?.error?.message ||
      maybe.response?.data?.message ||
      maybe.message ||
      '图像生成失败'
    )
  }
  return '图像生成失败'
}

export function ImagePlayground() {
  const [prompt, setPrompt] = useState('')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('gpt-image-2')
  const [selectedQuality, setSelectedQuality] = useState('high')
  const [selectedRatio, setSelectedRatio] = useState('16:9(4k)')
  const [selectedCount, setSelectedCount] = useState(1)
  const selectedCountRef = useRef(selectedCount)
  const [imageModelOptions, setImageModelOptions] = useState<
    ImageModelOption[]
  >(fallbackImageModelOptions)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [records, setRecords] = useState<GenerationRecord[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const resultStageRef = useRef<HTMLDivElement>(null)
  const [resultStageSize, setResultStageSize] = useState({
    height: 0,
    width: 0,
  })

  const selectedRatioConfig = useMemo(
    () => ratios.find((ratio) => ratio.label === selectedRatio) || ratios[0],
    [selectedRatio]
  )
  const resultAspectRatio = sizeToAspectRatio(selectedRatioConfig.size)
  const displayAspectRatio =
    images[0]?.aspectRatio || resultAspectRatio || '1 / 1'
  const selectedImageModel =
    imageModelOptions.find(
      (item) => item.model === selectedModel || item.name === selectedModel
    ) ||
    imageModelOptions[0] ||
    fallbackImageModelOptions[0]
  const selectedImageTierPrices = getImageTierPrices(selectedImageModel)
  const galleryItemStyle = getGalleryItemStyle({
    count: images.length,
    aspectRatio: displayAspectRatio,
    stageHeight: resultStageSize.height,
    stageWidth: resultStageSize.width,
  })
  const selectGenerationCount = (count: number) => {
    const nextCount = normalizeGenerationCount(count)
    selectedCountRef.current = nextCount
    setSelectedCount(nextCount)
  }

  const handleReferenceImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string

      // 压缩图片到合理尺寸
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxSize = 1024 // 最大边长

        // 等比例缩放
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        // 转为 base64，质量 0.8
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)
        setReferenceImage(compressedBase64)
        toast.success('参考图上传成功')
      }
      img.src = result
    }
    reader.onerror = () => {
      toast.error('读取图片失败')
    }
    reader.readAsDataURL(file)
  }

  const handlePasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], 'clipboard-image.png', {
            type: imageType,
          })
          handleReferenceImageUpload(file)
          return
        }
      }
      toast.error('剪贴板中没有图片')
    } catch (error) {
      toast.error('读取剪贴板失败')
    }
  }

  useEffect(() => {
    const element = resultStageRef.current
    if (!element) return

    const updateSize = () => {
      setResultStageSize({
        height: element.clientHeight,
        width: element.clientWidth,
      })
    }

    updateSize()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(updateSize)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const loadImageModelOptions = async () => {
      try {
        const response = await api.get('/pg/images/models', {
          skipErrorHandler: true,
        })
        const items = response.data?.data?.models
        if (!Array.isArray(items)) return

        const nextOptions = normalizeImageModelOptions(items)
        if (nextOptions.length === 0) return

        setImageModelOptions(nextOptions)
        setSelectedModel((current) =>
          nextOptions.some(
            (item) => item.model === current || item.name === current
          )
            ? current
            : nextOptions[0].model
        )
      } catch {
        setImageModelOptions(fallbackImageModelOptions)
      }
    }

    void loadImageModelOptions()
  }, [])

  useEffect(() => {
    try {
      // 加载所有历史记录
      const recordsRaw = window.localStorage.getItem(imageRecordsStorageKey)
      console.log(
        '[ImagePlayground] 加载记录:',
        recordsRaw ? `找到 ${recordsRaw.length} 字节数据` : '无数据'
      )
      if (recordsRaw) {
        const savedRecords = JSON.parse(recordsRaw) as GenerationRecord[]
        console.log('[ImagePlayground] 解析记录:', {
          记录数: savedRecords.length,
          记录列表: savedRecords.map((r) => ({
            id: r.id,
            prompt: r.prompt.slice(0, 30),
          })),
        })
        if (Array.isArray(savedRecords) && savedRecords.length > 0) {
          setRecords(savedRecords)
          // 显示最新的一条记录
          const latest = savedRecords[0]
          if (latest?.images?.length) {
            setImages(latest.images)
            selectGenerationCount(latest.count || latest.images.length)
          }
          return
        }
      }

      // 兼容旧的 sessionStorage 数据
      const raw = window.sessionStorage.getItem(lastImageResultStorageKey)
      if (!raw) return
      console.log('[ImagePlayground] 迁移旧数据')
      const saved = JSON.parse(raw) as GenerationRecord
      if (saved?.images?.length) {
        setImages(saved.images)
        selectGenerationCount(saved.count || saved.images.length)
        setRecords([saved])
        // 迁移到新的存储
        window.localStorage.setItem(
          imageRecordsStorageKey,
          JSON.stringify([saved])
        )
        window.sessionStorage.removeItem(lastImageResultStorageKey)
      }
    } catch (error) {
      console.error('[ImagePlayground] 加载记录失败:', error)
      window.sessionStorage.removeItem(lastImageResultStorageKey)
      window.localStorage.removeItem(imageRecordsStorageKey)
    }
  }, [])

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) {
      toast.error('请输入描述词')
      return
    }

    setIsGenerating(true)
    setErrorMessage('')
    setImages([])
    const requestedCount = normalizeGenerationCount(selectedCountRef.current)

    try {
      let response: ImageGenerationResponse

      // 根据是否有参考图选择不同的API
      if (referenceImage) {
        // 有参考图：使用图生图接口 (/v1/images/edits)
        // 将 base64 转换为 Blob
        const base64Data = referenceImage.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const imageBlob = new Blob([byteArray], { type: 'image/jpeg' })

        const modelName = selectedImageModel.model || selectedImageModel.name
        console.log('[ImagePlayground] Sending image edit:', {
          model: modelName,
          selectedImageModel,
          blobSize: imageBlob.size,
        })

        response = await sendImageEdit({
          image: imageBlob,
          prompt: trimmedPrompt,
          model: modelName,
          n: requestedCount,
          size: selectedRatioConfig.size,
          quality: selectedQuality,
        })
      } else {
        // 无参考图：使用文生图接口 (/v1/images/generations)
        response = await sendImageGeneration({
          model: selectedImageModel.model || selectedImageModel.name,
          prompt: trimmedPrompt,
          n: requestedCount,
          quality: selectedQuality,
          size: selectedRatioConfig.size,
          response_format: 'url',
        })
      }

      if (response.error?.message) {
        throw new Error(response.error.message)
      }

      // 调试：查看响应数据结构
      console.log('[ImagePlayground] API Response:', response)
      console.log('[ImagePlayground] Response data:', response.data)

      const nextImages = extractImageData(response)
        .slice(0, requestedCount)
        .map((item, index) => ({
          ...item,
          id: `${Date.now()}-${index}`,
          src: imageDataToSrc(item),
          aspectRatio: resultAspectRatio,
        }))
        .filter((item) => item.src)

      if (nextImages.length === 0) {
        throw new Error('后端没有返回可显示的图片')
      }

      const record = {
        id: `${Date.now()}`,
        prompt: trimmedPrompt,
        model: selectedImageModel.model || selectedImageModel.name,
        count: nextImages.length,
        createdAt: Date.now(),
        ratio: selectedRatio,
        size: selectedRatioConfig.size,
        images: nextImages,
      }

      setImages(nextImages)
      setRecords((current) => {
        // 保留多条记录，最多 50 条
        const updated = [record, ...current]
        const toSave = updated.slice(0, 50)
        // 持久化到 localStorage
        window.localStorage.setItem(
          imageRecordsStorageKey,
          JSON.stringify(toSave)
        )
        console.log('[ImagePlayground] 保存记录:', {
          新记录ID: record.id,
          当前记录数: current.length,
          更新后记录数: updated.length,
          保存记录数: toSave.length,
        })
        return updated
      })
      // 兼容旧逻辑，保留 sessionStorage
      window.sessionStorage.setItem(
        lastImageResultStorageKey,
        JSON.stringify(record)
      )
      toast.success('图像生成完成')
    } catch (error) {
      const message = parseErrorMessage(error)
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className='bg-background flex size-full min-w-0 gap-2 overflow-hidden p-2 pl-0 text-sm'>
      <aside className='border-sidebar-border bg-background hidden h-full w-[280px] shrink-0 flex-col overflow-hidden rounded-lg border shadow-sm lg:flex'>
        <div className='flex h-14 shrink-0 items-center justify-between border-b px-4'>
          <h2 className='font-semibold'>生成记录</h2>
          <span className='text-muted-foreground text-xs'>
            {records.length}
          </span>
        </div>
        <div className='flex shrink-0 gap-2 px-4 py-3'>
          <Button
            size='xs'
            variant='outline'
            onClick={() => {
              setPrompt('')
              setImages([])
              setErrorMessage('')
            }}
          >
            <Plus className='size-3.5' />
            新建
          </Button>
          <Button size='xs' variant='outline' disabled>
            <CheckSquare className='size-3.5' />
            全选
          </Button>
          <Button
            size='xs'
            variant='outline'
            onClick={() => {
              setRecords([])
              window.localStorage.removeItem(imageRecordsStorageKey)
              window.sessionStorage.removeItem(lastImageResultStorageKey)
            }}
            disabled={records.length === 0}
          >
            <Trash2 className='size-3.5' />
            删除
          </Button>
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4'>
          {records.length === 0 ? (
            <div className='border-border/70 text-muted-foreground flex h-40 items-center justify-center rounded-lg border border-dashed text-xs'>
              暂无生成记录
            </div>
          ) : (
            <div className='space-y-2'>
              {records.map((record) => (
                <button
                  key={record.id}
                  type='button'
                  className='bg-muted/10 hover:bg-muted/30 w-full rounded-lg border p-3 text-left text-xs transition-colors'
                  onClick={() => {
                    setPrompt(record.prompt)
                    if (record.ratio) {
                      setSelectedRatio(record.ratio)
                    }
                    selectGenerationCount(record.count || record.images.length)
                    setImages(record.images)
                    setErrorMessage('')
                  }}
                >
                  <div
                    className='overflow-y-auto font-medium'
                    style={{ height: '3.6em', lineHeight: '1.2em' }}
                  >
                    {record.prompt}
                  </div>
                  <div className='text-muted-foreground mt-2 flex justify-between gap-2'>
                    <span>{record.model}</span>
                    <span>{record.count}张</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className='border-sidebar-border bg-background flex h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-lg border shadow-sm'>
        <div className='min-h-0 flex-1 space-y-6 overflow-y-auto p-4'>
          <FieldGroup label='描述词'>
            <Textarea
              className='bg-muted/20 h-40 resize-none overflow-y-auto rounded-xl'
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder='描述画面主体、风格、构图、光线和用途'
            />
          </FieldGroup>

          <FieldGroup
            label='参考图'
            action={
              <div className='flex gap-2'>
                <Button
                  size='xs'
                  variant='outline'
                  onClick={handlePasteFromClipboard}
                >
                  <Clipboard className='size-3.5' />
                  剪切板
                </Button>
                <Button
                  size='xs'
                  variant='outline'
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleReferenceImageUpload(file)
                    }
                    input.click()
                  }}
                >
                  <Upload className='size-3.5' />
                  上传
                </Button>
              </div>
            }
          >
            {referenceImage ? (
              <div className='relative h-32 overflow-hidden rounded-lg border'>
                <img
                  src={referenceImage}
                  alt='参考图'
                  className='size-full object-cover'
                />
                <button
                  type='button'
                  onClick={() => setReferenceImage(null)}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-lg text-xs'
                >
                  <Trash2 className='size-3.5' />
                </button>
              </div>
            ) : (
              <div className='border-border/70 text-muted-foreground bg-muted/10 flex h-20 items-center justify-center rounded-lg border border-dashed text-xs'>
                暂无参考图
              </div>
            )}
          </FieldGroup>

          <FieldGroup label='模型'>
            <Select
              value={selectedModel}
              onValueChange={(value) => {
                if (value) setSelectedModel(value)
              }}
            >
              <SelectTrigger className='h-9 w-full'>
                <SelectValue placeholder='选择模型' />
              </SelectTrigger>
              <SelectContent>
                {imageModelOptions.map((item) => (
                  <SelectItem key={item.name} value={item.model || item.name}>
                    <span className='font-medium'>
                      {item.model || item.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label='质量'>
            <div className='grid grid-cols-4 gap-2'>
              {qualityOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  active={selectedQuality === option.value}
                  onClick={() => setSelectedQuality(option.value)}
                >
                  {option.label}
                </OptionButton>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup
            label='尺寸'
            action={
              <label className='flex items-center gap-2 text-xs font-medium'>
                16倍数对齐
                <span className='bg-primary relative h-4 w-7 rounded-full'>
                  <span className='bg-primary-foreground absolute top-0.5 right-0.5 size-3 rounded-full' />
                </span>
              </label>
            }
          >
            <div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
              <Input
                value={
                  selectedRatioConfig.size === 'auto'
                    ? 'auto'
                    : selectedRatioConfig.size.split('x')[0]
                }
                readOnly
              />
              <span className='text-muted-foreground text-xs'>?</span>
              <Input
                value={
                  selectedRatioConfig.size === 'auto'
                    ? 'auto'
                    : selectedRatioConfig.size.split('x')[1]
                }
                readOnly
              />
            </div>
          </FieldGroup>

          <FieldGroup label='宽高比'>
            <div className='grid grid-cols-4 gap-2'>
              {ratios.map((ratio) => (
                <button
                  key={ratio.label}
                  type='button'
                  onClick={() => setSelectedRatio(ratio.label)}
                  className={cn(
                    'bg-muted/20 hover:bg-muted/50 flex h-14 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-semibold transition-all',
                    selectedRatio === ratio.label
                      ? selectedOptionClassName
                      : 'text-muted-foreground border-transparent'
                  )}
                >
                  <span className={cn('rounded-[2px] border-2', ratio.shape)} />
                  {ratio.label}
                </button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label='生成张数'>
            <div className='grid grid-cols-4 gap-2'>
              {countOptions.map((option) => (
                <OptionButton
                  key={option}
                  active={selectedCount === option}
                  onClick={() => selectGenerationCount(option)}
                >
                  {option}张
                </OptionButton>
              ))}
            </div>
          </FieldGroup>
        </div>

        <div className='border-t p-4'>
          <Button
            className='w-full'
            size='lg'
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Sparkles className='size-4' />
            )}
            {isGenerating ? '生成中...' : '开始生成'}
          </Button>
        </div>
      </section>

      <section className='border-sidebar-border bg-background flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm'>
        <div className='flex h-14 shrink-0 items-center gap-3 border-b px-4'>
          <h2 className='font-semibold'>生成结果</h2>
          <div className='text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs'>
            {selectedImageTierPrices.map((item) => (
              <span
                key={item.tier}
                className='bg-muted/50 rounded-full px-2 py-0.5 tabular-nums'
              >
                {item.tier}: {item.price}/张
              </span>
            ))}
          </div>
        </div>
        <div className='min-h-0 flex-1 p-4'>
          <div
            ref={resultStageRef}
            className='border-border/70 bg-muted/10 flex size-full min-h-[420px] items-center justify-center rounded-xl border border-dashed'
          >
            {isGenerating ? (
              <div className='text-muted-foreground flex flex-col items-center gap-3 text-sm'>
                <Loader2 className='size-9 animate-spin' />
                <span>正在生成真实图片...</span>
              </div>
            ) : images.length > 0 ? (
              <div className='flex size-full flex-wrap content-center items-center justify-center gap-3 p-2'>
                {images.map((image, index) => (
                  <GeneratedImageFigure
                    key={image.id}
                    image={image}
                    index={index}
                    aspectRatio={
                      image.aspectRatio ||
                      sizeToAspectRatio(selectedRatioConfig.size) ||
                      '1 / 1'
                    }
                    style={galleryItemStyle}
                  />
                ))}
              </div>
            ) : errorMessage ? (
              <div className='text-destructive flex max-w-md flex-col items-center gap-3 text-center text-sm'>
                <Inbox className='size-9 opacity-70' />
                <span>{errorMessage}</span>
              </div>
            ) : (
              <div className='text-muted-foreground flex flex-col items-center gap-4 text-sm'>
                <ImageIcon className='size-10' />
                <Inbox className='size-9 opacity-40' />
                <span>还没有生成图片</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function GeneratedImageFigure({
  image,
  index,
  aspectRatio,
  className,
  style,
}: {
  image: GeneratedImage
  index: number
  aspectRatio: string
  className?: string
  style?: React.CSSProperties
}) {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)

  return (
    <figure
      className={cn(
        'group bg-background relative overflow-hidden rounded-xl border shadow-sm',
        className
      )}
      style={style}
    >
      <div
        className='bg-muted/40 relative size-full overflow-hidden'
        style={{ aspectRatio }}
      >
        <img
          src={image.src}
          alt={image.revised_prompt || `generated image ${index + 1}`}
          className='size-full object-cover'
        />
        <button
          type='button'
          onClick={async () => {
            try {
              setDownloadProgress(0)
              await downloadGeneratedImage(image, index, (progress) => {
                setDownloadProgress(progress)
              })
              setDownloadProgress(null)
              toast.success('下载完成')
            } catch (error) {
              setDownloadProgress(null)
              toast.error(parseErrorMessage(error))
            }
          }}
          disabled={downloadProgress !== null}
          className='bg-secondary text-secondary-foreground hover:bg-secondary/80 absolute right-2 bottom-2 inline-flex size-8 items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50'
        >
          {downloadProgress !== null ? (
            <div className='relative flex size-4 items-center justify-center'>
              <svg className='size-full -rotate-90' viewBox='0 0 16 16'>
                <circle
                  cx='8'
                  cy='8'
                  r='6'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  opacity='0.3'
                />
                <circle
                  cx='8'
                  cy='8'
                  r='6'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeDasharray={`${2 * Math.PI * 6}`}
                  strokeDashoffset={`${2 * Math.PI * 6 * (1 - downloadProgress / 100)}`}
                  strokeLinecap='round'
                  className='transition-all duration-300'
                />
              </svg>
              <span className='absolute text-[8px] font-bold'>
                {downloadProgress}
              </span>
            </div>
          ) : (
            <Download className='size-4' />
          )}
        </button>
      </div>
      {image.revised_prompt ? (
        <figcaption className='bg-background/95 text-muted-foreground absolute inset-x-0 bottom-0 line-clamp-2 border-t p-3 text-xs opacity-0 transition-opacity group-hover:opacity-100'>
          {image.revised_prompt}
        </figcaption>
      ) : null}
    </figure>
  )
}

function FieldGroup({
  label,
  action,
  children,
}: {
  label: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className='space-y-2'>
      <div className='flex min-h-7 items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold'>{label}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'bg-muted/20 hover:bg-muted/50 h-9 rounded-full border px-3 text-xs font-semibold transition-all',
        active
          ? selectedOptionClassName
          : 'text-muted-foreground border-transparent'
      )}
    >
      {children}
    </button>
  )
}
