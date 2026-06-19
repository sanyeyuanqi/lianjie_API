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
  Crown,
  CalendarClock,
  CreditCard,
  ExternalLink,
  Loader2,
  Package,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DEFAULT_CURRENCY_CONFIG } from '@/stores/system-config-store'
import { formatQuota } from '@/lib/format'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog } from '@/components/dialog'
import { GroupBadge } from '@/components/group-badge'
import { PaymentSuccessAnimation } from '@/components/payment-success-animation'
import {
  paySubscriptionStripe,
  paySubscriptionCreem,
  paySubscriptionEpay,
  paySubscriptionWaffoPancake,
  paySubscriptionBalance,
  getSelfSubscriptionFull,
} from '../../api'
import { formatDuration, formatResetPeriod } from '../../lib'
import type { PlanRecord } from '../../types'

interface PaymentMethod {
  type: string
  name?: string
}

interface EpayCheckout {
  url: string
  qrValue: string
  paymentMethod: string
  baselinePurchaseCount: number
}

function createEpayCheckout(
  url: string,
  data: unknown,
  paymentMethod: string,
  baselinePurchaseCount: number
): EpayCheckout {
  const params =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {}

  let paymentUrl: string
  try {
    const checkoutUrl = new URL(url, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        checkoutUrl.searchParams.set(key, String(value))
      }
    })
    paymentUrl = checkoutUrl.toString()
  } catch {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.set(key, String(value))
      }
    })
    paymentUrl = `${url}${url.includes('?') ? '&' : '?'}${query.toString()}`
  }

  const qrValue = [
    'qr_code',
    'qrcode',
    'code_url',
    'pay_url',
    'payment_url',
    'checkout_url',
  ]
    .map((key) => params[key])
    .find(
      (value): value is string => typeof value === 'string' && !!value.trim()
    )

  return {
    url:
      typeof params.checkout_url === 'string' && params.checkout_url.trim()
        ? params.checkout_url
        : paymentUrl,
    qrValue: qrValue?.trim() || paymentUrl,
    paymentMethod,
    baselinePurchaseCount,
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: PlanRecord | null
  enableStripe?: boolean
  enableCreem?: boolean
  enableWaffoPancake?: boolean
  enableOnlineTopUp?: boolean
  epayMethods?: PaymentMethod[]
  purchaseLimit?: number
  purchaseCount?: number
  userQuota?: number
  onPurchaseSuccess?: () => void | Promise<void>
}

export function SubscriptionPurchaseDialog(props: Props) {
  const { t } = useTranslation()
  const { currency } = useSystemConfig()
  const [paying, setPaying] = useState(false)
  const [selectedEpayMethod, setSelectedEpayMethod] = useState('')
  const [epayCheckout, setEpayCheckout] = useState<EpayCheckout | null>(null)
  const [epayCheckoutOpen, setEpayCheckoutOpen] = useState(false)
  const [paymentSucceeded, setPaymentSucceeded] = useState(false)
  const dialogOpen = props.open
  const onOpenChange = props.onOpenChange
  const onPurchaseSuccess = props.onPurchaseSuccess
  const plan = props.plan?.plan

  useEffect(() => {
    if (props.open && props.epayMethods && props.epayMethods.length > 0) {
      setSelectedEpayMethod(props.epayMethods[0].type)
    } else if (!props.open) {
      setSelectedEpayMethod('')
      setEpayCheckout(null)
      setEpayCheckoutOpen(false)
      setPaymentSucceeded(false)
    }
  }, [props.open, props.epayMethods])

  useEffect(() => {
    if (!dialogOpen || !epayCheckout) return

    let stopped = false
    let checking = false
    const checkStatus = async () => {
      if (checking || stopped) return
      checking = true
      try {
        const response = await getSelfSubscriptionFull()
        const purchaseCount = (response.data?.all_subscriptions || []).filter(
          (item) => item.subscription.plan_id === plan?.id
        ).length
        if (purchaseCount > epayCheckout.baselinePurchaseCount) {
          stopped = true
          setPaymentSucceeded(true)
          toast.success(t('Subscription purchased successfully'))
          await new Promise((resolve) => window.setTimeout(resolve, 1600))
          await onPurchaseSuccess?.()
          onOpenChange(false)
        }
      } catch {
        // Keep polling after transient network failures.
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
  }, [epayCheckout, dialogOpen, onOpenChange, onPurchaseSuccess, plan?.id, t])

  if (!plan) return null

  const hasStripe = props.enableStripe && !!plan.stripe_price_id
  const hasCreem = props.enableCreem && !!plan.creem_product_id
  const hasWaffoPancake =
    props.enableWaffoPancake && !!plan.waffo_pancake_product_id
  const hasEpay =
    props.enableOnlineTopUp && (props.epayMethods || []).length > 0
  const hasAnyPayment = hasStripe || hasCreem || hasWaffoPancake || hasEpay
  const selectedEpayMethodLabel =
    (props.epayMethods || []).find((m) => m.type === selectedEpayMethod)
      ?.name ||
    selectedEpayMethod ||
    t('Select payment method')
  const totalAmount = Number(plan.total_amount || 0)
  const price = Number(plan.price_amount || 0).toFixed(2)
  const quotaPerUnit =
    currency?.quotaPerUnit && currency.quotaPerUnit > 0
      ? currency.quotaPerUnit
      : DEFAULT_CURRENCY_CONFIG.quotaPerUnit
  const balanceCost = Math.max(
    0,
    Math.ceil(Number(plan.price_amount || 0) * quotaPerUnit)
  )
  const userQuota = Math.max(0, Number(props.userQuota || 0))
  const allowBalancePay = plan.allow_balance_pay !== false
  const insufficientBalance = userQuota < balanceCost
  const limitReached =
    (props.purchaseLimit || 0) > 0 &&
    (props.purchaseCount || 0) >= (props.purchaseLimit || 0)

  const handlePayStripe = async () => {
    setPaying(true)
    try {
      const res = await paySubscriptionStripe({ plan_id: plan.id })
      if (res.message === 'success' && res.data?.pay_link) {
        window.open(res.data.pay_link, '_blank')
        toast.success(t('Payment page opened'))
        props.onOpenChange(false)
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const handlePayCreem = async () => {
    setPaying(true)
    try {
      const res = await paySubscriptionCreem({ plan_id: plan.id })
      if (res.message === 'success' && res.data?.checkout_url) {
        window.open(res.data.checkout_url, '_blank')
        toast.success(t('Payment page opened'))
        props.onOpenChange(false)
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  // In-tab redirect (not window.open) — user-gesture context is lost
  // across the await, so a popup would be blocked. Same as the wallet hook.
  const handlePayWaffoPancake = async () => {
    setPaying(true)
    try {
      const res = await paySubscriptionWaffoPancake({ plan_id: plan.id })
      if (res.message === 'success' && res.data?.checkout_url) {
        toast.success(t('Redirecting to payment page...'))
        window.location.href = res.data.checkout_url
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const handlePayEpay = async () => {
    if (!selectedEpayMethod) {
      toast.error(t('Please select a payment method'))
      return
    }
    setPaying(true)
    setEpayCheckout(null)
    setPaymentSucceeded(false)
    setEpayCheckoutOpen(true)
    try {
      const res = await paySubscriptionEpay({
        plan_id: plan.id,
        payment_method: selectedEpayMethod,
      })
      if (res.message === 'success' && res.url) {
        setEpayCheckout(
          createEpayCheckout(
            res.url,
            res.data,
            selectedEpayMethod,
            props.purchaseCount || 0
          )
        )
      } else {
        setEpayCheckoutOpen(false)
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      setEpayCheckoutOpen(false)
      toast.error(t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const handlePayBalance = async () => {
    if (!allowBalancePay) {
      toast.error(t('This plan does not allow balance redemption'))
      return
    }
    setPaying(true)
    try {
      const res = await paySubscriptionBalance({ plan_id: plan.id })
      if (res.success) {
        toast.success(t('Subscription purchased successfully'))
        void props.onPurchaseSuccess?.()
        props.onOpenChange(false)
      } else {
        toast.error(
          res.message && res.message !== 'success'
            ? res.message
            : t('Payment request failed')
        )
      }
    } catch {
      toast.error(t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEpayCheckout(null)
      setEpayCheckoutOpen(false)
    }
    props.onOpenChange(open)
  }

  if (epayCheckoutOpen) {
    return (
      <Dialog
        open={props.open}
        onOpenChange={handleOpenChange}
        title={
          paymentSucceeded
            ? t('Subscription purchased successfully')
            : t('Scan QR code to pay')
        }
        description={
          paymentSucceeded
            ? undefined
            : t('Use your payment app to scan and complete the payment')
        }
        contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md'
        contentHeight='auto'
        bodyClassName='space-y-4'
      >
        {paymentSucceeded ? (
          <PaymentSuccessAnimation
            title={t('Subscription purchased successfully')}
          />
        ) : (
          <>
            <div className='to-muted/20 dark:from-background dark:to-muted/20 rounded-2xl border bg-gradient-to-b from-white p-4 shadow-inner'>
              <div className='mx-auto flex size-[13rem] items-center justify-center rounded-2xl bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ring-1 ring-black/5'>
                {epayCheckout ? (
                  <QRCodeSVG value={epayCheckout.qrValue} size={184} />
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
                <span className='text-muted-foreground'>{t('Amount Due')}</span>
                <span className='font-medium'>{price}</span>
              </div>
              <div className='mt-3 flex items-center justify-between border-t pt-3 text-sm'>
                <span className='text-muted-foreground'>
                  {t('Payment Method')}
                </span>
                <span className='font-medium'>{selectedEpayMethodLabel}</span>
              </div>
            </div>
            {epayCheckout ? (
              <Button
                className='h-10 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
                render={
                  <a
                    href={epayCheckout.url}
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
                {t('Loading...')}
              </Button>
            )}
          </>
        )}
      </Dialog>
    )
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={handleOpenChange}
      title={
        <>
          <Crown className='h-5 w-5' />
          {t('Purchase Subscription')}
        </>
      }
      contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md'
      titleClassName='flex items-center gap-2'
      contentHeight='auto'
      bodyClassName='space-y-4'
    >
      <div className='space-y-3 sm:space-y-4'>
        <div className='bg-muted/50 space-y-2.5 rounded-lg border p-3 sm:space-y-3 sm:p-4'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground text-sm'>
              {t('Plan Name')}
            </span>
            <span className='max-w-[200px] truncate text-sm font-medium'>
              {plan.title}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>
              {t('Validity Period')}
            </span>
            <span className='flex items-center gap-1 text-sm'>
              <CalendarClock className='h-3.5 w-3.5' />
              {formatDuration(plan, t)}
            </span>
          </div>
          {formatResetPeriod(plan, t) !== t('No Reset') && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground text-sm'>
                {t('Reset Period')}
              </span>
              <span className='text-sm'>{formatResetPeriod(plan, t)}</span>
            </div>
          )}
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>
              {t('Reset Quota')}
            </span>
            <span className='flex items-center gap-1 text-sm'>
              <Package className='h-3.5 w-3.5' />
              {totalAmount > 0 ? formatQuota(totalAmount) : t('Unlimited')}
            </span>
          </div>
          {plan.upgrade_group && (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground text-sm'>
                {t('Upgrade Group')}
              </span>
              <GroupBadge group={plan.upgrade_group} />
            </div>
          )}
          <Separator />
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>{t('Amount Due')}</span>
            <span className='text-primary text-lg font-bold'>{price}</span>
          </div>
        </div>

        {limitReached && (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('Purchase limit reached')} ({props.purchaseCount}/
              {props.purchaseLimit})
            </AlertDescription>
          </Alert>
        )}

        {allowBalancePay && (
          <div className='flex flex-col gap-2 rounded-md border p-3'>
            <div className='flex items-center justify-between gap-2 text-xs'>
              <span className='text-muted-foreground'>{t('Required')}</span>
              <span>{formatQuota(balanceCost)}</span>
            </div>
            <div className='flex items-center justify-between gap-2 text-xs'>
              <span className='text-muted-foreground'>{t('Available')}</span>
              <span>{formatQuota(userQuota)}</span>
            </div>
            {insufficientBalance && (
              <Alert variant='destructive'>
                <AlertDescription>{t('Insufficient balance')}</AlertDescription>
              </Alert>
            )}
            <Button
              variant='outline'
              onClick={handlePayBalance}
              disabled={paying || limitReached || insufficientBalance}
            >
              {t('Pay with Balance')}
            </Button>
          </div>
        )}

        {hasAnyPayment && (
          <div className='bg-muted/20 space-y-3 rounded-lg border p-3'>
            <div className='flex items-center gap-2'>
              <div className='bg-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md border'>
                <CreditCard className='h-4 w-4' />
              </div>
              <div>
                <p className='text-sm font-medium'>
                  {t('Select payment method')}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {t('Amount Due')}: {price}
                </p>
              </div>
            </div>
            {(hasStripe || hasCreem || hasWaffoPancake) && (
              <div className='grid grid-cols-2 gap-2 sm:flex'>
                {hasStripe && (
                  <Button
                    variant='outline'
                    className='bg-background h-10 flex-1'
                    onClick={handlePayStripe}
                    disabled={paying || limitReached}
                  >
                    Stripe
                  </Button>
                )}
                {hasCreem && (
                  <Button
                    variant='outline'
                    className='bg-background h-10 flex-1'
                    onClick={handlePayCreem}
                    disabled={paying || limitReached}
                  >
                    Creem
                  </Button>
                )}
                {hasWaffoPancake && (
                  <Button
                    variant='outline'
                    className='bg-background h-10 flex-1'
                    onClick={handlePayWaffoPancake}
                    disabled={paying || limitReached}
                  >
                    Waffo Pancake
                  </Button>
                )}
              </div>
            )}
            {hasEpay && (
              <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'>
                <Select
                  items={[
                    ...(props.epayMethods || []).map((m) => ({
                      value: m.type,
                      label: m.name || m.type,
                    })),
                  ]}
                  value={selectedEpayMethod}
                  onValueChange={(v) => v !== null && setSelectedEpayMethod(v)}
                  disabled={limitReached}
                >
                  <SelectTrigger className='bg-background h-10 w-full'>
                    <SelectValue>{selectedEpayMethodLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {(props.epayMethods || []).map((m) => (
                        <SelectItem key={m.type} value={m.type}>
                          {m.name || m.type}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handlePayEpay}
                  disabled={paying || !selectedEpayMethod || limitReached}
                  className='h-10 w-full min-w-32 gap-2 px-5 shadow-sm sm:w-auto'
                >
                  {paying ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <CreditCard className='h-4 w-4' />
                  )}
                  {t('Pay')} {price}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}
