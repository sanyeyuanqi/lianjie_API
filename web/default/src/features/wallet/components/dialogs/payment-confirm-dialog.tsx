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
import { ExternalLink, Loader2, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_DISCOUNT_RATE } from '../../constants'
import { formatCurrency, getPaymentIcon } from '../../lib'
import type { PaymentCheckoutResult, PaymentMethod } from '../../types'

interface PaymentConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  topupAmount: number
  paymentAmount: number
  paymentMethod: PaymentMethod | undefined
  calculating: boolean
  processing: boolean
  discountRate?: number
  usdExchangeRate?: number
  checkout?: PaymentCheckoutResult | null
}

export function PaymentConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  topupAmount,
  paymentAmount,
  paymentMethod,
  calculating,
  processing,
  discountRate = DEFAULT_DISCOUNT_RATE,
  usdExchangeRate = 1,
  checkout,
}: PaymentConfirmDialogProps) {
  const { t } = useTranslation()
  const hasDiscount = discountRate > 0 && discountRate < 1 && paymentAmount > 0
  const originalAmount = hasDiscount ? paymentAmount / discountRate : 0
  const discountAmount = hasDiscount ? originalAmount - paymentAmount : 0
  const showQrCode = checkout?.type === 'qr' && checkout.qrValue
  const rmbPaymentAmount = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paymentAmount)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          'max-sm:w-[calc(100vw-1.5rem)]',
          showQrCode
            ? 'max-w-[21rem] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-[21.5rem]'
            : 'sm:max-w-md'
        )}
      >
        {showQrCode && (
          <AlertDialogCancel className='text-muted-foreground hover:bg-muted hover:text-foreground absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full border-0 bg-transparent p-0 shadow-none'>
            <X className='size-4' />
            <span className='sr-only'>{t('Close')}</span>
          </AlertDialogCancel>
        )}

        <AlertDialogHeader
          className={cn(
            showQrCode && 'px-6 pt-7 pb-3 text-left sm:place-items-start'
          )}
        >
          <AlertDialogTitle
            className={cn(
              'font-semibold',
              showQrCode ? 'text-xl tracking-tight' : 'text-xl'
            )}
          >
            {showQrCode ? t('Scan QR code to pay') : t('Confirm Payment')}
          </AlertDialogTitle>
          <AlertDialogDescription
            className={cn(showQrCode && 'text-muted-foreground text-xs')}
          >
            {showQrCode
              ? t('Use your payment app to scan and complete the payment')
              : t('Review your payment details')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showQrCode ? (
          <div className='px-4 pb-5'>
            <div className='to-muted/20 dark:from-background dark:to-muted/20 rounded-2xl border bg-gradient-to-b from-white p-4 shadow-inner'>
              <div className='mx-auto flex size-[13.5rem] items-center justify-center rounded-2xl bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5'>
                <QRCodeSVG value={checkout.qrValue!} size={190} />
              </div>
            </div>

            <div className='bg-muted/20 mt-4 rounded-xl border px-4 py-3'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {t('Topup Amount')}
                </span>
                <span className='font-medium'>{rmbPaymentAmount}</span>
              </div>
              <div className='mt-3 flex items-center justify-between border-t pt-3 text-sm'>
                <span className='text-muted-foreground'>
                  {t('Payment Method')}
                </span>
                <div className='flex items-center gap-1.5 font-medium'>
                  {getPaymentIcon(
                    paymentMethod?.type,
                    'h-4 w-4',
                    paymentMethod?.icon,
                    paymentMethod?.name
                  )}
                  <span>{paymentMethod?.name}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='space-y-3 py-3 sm:space-y-4 sm:py-4'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>
                {t('Topup Amount')}
              </span>
              <div className='flex items-baseline gap-2'>
                <span className='text-2xl font-semibold'>
                  {formatCurrency(topupAmount * usdExchangeRate)}$
                </span>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>
                {t('You Pay')}
              </span>
              {calculating ? (
                <Skeleton className='h-6 w-24' />
              ) : (
                <div className='flex items-baseline gap-2'>
                  <span className='text-2xl font-semibold'>
                    {formatCurrency(paymentAmount)}
                  </span>
                  {hasDiscount && (
                    <span className='text-muted-foreground text-sm line-through'>
                      {formatCurrency(originalAmount)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {hasDiscount && !calculating && (
              <div className='bg-muted/50 rounded-lg p-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-muted-foreground'>{t('You save')}</span>
                  <span className='font-semibold text-green-600'>
                    {formatCurrency(discountAmount)}
                  </span>
                </div>
              </div>
            )}

            <div className='border-t pt-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>
                  {t('Payment Method')}
                </span>
                <div className='flex items-center gap-2'>
                  {getPaymentIcon(
                    paymentMethod?.type,
                    'h-4 w-4',
                    paymentMethod?.icon,
                    paymentMethod?.name
                  )}
                  <span className='font-medium'>{paymentMethod?.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showQrCode ? (
          <AlertDialogFooter className='bg-background/95 mx-0 mb-0 rounded-none border-t px-4 pt-4 pb-5'>
            <AlertDialogAction
              className='h-10 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
              render={
                <a
                  href={checkout.url}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ExternalLink className='mr-2 h-4 w-4' />
                  {t('Open payment page')}
                </a>
              }
            />
          </AlertDialogFooter>
        ) : (
          <AlertDialogFooter className='grid grid-cols-2 gap-2 sm:flex'>
            <AlertDialogCancel disabled={processing}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} disabled={processing}>
              {processing && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {t('Confirm Payment')}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
