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
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RotateCcw, ShieldCheck, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/dialog'
import {
  getImageCaptcha,
  verifyImageCaptcha,
  type ImageCaptchaData,
} from '@/features/auth/api'

interface ImageCaptchaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: (token: string) => void
}

type CaptchaPoint = { x: number; y: number }

export function ImageCaptchaDialog({
  open,
  onOpenChange,
  onVerified,
}: ImageCaptchaDialogProps) {
  const { t } = useTranslation()
  const [captcha, setCaptcha] = useState<ImageCaptchaData | null>(null)
  const [points, setPoints] = useState<CaptchaPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const loadCaptcha = useCallback(async () => {
    setLoading(true)
    setCaptcha(null)
    setPoints([])
    try {
      const response = await getImageCaptcha()
      const data = response.data
      if (!response.success || !data) {
        throw new Error(response.message || t('Failed to load CAPTCHA'))
      }
      setCaptcha(data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('Failed to load CAPTCHA')
      )
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (open) void loadCaptcha()
  }, [loadCaptcha, open])

  const handleVerify = async () => {
    if (!captcha || verifying) return
    setVerifying(true)
    try {
      const response = await verifyImageCaptcha(captcha.key, points)
      const token = response.data?.token
      if (!response.success || !token) {
        throw new Error(response.message || t('CAPTCHA verification failed'))
      }
      toast.success(t('Verification successful'))
      onVerified(token)
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('CAPTCHA verification failed')
      )
      await loadCaptcha()
    } finally {
      setVerifying(false)
    }
  }

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!captcha || loading || verifying) return
    if (points.length >= captcha.required_clicks) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.round(
      ((event.clientX - bounds.left) / bounds.width) * captcha.image_width
    )
    const y = Math.round(
      ((event.clientY - bounds.top) / bounds.height) * captcha.image_height
    )
    setPoints((current) => [...current, { x, y }])
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Security verification')}
      contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-[22rem]'
      bodyClassName='space-y-3'
    >
      <div className='flex items-center justify-between border-b pb-2'>
        <span className='text-sm font-medium'>{t('Click order:')}</span>
        {captcha ? (
          <img
            src={captcha.thumb_image}
            alt={t('Icons to click in order')}
            className='h-8 max-w-[10rem] rounded border bg-white object-contain p-0.5 dark:border-white/10 dark:bg-zinc-900'
            draggable={false}
          />
        ) : (
          <Loader2 className='text-muted-foreground size-4 animate-spin' />
        )}
      </div>

      <div className='relative overflow-hidden rounded-xl border bg-slate-100 shadow-inner dark:border-white/10 dark:bg-zinc-950'>
        {captcha ? (
          <div
            className='relative w-full overflow-hidden'
            style={{
              aspectRatio: `${captcha.image_width} / ${captcha.image_height}`,
            }}
          >
            <img
              src={captcha.master_image}
              alt={t('CAPTCHA background')}
              className='absolute inset-0 size-full cursor-crosshair object-fill select-none'
              draggable={false}
              onClick={handleImageClick}
            />
            {points.map((point, index) => (
              <span
                key={`${point.x}-${point.y}-${index}`}
                className='pointer-events-none absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-bold text-white shadow-md'
                style={{
                  left: `${(point.x / captcha.image_width) * 100}%`,
                  top: `${(point.y / captcha.image_height) * 100}%`,
                }}
              >
                {index + 1}
              </span>
            ))}
          </div>
        ) : (
          <div className='flex aspect-[5/3] items-center justify-center'>
            <Loader2 className='text-muted-foreground size-7 animate-spin' />
          </div>
        )}
      </div>

      <div className='flex items-center justify-between pt-0.5'>
        <div className='flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={loading || verifying || points.length === 0}
            onClick={() => setPoints((current) => current.slice(0, -1))}
          >
            <Undo2 className='size-3.5' />
            {t('Undo')}
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={loading || verifying || points.length === 0}
            onClick={() => setPoints([])}
          >
            <RotateCcw className='size-3.5' />
            {t('Reset')}
          </Button>
        </div>

        <Button
          type='button'
          size='sm'
          disabled={
            !captcha ||
            loading ||
            verifying ||
            points.length !== captcha.required_clicks
          }
          onClick={() => void handleVerify()}
        >
          {verifying ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <ShieldCheck className='size-4' />
          )}
          {t('Confirm')}
        </Button>
      </div>
    </Dialog>
  )
}
