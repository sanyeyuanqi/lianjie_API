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
import type { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useCountdown } from '@/hooks/use-countdown'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ImageCaptchaDialog } from '@/components/image-captcha-dialog'
import { Turnstile } from '@/components/turnstile'
import { sendPasswordResetEmail } from '@/features/auth/api'
import {
  forgotPasswordFormSchema,
  PASSWORD_RESET_COUNTDOWN,
} from '@/features/auth/constants'
import { useTurnstile } from '@/features/auth/hooks/use-turnstile'
import {
  getStatusValue,
  isImageCaptchaEnabled,
} from '@/features/auth/lib/status'

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isImageCaptchaOpen, setIsImageCaptchaOpen] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const { status } = useStatus()
  const configuredCountdown = Number(
    getStatusValue(
      status,
      'password_reset_countdown_seconds',
      PASSWORD_RESET_COUNTDOWN
    )
  )
  const passwordResetCountdown =
    Number.isInteger(configuredCountdown) &&
    configuredCountdown >= 1 &&
    configuredCountdown <= 86400
      ? configuredCountdown
      : PASSWORD_RESET_COUNTDOWN

  const {
    isTurnstileEnabled,
    turnstileSiteKey,
    turnstileToken,
    setTurnstileToken,
    validateTurnstile,
  } = useTurnstile()
  const {
    secondsLeft,
    isActive,
    start: startCountdown,
  } = useCountdown({ initialSeconds: passwordResetCountdown })

  const form = useForm<z.infer<typeof forgotPasswordFormSchema>>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  })
  const turnstileReady = !isTurnstileEnabled || Boolean(turnstileToken)
  const imageCaptchaEnabled = isImageCaptchaEnabled(status)
  const labelClass =
    'text-[13px] font-medium text-slate-800 dark:text-slate-200'
  const inputClass =
    'h-10 rounded-lg border-slate-200 bg-white text-sm shadow-none focus-visible:ring-2 focus-visible:ring-slate-900/10 dark:border-white/15 dark:bg-zinc-950/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-white/15'
  const primaryButtonClass =
    'mt-2 h-10 w-full justify-center gap-2 rounded-lg bg-slate-950 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 dark:border dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800'

  async function sendResetEmail(email: string, captchaToken = '') {
    setIsLoading(true)
    try {
      const res = await sendPasswordResetEmail(
        email,
        turnstileToken,
        captchaToken
      )
      if (res?.success) {
        form.reset()
        startCountdown()
        toast.success(t('Reset email sent, please check your inbox'))
      } else {
        const message = res?.message || t('Failed to send reset email')
        toast.error(message)
      }
    } catch (_error) {
      // Errors are handled by global interceptor
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data: z.infer<typeof forgotPasswordFormSchema>) {
    if (!validateTurnstile()) return

    if (imageCaptchaEnabled) {
      setPendingEmail(data.email)
      setIsImageCaptchaOpen(true)
      return
    }

    await sendResetEmail(data.email)
  }

  const handleImageCaptchaVerified = (token: string) => {
    const email = pendingEmail
    setPendingEmail('')
    if (email) void sendResetEmail(email, token)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder='name@example.com'
                  className={inputClass}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type='submit'
          className={primaryButtonClass}
          disabled={isLoading || isActive || !turnstileReady}
        >
          {isActive
            ? t('Resend ({{seconds}}s)', { seconds: secondsLeft })
            : t('Send reset email')}
          {isLoading ? <Loader2 className='animate-spin' /> : <ArrowRight />}
        </Button>

        {isTurnstileEnabled && (
          <div className='mt-2'>
            <Turnstile
              siteKey={turnstileSiteKey}
              onVerify={setTurnstileToken}
            />
          </div>
        )}
      </form>

      <ImageCaptchaDialog
        open={isImageCaptchaOpen}
        showSuccessToast={false}
        onOpenChange={(open) => {
          setIsImageCaptchaOpen(open)
          if (!open) setPendingEmail('')
        }}
        onVerified={handleImageCaptchaVerified}
      />
    </Form>
  )
}
