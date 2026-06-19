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
import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Receipt,
  WalletCards,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Dialog } from '@/components/dialog'
import { PaymentSuccessAnimation } from '@/components/payment-success-animation'
import { getUserBillingHistory } from '../api'
import {
  formatCurrency,
  getDiscountLabel,
  getPaymentIcon,
  getMinTopupAmount,
  calculatePresetPricing,
} from '../lib'
import type {
  PaymentMethod,
  PaymentCheckoutResult,
  PresetAmount,
  TopupInfo,
  CreemProduct,
  WaffoPayMethod,
} from '../types'
import { CreemProductsSection } from './creem-products-section'

interface RechargeFormCardProps {
  topupInfo: TopupInfo | null
  presetAmounts: PresetAmount[]
  selectedPreset: number | null
  onSelectPreset: (preset: PresetAmount) => void
  topupAmount: number
  onTopupAmountChange: (amount: number) => void
  paymentAmount: number
  calculating: boolean
  selectedPaymentMethod?: PaymentMethod
  onPaymentMethodSelect: (method: PaymentMethod) => void | Promise<void>
  onPaymentConfirm?: () => void
  confirmProcessing?: boolean
  paymentCheckout?: PaymentCheckoutResult | null
  paymentLoading: string | null
  redemptionCode: string
  onRedemptionCodeChange: (code: string) => void
  onRedeem: () => void
  redeeming: boolean
  topupLink?: string
  loading?: boolean
  priceRatio?: number
  usdExchangeRate?: number
  onOpenBilling?: () => void
  creemProducts?: CreemProduct[]
  enableCreemTopup?: boolean
  onCreemProductSelect?: (product: CreemProduct) => void
  enableWaffoTopup?: boolean
  waffoPayMethods?: WaffoPayMethod[]
  waffoMinTopup?: number
  onWaffoMethodSelect?: (method: WaffoPayMethod, index: number) => void
  enableWaffoPancakeTopup?: boolean
  onPaymentSuccess?: () => void | Promise<void>
}

export function RechargeFormCard({
  topupInfo,
  presetAmounts,
  selectedPreset,
  onSelectPreset,
  topupAmount,
  onTopupAmountChange,
  paymentAmount,
  calculating,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  onPaymentConfirm,
  confirmProcessing,
  paymentCheckout,
  paymentLoading,
  redemptionCode,
  onRedemptionCodeChange,
  onRedeem,
  redeeming,
  topupLink,
  loading,
  priceRatio = 1,
  usdExchangeRate = 1,
  onOpenBilling,
  creemProducts,
  enableCreemTopup,
  onCreemProductSelect,
  enableWaffoTopup,
  waffoPayMethods,
  waffoMinTopup,
  onWaffoMethodSelect,
  enableWaffoPancakeTopup,
  onPaymentSuccess,
}: RechargeFormCardProps) {
  const { t } = useTranslation()
  const [localAmount, setLocalAmount] = useState(topupAmount.toString())
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentSucceeded, setPaymentSucceeded] = useState(false)

  useEffect(() => {
    setLocalAmount(topupAmount.toString())
  }, [topupAmount])

  useEffect(() => {
    if (paymentCheckout?.tradeNo) setPaymentSucceeded(false)
  }, [paymentCheckout?.tradeNo])

  useEffect(() => {
    const tradeNo = paymentCheckout?.tradeNo
    if (!paymentDialogOpen || !tradeNo) return

    let stopped = false
    let checking = false
    const checkStatus = async () => {
      if (checking || stopped) return
      checking = true
      try {
        const response = await getUserBillingHistory(1, 10, tradeNo)
        const status = response.data?.items.find(
          (item) => item.trade_no === tradeNo
        )?.status
        if (status === 'success') {
          stopped = true
          setPaymentSucceeded(true)
          toast.success(t('Recharge successful'))
          await new Promise((resolve) => window.setTimeout(resolve, 1600))
          await onPaymentSuccess?.()
          setPaymentDialogOpen(false)
        } else if (status === 'failed' || status === 'expired') {
          stopped = true
          toast.error(t('Payment request failed'))
        }
      } catch {
        // A transient request failure should not interrupt payment polling.
      } finally {
        checking = false
      }
    }

    void checkStatus()
    const timer = window.setInterval(checkStatus, 2000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [onPaymentSuccess, paymentCheckout?.tradeNo, paymentDialogOpen, t])

  const handleAmountChange = (value: string) => {
    setLocalAmount(value)
    const numValue = parseInt(value) || 0
    if (numValue >= 0) {
      onTopupAmountChange(numValue)
    }
  }

  const hasConfigurableTopup =
    topupInfo?.enable_online_topup ||
    topupInfo?.enable_stripe_topup ||
    enableWaffoTopup ||
    enableWaffoPancakeTopup
  const hasAnyTopup = hasConfigurableTopup || enableCreemTopup
  const hasStandardPaymentMethods =
    Array.isArray(topupInfo?.pay_methods) && topupInfo.pay_methods.length > 0
  const hasWaffoPaymentMethods =
    Array.isArray(waffoPayMethods) && waffoPayMethods.length > 0
  const canOpenPaymentDialog =
    hasStandardPaymentMethods ||
    (enableWaffoTopup && hasWaffoPaymentMethods && !!onWaffoMethodSelect)
  const minTopup = getMinTopupAmount(topupInfo)
  const redemptionEnabled = topupInfo?.enable_redemption !== false
  const showQrCode = Boolean(
    paymentCheckout?.type === 'qr' && paymentCheckout.qrValue
  )
  const showQrView = Boolean(confirmProcessing || showQrCode)
  const selectedPaymentAmountLabel = selectedPaymentMethod
    ? `${selectedPaymentMethod.name}支付金额`
    : t('You Pay')
  const rmbPaymentAmount = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paymentAmount)

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    onPaymentMethodSelect(method)
  }

  const getPreferredPaymentMethod = () => {
    const methods = topupInfo?.pay_methods || []
    const availableMethods = methods.filter(
      (method) => (method.min_topup || 0) <= topupAmount
    )

    if (
      selectedPaymentMethod &&
      (selectedPaymentMethod.min_topup || 0) <= topupAmount
    ) {
      return selectedPaymentMethod
    }

    return (
      availableMethods.find((method) => {
        const methodType = method.type.toLowerCase()
        const methodName = method.name.toLowerCase()
        return (
          methodType.includes('wx') ||
          methodType.includes('wechat') ||
          method.name.includes('微信') ||
          methodName.includes('wechat')
        )
      }) ||
      availableMethods[0] ||
      methods[0]
    )
  }

  const handleOpenPaymentDialog = () => {
    const preferredMethod = getPreferredPaymentMethod()
    if (preferredMethod && hasStandardPaymentMethods) {
      onPaymentMethodSelect(preferredMethod)
    }
    setPaymentDialogOpen(true)
  }

  const handleWaffoPaymentSelect = (method: WaffoPayMethod, index: number) => {
    setPaymentDialogOpen(false)
    onWaffoMethodSelect?.(method, index)
  }

  if (loading) {
    return (
      <Card className='h-full gap-0 overflow-hidden py-0'>
        <CardHeader className='border-b p-3 !pb-3 sm:p-5 sm:!pb-5'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='mt-2 h-4 w-48' />
        </CardHeader>
        <CardContent className='space-y-4 p-3 sm:space-y-6 sm:p-5'>
          <div className='space-y-4 sm:space-y-6'>
            {/* Preset Amounts Skeleton */}
            <div className='space-y-3'>
              <Skeleton className='h-3 w-16' />
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className='h-[72px] rounded-lg' />
                ))}
              </div>
            </div>

            {/* Custom Amount Input Skeleton */}
            <div className='space-y-3'>
              <Skeleton className='h-3 w-28' />
              <Skeleton className='h-[42px] w-full' />
            </div>

            {/* Payment Methods Skeleton */}
            <div className='space-y-3'>
              <Skeleton className='h-3 w-32' />
              <div className='flex flex-wrap gap-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className='h-10 w-24 rounded-lg' />
                ))}
              </div>
            </div>
          </div>

          {/* Redemption Code Section Skeleton */}
          <div className='space-y-3 border-t pt-8'>
            <Skeleton className='h-3 w-24' />
            <div className='flex gap-2'>
              <Skeleton className='h-10 flex-1' />
              <Skeleton className='h-10 w-20' />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TitledCard
      className='h-full'
      title={t('Recharge')}
      description={t('Choose an amount and payment method')}
      icon={<WalletCards className='h-4 w-4' />}
      headerClassName='bg-muted/20'
      iconClassName='bg-background border'
      action={
        onOpenBilling ? (
          <Button
            variant='outline'
            size='sm'
            onClick={onOpenBilling}
            className='bg-background hover:bg-background dark:hover:bg-background h-9 w-full gap-2 sm:w-auto'
          >
            <Receipt className='h-4 w-4' />
            {t('Order History')}
          </Button>
        ) : null
      }
      contentClassName='space-y-4 sm:space-y-6'
    >
      {/* Online Topup Section */}
      {hasAnyTopup ? (
        <div className='space-y-4 sm:space-y-6'>
          {hasConfigurableTopup && (
            <>
              <div className='text-primary text-sm font-semibold tracking-tight dark:text-white'>
                {t('Method 1: Instant Recharge')}
              </div>
              <div className='space-y-4 sm:space-y-6 lg:pl-[20px]'>
                {presetAmounts.length > 0 && (
                  <div className='space-y-2.5 sm:space-y-3'>
                    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'>
                      {presetAmounts.map((preset, index) => {
                        const discount =
                          preset.discount ||
                          topupInfo?.discount?.[preset.value] ||
                          1.0
                        const {
                          displayValue,
                          actualPrice,
                          savedAmount,
                          hasDiscount,
                        } = calculatePresetPricing(
                          preset.value,
                          priceRatio,
                          discount,
                          usdExchangeRate
                        )
                        return (
                          <Button
                            key={index}
                            variant='outline'
                            className={cn(
                              'border-border/70 bg-background hover:border-border/70 hover:bg-background dark:hover:bg-background relative flex h-[68px] flex-col items-start overflow-hidden rounded-lg px-3 py-2.5 text-left whitespace-normal shadow-none transition-colors sm:h-[74px]',
                              selectedPreset === preset.value
                                ? 'text-foreground hover:text-foreground border-emerald-700 bg-emerald-50/70 hover:border-emerald-700 hover:bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-white dark:hover:border-emerald-500 dark:hover:bg-emerald-500/10'
                                : ''
                            )}
                            onClick={() => onSelectPreset(preset)}
                          >
                            <div className='flex w-full items-start justify-between gap-2'>
                              <div className='text-base leading-none font-semibold sm:text-lg'>
                                {formatNumber(displayValue)}
                              </div>
                              {selectedPreset === preset.value ? (
                                <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
                              ) : hasDiscount ? (
                                <div className='text-[11px] leading-none font-medium text-emerald-600'>
                                  {getDiscountLabel(discount)}
                                </div>
                              ) : null}
                            </div>
                            <div
                              className={cn(
                                'text-muted-foreground mt-2 w-full truncate text-xs',
                                selectedPreset === preset.value &&
                                  'text-primary/80 dark:text-slate-600'
                              )}
                            >
                              Pay {formatCurrency(actualPrice)}
                              {hasDiscount && savedAmount > 0 && (
                                <span className='text-emerald-600'>
                                  {' '}
                                  • Save {formatCurrency(savedAmount)}
                                </span>
                              )}
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className='space-y-2.5 sm:space-y-3'>
                  <Label
                    htmlFor='topup-amount'
                    className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
                  >
                    {t('Custom Amount')}
                  </Label>
                  <div className='bg-muted/25 grid grid-cols-[minmax(0,1fr)_minmax(112px,0.72fr)] gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,1fr)_minmax(132px,160px)] lg:max-w-[760px] lg:grid-cols-[minmax(0,1fr)_minmax(112px,164px)_auto] lg:items-center'>
                    <Input
                      id='topup-amount'
                      type='number'
                      value={localAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      min={minTopup}
                      placeholder={`Minimum ${minTopup}`}
                      className='bg-background h-10 min-w-0 text-base sm:text-lg'
                    />
                    <div className='bg-background flex min-h-10 items-center justify-between gap-2 rounded-md border px-3'>
                      <span className='text-muted-foreground truncate text-xs'>
                        {t('Amount to pay:')}
                      </span>
                      {calculating ? (
                        <Skeleton className='h-5 w-16' />
                      ) : (
                        <span className='text-sm font-semibold'>
                          {formatCurrency(paymentAmount)}
                        </span>
                      )}
                    </div>
                    <Button
                      type='button'
                      className='col-span-2 h-10 min-w-28 gap-2 px-5 shadow-sm lg:col-span-1'
                      disabled={
                        calculating || !!paymentLoading || !canOpenPaymentDialog
                      }
                      onClick={handleOpenPaymentDialog}
                    >
                      {paymentLoading ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <CreditCard className='h-4 w-4' />
                      )}
                      {t('Recharge Now')}
                    </Button>
                  </div>
                </div>
              </div>

              {!canOpenPaymentDialog && (
                <Alert>
                  <AlertDescription>
                    {t(
                      'No payment methods available. Please contact administrator.'
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      ) : (
        <Alert>
          <AlertDescription>
            {t(
              'Online topup is not enabled. Please use redemption code or contact administrator.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Creem Products Section */}
      {enableCreemTopup &&
        Array.isArray(creemProducts) &&
        creemProducts.length > 0 &&
        onCreemProductSelect && (
          <div className='space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-6'>
            <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
              {t('Creem Payment')}
            </Label>
            <CreemProductsSection
              products={creemProducts}
              onProductSelect={onCreemProductSelect}
            />
          </div>
        )}

      {/* Redemption Code Section */}
      {redemptionEnabled ? (
        <div className='space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-5'>
          <div className='text-primary text-sm font-semibold tracking-tight dark:text-white'>
            {t('Method 2: Redemption Code Recharge')}
          </div>
          <div className='lg:pl-[20px]'>
            <div className='bg-muted/25 grid gap-2 rounded-lg border p-2 lg:max-w-[760px] lg:grid-cols-[minmax(260px,1fr)_auto]'>
              <Input
                id='redemption-code'
                value={redemptionCode}
                onChange={(e) => onRedemptionCodeChange(e.target.value)}
                placeholder={t('Enter your redemption code')}
                className='bg-background h-10 min-w-0'
              />
              <Button
                onClick={onRedeem}
                disabled={redeeming}
                variant='outline'
                className='bg-background hover:bg-background dark:hover:bg-background h-10 min-w-28 px-4'
              >
                {redeeming && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {t('Redeem')}
              </Button>
            </div>
          </div>
          {topupLink && (
            <p className='text-muted-foreground text-xs'>
              {t('Need a redemption code?')}{' '}
              <a
                href={topupLink}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 underline-offset-4 hover:underline'
              >
                {t('Get one here')}
                <ExternalLink className='h-3 w-3' />
              </a>
            </p>
          )}
        </div>
      ) : (
        <Alert className='border-t'>
          <AlertDescription>
            {t(
              'Redemption codes are disabled until the administrator confirms compliance terms.'
            )}
          </AlertDescription>
        </Alert>
      )}

      <Dialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        title={
          paymentSucceeded
            ? t('Recharge successful')
            : showQrView
              ? t('Scan QR code to pay')
              : t('Payment Method')
        }
        description={
          paymentSucceeded
            ? undefined
            : showQrView
              ? t('Use your payment app to scan and complete the payment')
              : t('Choose an amount and payment method')
        }
        contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md'
        contentHeight='auto'
        bodyClassName='space-y-4'
      >
        {paymentSucceeded ? (
          <PaymentSuccessAnimation title={t('Recharge successful')} />
        ) : (
          <>
            {hasStandardPaymentMethods && !showQrView && (
              <div className='space-y-2.5'>
                <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  {t('Payment Method')}
                </Label>
                <div className='grid gap-2'>
                  {topupInfo?.pay_methods?.map((method) => {
                    const minTopup = method.min_topup || 0
                    const disabled = minTopup > topupAmount
                    const isSelected =
                      selectedPaymentMethod?.type === method.type

                    const button = (
                      <Button
                        key={method.type}
                        variant='outline'
                        aria-pressed={isSelected}
                        onClick={() => handlePaymentMethodSelect(method)}
                        disabled={disabled || !!paymentLoading}
                        className={cn(
                          'bg-background hover:bg-muted/50 focus-visible:ring-ring/20 h-12 min-w-0 justify-start gap-2.5 rounded-xl px-3 text-left shadow-none transition-colors focus-visible:ring-2',
                          isSelected &&
                            'border-foreground/20 bg-muted/60 text-foreground hover:bg-muted/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] dark:border-white/10 dark:bg-white/10 dark:shadow-none dark:hover:bg-white/20'
                        )}
                      >
                        {paymentLoading === method.type ? (
                          <span className='bg-background/80 flex size-7 shrink-0 items-center justify-center rounded-lg border'>
                            <Loader2 className='h-4 w-4 animate-spin' />
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'bg-background/80 text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg border',
                              isSelected &&
                                'bg-background text-foreground border-transparent shadow-sm dark:bg-black/20'
                            )}
                          >
                            {getPaymentIcon(
                              method.type,
                              'h-4 w-4',
                              method.icon,
                              method.name
                            )}
                          </span>
                        )}
                        <span className='min-w-0 flex-1 truncate text-left font-medium'>
                          {method.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className='text-foreground/70 h-4 w-4 shrink-0' />
                        )}
                      </Button>
                    )

                    return disabled ? (
                      <TooltipProvider key={method.type}>
                        <Tooltip>
                          <TooltipTrigger render={button}></TooltipTrigger>
                          <TooltipContent>
                            {t('Minimum topup amount: {{amount}}', {
                              amount: minTopup,
                            })}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      button
                    )
                  })}
                </div>
              </div>
            )}

            {selectedPaymentMethod && (
              <div className='space-y-3 border-t pt-4'>
                {showQrView ? (
                  <>
                    <div className='to-muted/20 dark:from-background dark:to-muted/20 rounded-2xl border bg-gradient-to-b from-white p-4 shadow-inner'>
                      <div className='mx-auto flex size-[13rem] items-center justify-center rounded-2xl bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5'>
                        {showQrCode ? (
                          <QRCodeSVG
                            value={paymentCheckout!.qrValue!}
                            size={184}
                          />
                        ) : (
                          <div
                            className='text-muted-foreground flex flex-col items-center gap-3'
                            role='status'
                            aria-live='polite'
                          >
                            <span className='border-muted flex size-16 items-center justify-center rounded-full border'>
                              <Loader2 className='text-foreground size-8 animate-spin' />
                            </span>
                            <span className='text-sm font-medium'>
                              {t('Loading...')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='bg-muted/20 rounded-xl border px-4 py-3'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          {t('Topup Amount')}
                        </span>
                        <span className='font-medium'>{rmbPaymentAmount}</span>
                      </div>
                    </div>
                    {showQrCode ? (
                      <Button
                        className='h-10 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
                        render={
                          <a
                            href={paymentCheckout!.url}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <ExternalLink className='mr-2 h-4 w-4' />
                            {t('Open payment page')}
                          </a>
                        }
                      />
                    ) : (
                      <Button
                        disabled
                        className='h-10 w-full rounded-xl text-sm font-semibold'
                      >
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        {t('Open payment page')}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className='border-border/80 bg-background/95 overflow-hidden rounded-2xl border shadow-sm'>
                      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-sm'>
                        <span className='text-muted-foreground min-w-0 truncate'>
                          {t('Topup Amount')}
                        </span>
                        <span className='text-muted-foreground shrink-0 text-right tabular-nums'>
                          {formatCurrency(topupAmount * usdExchangeRate)}$
                        </span>
                      </div>
                      <div className='border-border/60 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t px-4 py-3.5 text-sm'>
                        <span className='text-muted-foreground min-w-0 truncate'>
                          {selectedPaymentAmountLabel}
                        </span>
                        <span className='text-muted-foreground shrink-0 text-right tabular-nums'>
                          {formatCurrency(paymentAmount)}R
                        </span>
                      </div>
                    </div>
                    <div className='grid grid-cols-[0.85fr_1.15fr] gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-10 rounded-xl'
                        disabled={confirmProcessing}
                        onClick={() => setPaymentDialogOpen(false)}
                      >
                        {t('Cancel')}
                      </Button>
                      <Button
                        type='button'
                        className='h-10 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800'
                        disabled={confirmProcessing || calculating}
                        onClick={onPaymentConfirm}
                      >
                        {confirmProcessing && (
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        )}
                        {t('Confirm Payment')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {enableWaffoTopup &&
              hasWaffoPaymentMethods &&
              onWaffoMethodSelect && (
                <div className='space-y-2.5'>
                  <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                    {t('Waffo Payment')}
                  </Label>
                  <div className='grid gap-2'>
                    {waffoPayMethods?.map((method, index) => {
                      const loadingKey = `waffo-${index}`
                      const waffoMin = waffoMinTopup || 0
                      const belowMin = waffoMin > topupAmount

                      const button = (
                        <Button
                          key={`${method.name}-${index}`}
                          variant='outline'
                          onClick={() =>
                            handleWaffoPaymentSelect(method, index)
                          }
                          disabled={belowMin || !!paymentLoading}
                          className='bg-background hover:bg-muted/50 h-11 min-w-0 justify-start gap-2 rounded-lg px-3'
                        >
                          {paymentLoading === loadingKey ? (
                            <Loader2 className='h-4 w-4 animate-spin' />
                          ) : method.icon ? (
                            <img
                              src={method.icon}
                              alt={method.name}
                              className='h-4 w-4 object-contain'
                            />
                          ) : (
                            getPaymentIcon('waffo')
                          )}
                          <span className='truncate'>{method.name}</span>
                        </Button>
                      )

                      return belowMin ? (
                        <TooltipProvider key={`${method.name}-${index}`}>
                          <Tooltip>
                            <TooltipTrigger render={button}></TooltipTrigger>
                            <TooltipContent>
                              {t('Minimum topup amount: {{amount}}', {
                                amount: waffoMin,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        button
                      )
                    })}
                  </div>
                </div>
              )}

            {!canOpenPaymentDialog && (
              <Alert>
                <AlertDescription>
                  {t(
                    'No payment methods available. Please contact administrator.'
                  )}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </Dialog>
    </TitledCard>
  )
}
