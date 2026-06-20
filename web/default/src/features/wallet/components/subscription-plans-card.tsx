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
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { Crown, RefreshCw, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { dotColorMap, textColorMap } from '@/components/status-badge'
import {
  getPublicPlans,
  getSelfSubscriptionFull,
  updateBillingPreference,
} from '@/features/subscriptions/api'
import { SubscriptionPurchaseDialog } from '@/features/subscriptions/components/dialogs/subscription-purchase-dialog'
import {
  formatDuration,
  formatResetPeriod,
  formatTimestamp,
} from '@/features/subscriptions/lib'
import type {
  PlanRecord,
  UserSubscriptionRecord,
} from '@/features/subscriptions/types'
import type { PaymentMethod, TopupInfo } from '../types'

interface SubscriptionPlansCardProps {
  topupInfo: TopupInfo | null
  onAvailabilityChange?: (available: boolean) => void
  userQuota?: number
  onPurchaseSuccess?: () => void | Promise<void>
}

function getEpayMethods(payMethods: PaymentMethod[] = []): PaymentMethod[] {
  return payMethods.filter(
    (m) => m?.type && m.type !== 'stripe' && m.type !== 'creem'
  )
}

function getBillingPreferenceLabel(
  preference: string,
  t: (key: string) => string
): string {
  switch (preference) {
    case 'subscription_first':
      return t('Subscription First')
    case 'wallet_first':
      return t('Wallet First')
    case 'subscription_only':
      return t('Subscription Only')
    case 'wallet_only':
      return t('Wallet Only')
    default:
      return preference
  }
}

export function SubscriptionPlansCard({
  topupInfo,
  onAvailabilityChange,
  userQuota,
  onPurchaseSuccess,
}: SubscriptionPlansCardProps) {
  const { t } = useTranslation()
  const [planGridElement, setPlanGridElement] = useState<HTMLDivElement | null>(
    null
  )
  const [planGridColumns, setPlanGridColumns] = useState(1)
  const planGridClassName = 'grid grid-cols-1 gap-3 2xl:gap-4'
  const planGridStyle = useMemo<CSSProperties>(
    () => ({
      gridTemplateColumns: `repeat(${planGridColumns}, minmax(0, 1fr))`,
    }),
    [planGridColumns]
  )

  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<
    UserSubscriptionRecord[]
  >([])
  const [allSubscriptions, setAllSubscriptions] = useState<
    UserSubscriptionRecord[]
  >([])
  const [billingPreference, setBillingPreference] =
    useState('subscription_first')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null)

  const enableStripe = !!topupInfo?.enable_stripe_topup
  const enableCreem = !!topupInfo?.enable_creem_topup
  const enableWaffoPancake = !!topupInfo?.enable_waffo_pancake_topup
  const enableOnlineTopUp = !!topupInfo?.enable_online_topup
  const epayMethods = useMemo(
    () => getEpayMethods(topupInfo?.pay_methods),
    [topupInfo?.pay_methods]
  )

  const fetchPlans = useCallback(async () => {
    try {
      const res = await getPublicPlans()
      if (res.success) {
        setPlans(res.data || [])
      }
    } catch {
      setPlans([])
    }
  }, [])

  const fetchSelfSubscription = useCallback(async () => {
    try {
      const res = await getSelfSubscriptionFull()
      if (res.success && res.data) {
        setBillingPreference(
          res.data.billing_preference || 'subscription_first'
        )
        setActiveSubscriptions(res.data.subscriptions || [])
        setAllSubscriptions(res.data.all_subscriptions || [])
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchPlans(), fetchSelfSubscription()])
      setLoading(false)
    }
    init()
  }, [fetchPlans, fetchSelfSubscription])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchSelfSubscription()
    } finally {
      setRefreshing(false)
    }
  }

  const handlePreferenceChange = async (pref: string) => {
    const previous = billingPreference
    setBillingPreference(pref)
    try {
      const res = await updateBillingPreference(pref)
      if (res.success) {
        toast.success(t('Updated successfully'))
        setBillingPreference(res.data?.billing_preference || pref)
      } else {
        toast.error(res.message || t('Update failed'))
        setBillingPreference(previous)
      }
    } catch {
      toast.error(t('Request failed'))
      setBillingPreference(previous)
    }
  }

  const hasActive = activeSubscriptions.length > 0
  const hasAny = allSubscriptions.length > 0
  const isAvailable = loading || plans.length > 0 || hasAny
  const disablePref = !hasActive
  const isSubPref =
    billingPreference === 'subscription_first' ||
    billingPreference === 'subscription_only'
  const displayPref =
    disablePref && isSubPref ? 'wallet_first' : billingPreference

  const planPurchaseCountMap = useMemo(() => {
    const map = new Map<number, number>()
    for (const sub of allSubscriptions) {
      const planId = sub?.subscription?.plan_id
      if (!planId) continue
      map.set(planId, (map.get(planId) || 0) + 1)
    }
    return map
  }, [allSubscriptions])

  const planMap = useMemo(() => {
    const map = new Map<number, PlanRecord['plan']>()
    for (const item of plans) {
      if (item?.plan?.id) {
        map.set(item.plan.id, item.plan)
      }
    }
    return map
  }, [plans])

  useEffect(() => {
    onAvailabilityChange?.(isAvailable)
  }, [isAvailable, onAvailabilityChange])

  useEffect(() => {
    if (!planGridElement) return

    const calculateColumns = () => {
      const width = planGridElement.clientWidth
      if (width <= 0) return

      const rootFontSize =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const minCardWidth = rootFontSize * 22
      const maxCardWidth = rootFontSize * 28
      const gap = rootFontSize * 0.75

      const columnsNeededForMaxWidth = Math.ceil(
        (width + gap) / (maxCardWidth + gap)
      )
      const columnsAllowedByMinWidth = Math.max(
        1,
        Math.floor((width + gap) / (minCardWidth + gap))
      )

      setPlanGridColumns(
        Math.max(
          1,
          Math.min(columnsNeededForMaxWidth, columnsAllowedByMinWidth)
        )
      )
    }

    calculateColumns()

    const observer = new ResizeObserver(calculateColumns)
    observer.observe(planGridElement)

    return () => observer.disconnect()
  }, [planGridElement])

  if (loading) {
    return (
      <div className='bg-card space-y-4 rounded-2xl border p-4 sm:p-5'>
        <div className='-mx-4 flex items-center gap-3 border-b px-4 pb-4 sm:-mx-5 sm:px-5'>
          <Skeleton className='h-9 w-9 rounded-lg' />
          <div className='space-y-1.5'>
            <Skeleton className='h-5 w-28' />
            <Skeleton className='h-3 w-48' />
          </div>
        </div>
        <div
          ref={setPlanGridElement}
          className={planGridClassName}
          style={planGridStyle}
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className='h-72 w-full rounded-xl' />
          ))}
        </div>
      </div>
    )
  }

  if (plans.length === 0 && !hasAny) {
    return null
  }

  return (
    <>
      <div className='bg-card space-y-4 rounded-2xl border p-4 sm:p-5'>
        <div className='-mx-4 flex flex-col gap-3 border-b px-4 pb-4 sm:-mx-5 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border'>
              <Crown className='h-4 w-4' />
            </div>
            <div className='min-w-0'>
              <h3 className='text-lg font-semibold tracking-tight'>
                {t('Subscription Plans')}
              </h3>
              <p className='text-muted-foreground text-xs sm:text-sm'>
                {t('Subscribe to a plan for model access')}
              </p>
            </div>
          </div>

          <div className='flex flex-col items-start gap-1.5 sm:items-end'>
            <div className='flex min-w-0 flex-wrap items-center gap-2 px-1'>
              <span className='text-sm font-medium'>
                {t('My Subscriptions')}
              </span>
              <span className='flex items-center gap-1.5 text-xs font-medium'>
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    hasActive ? dotColorMap.success : dotColorMap.neutral
                  )}
                  aria-hidden='true'
                />
                {hasActive ? (
                  <span className={cn(textColorMap.success)}>
                    {activeSubscriptions.length} {t('active')}
                  </span>
                ) : (
                  <span className='text-muted-foreground'>
                    {t('No Active')}
                  </span>
                )}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Select
                items={[
                  {
                    value: 'subscription_first',
                    label: getBillingPreferenceLabel('subscription_first', t),
                  },
                  {
                    value: 'wallet_first',
                    label: getBillingPreferenceLabel('wallet_first', t),
                  },
                  {
                    value: 'subscription_only',
                    label: getBillingPreferenceLabel('subscription_only', t),
                  },
                  {
                    value: 'wallet_only',
                    label: getBillingPreferenceLabel('wallet_only', t),
                  },
                ]}
                value={displayPref}
                onValueChange={(value) =>
                  value !== null && handlePreferenceChange(value)
                }
              >
                <SelectTrigger className='h-8 w-[140px] text-xs'>
                  <SelectValue>
                    {getBillingPreferenceLabel(displayPref, t)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    <SelectItem
                      value='subscription_first'
                      disabled={disablePref}
                    >
                      {getBillingPreferenceLabel('subscription_first', t)}
                    </SelectItem>
                    <SelectItem value='wallet_first'>
                      {getBillingPreferenceLabel('wallet_first', t)}
                    </SelectItem>
                    <SelectItem
                      value='subscription_only'
                      disabled={disablePref}
                    >
                      {getBillingPreferenceLabel('subscription_only', t)}
                    </SelectItem>
                    <SelectItem value='wallet_only'>
                      {getBillingPreferenceLabel('wallet_only', t)}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')}
                />
              </Button>
            </div>
          </div>
        </div>

        <div className='space-y-5'>
          {hasActive && (
            <section className='space-y-3'>
              <div className='flex items-center justify-between gap-3'>
                <h4 className='text-sm font-semibold'>
                  {t('My Subscription Plans')}
                </h4>
                <span
                  className={cn('text-xs font-medium', textColorMap.success)}
                >
                  {activeSubscriptions.length} {t('active')}
                </span>
              </div>

              <div
                ref={setPlanGridElement}
                className={planGridClassName}
                style={planGridStyle}
              >
                {activeSubscriptions.map((record) => {
                  const sub = record.subscription
                  const plan = record.plan || planMap.get(sub.plan_id)
                  const total = Number(sub.amount_total || 0)
                  const used = Number(sub.amount_used || 0)
                  const remaining = Math.max(total - used, 0)
                  const quotaDisplay =
                    total > 0 ? formatQuota(remaining) : t('Unlimited')

                  const details = [
                    `${t('Status')}: ${t('Active')}`,
                    `${t('End')}: ${formatTimestamp(sub.end_time)}`,
                    sub.next_reset_time
                      ? `${t('Next reset')}: ${formatTimestamp(sub.next_reset_time)}`
                      : null,
                    total > 0 ? `${t('Used')}: ${formatQuota(used)}` : null,
                    sub.source ? `${t('Source')}: ${sub.source}` : null,
                  ].filter(Boolean) as string[]

                  return (
                    <Card
                      key={sub.id}
                      className='border-primary/45 bg-primary/5 gap-0 overflow-hidden rounded-xl py-0 shadow-sm'
                    >
                      <CardContent className='flex h-full flex-col p-4 sm:p-5'>
                        <div className='mb-3 flex items-start justify-between gap-3 border-b pb-3'>
                          <div className='min-w-0'>
                            <h4 className='truncate font-semibold'>
                              {plan?.title || `#${sub.plan_id}`}
                            </h4>
                            {plan?.subtitle && (
                              <p className='text-muted-foreground truncate text-xs'>
                                {plan.subtitle}
                              </p>
                            )}
                          </div>
                          <div className='shrink-0 text-right'>
                            <div className='text-muted-foreground text-[11px] font-medium'>
                              {t('Remaining')}
                            </div>
                            <div className='text-primary text-xl font-bold tabular-nums sm:text-2xl'>
                              {quotaDisplay}
                            </div>
                          </div>
                        </div>

                        <div className='flex-1 space-y-2 py-3'>
                          {details.map((label) => (
                            <div
                              key={label}
                              className='text-muted-foreground flex items-center gap-2 text-xs leading-5'
                            >
                              <Check className='text-primary h-3.5 w-3.5 shrink-0' />
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          <section className='space-y-3'>
            {hasActive && (
              <h4 className='text-sm font-semibold'>{t('Available Plans')}</h4>
            )}

            {plans.length > 0 ? (
              <div
                ref={setPlanGridElement}
                className={planGridClassName}
                style={planGridStyle}
              >
                {plans.map((p) => {
                  const plan = p?.plan
                  if (!plan) return null
                  const totalAmount = Number(plan.total_amount || 0)
                  const resetQuota = formatQuota(totalAmount)
                  const resetQuotaDisplay = resetQuota.startsWith('$')
                    ? `${resetQuota.slice(1)}$`
                    : resetQuota
                  const price = Number(plan.price_amount || 0).toFixed(2)
                  const limit = Number(plan.max_purchase_per_user || 0)
                  const count = planPurchaseCountMap.get(plan.id) || 0
                  const reached = limit > 0 && count >= limit

                  const benefits = [
                    `${t('Validity Period')}: ${formatDuration(plan, t)}`,
                    formatResetPeriod(plan, t) !== t('No Reset')
                      ? `${t('Quota Reset')}: ${formatResetPeriod(plan, t)}`
                      : null,
                    totalAmount > 0
                      ? `${t('Reset Quota')}: ${resetQuotaDisplay}`
                      : `${t('Reset Quota')}: ${t('Unlimited')}`,
                    limit > 0 ? `${t('Purchase Limit')}: ${limit}` : null,
                    plan.upgrade_group
                      ? `${t('Upgrade Group')}: ${plan.upgrade_group}`
                      : null,
                  ].filter(Boolean) as string[]

                  return (
                    <Card
                      key={plan.id}
                      className='bg-background/95 gap-0 overflow-hidden rounded-xl border py-0 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:hover:border-white/20'
                    >
                      <CardContent className='flex h-full flex-col p-4 sm:p-5'>
                        <div className='mb-3 flex items-start justify-between gap-3 border-b pb-3'>
                          <div className='min-w-0'>
                            <h4 className='truncate font-semibold'>
                              {plan.title || t('Subscription Plans')}
                            </h4>
                            {plan.subtitle && (
                              <p className='text-muted-foreground truncate text-xs'>
                                {plan.subtitle}
                              </p>
                            )}
                          </div>
                          <div className='flex shrink-0 items-center gap-2'>
                            <span className='text-primary text-xl font-bold tabular-nums sm:text-2xl'>
                              {price}
                            </span>
                          </div>
                        </div>

                        <div className='flex-1 space-y-2 py-3'>
                          {benefits.map((label) => (
                            <div
                              key={label}
                              className='text-muted-foreground flex items-center gap-2 text-xs leading-5'
                            >
                              <Check className='text-primary h-3.5 w-3.5 shrink-0' />
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>

                        <Separator className='mb-3' />

                        {reached ? (
                          <Tooltip>
                            <TooltipTrigger render={<div />}>
                              <Button
                                variant='outline'
                                className='w-full'
                                disabled
                              >
                                {t('Limit Reached')}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('Purchase limit reached')} ({count}/{limit})
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant='outline'
                            className='w-full'
                            onClick={() => {
                              setSelectedPlan(p)
                              setPurchaseOpen(true)
                            }}
                          >
                            {t('Subscribe Now')}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <p className='text-muted-foreground py-4 text-sm'>
                {t('No plans available')}
              </p>
            )}
          </section>
        </div>
      </div>

      <SubscriptionPurchaseDialog
        open={purchaseOpen}
        onOpenChange={(open) => {
          setPurchaseOpen(open)
          if (!open) {
            fetchSelfSubscription()
          }
        }}
        plan={selectedPlan}
        enableStripe={enableStripe}
        enableCreem={enableCreem}
        enableWaffoPancake={enableWaffoPancake}
        enableOnlineTopUp={enableOnlineTopUp}
        epayMethods={epayMethods}
        userQuota={userQuota}
        onPurchaseSuccess={onPurchaseSuccess}
        purchaseLimit={
          selectedPlan?.plan?.max_purchase_per_user
            ? Number(selectedPlan.plan.max_purchase_per_user)
            : undefined
        }
        purchaseCount={
          selectedPlan?.plan?.id
            ? planPurchaseCountMap.get(selectedPlan.plan.id)
            : undefined
        }
      />
    </>
  )
}
