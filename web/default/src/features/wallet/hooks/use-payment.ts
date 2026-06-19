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
import { useState, useCallback } from 'react'
import i18next from 'i18next'
import { toast } from 'sonner'
import {
  calculateAmount,
  calculateStripeAmount,
  calculateWaffoPancakeAmount,
  requestPayment,
  requestStripePayment,
  isApiSuccess,
} from '../api'
import { isStripePayment, isWaffoPancakePayment } from '../lib'
import type { PaymentCheckoutResult } from '../types'

// ============================================================================
// Payment Hook
// ============================================================================

export function usePayment() {
  const [amount, setAmount] = useState<number>(0)
  const [calculating, setCalculating] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Calculate payment amount
  const calculatePaymentAmount = useCallback(
    async (topupAmount: number, paymentType: string) => {
      try {
        setCalculating(true)

        const isStripe = isStripePayment(paymentType)
        const isPancake = isWaffoPancakePayment(paymentType)
        const response = isStripe
          ? await calculateStripeAmount({ amount: topupAmount })
          : isPancake
            ? await calculateWaffoPancakeAmount({ amount: topupAmount })
            : await calculateAmount({ amount: topupAmount })

        if (isApiSuccess(response) && response.data) {
          const calculatedAmount = parseFloat(response.data)
          setAmount(calculatedAmount)
          return calculatedAmount
        }

        // Don't show error for calculation, just set to 0
        setAmount(0)
        return 0
      } catch (_error) {
        setAmount(0)
        return 0
      } finally {
        setCalculating(false)
      }
    },
    []
  )

  const buildPaymentUrl = useCallback(
    (url: string, params: Record<string, unknown>) => {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        query.set(key, String(value))
      })

      try {
        const paymentUrl = new URL(url, window.location.origin)
        query.forEach((value, key) => paymentUrl.searchParams.set(key, value))
        return paymentUrl.toString()
      } catch (_error) {
        const separator = url.includes('?') ? '&' : '?'
        return `${url}${separator}${query.toString()}`
      }
    },
    []
  )

  const getQrValue = useCallback(
    (url: string, params: Record<string, unknown>) => {
      const directQrFields = [
        'qr_code',
        'qrcode',
        'code_url',
        'pay_url',
        'payment_url',
        'checkout_url',
      ]
      for (const field of directQrFields) {
        const value = params[field]
        if (typeof value === 'string' && value.trim()) {
          return value.trim()
        }
      }
      return buildPaymentUrl(url, params)
    },
    [buildPaymentUrl]
  )

  // Process payment
  const processPayment = useCallback(
    async (
      topupAmount: number,
      paymentType: string
    ): Promise<PaymentCheckoutResult | null> => {
      try {
        setProcessing(true)

        const isStripe = isStripePayment(paymentType)
        const amount = Math.floor(topupAmount)

        const response = isStripe
          ? await requestStripePayment({
              amount,
              payment_method: 'stripe',
            })
          : await requestPayment({
              amount,
              payment_method: paymentType,
            })

        if (!isApiSuccess(response)) {
          toast.error(response.message || i18next.t('Payment request failed'))
          return null
        }

        // Handle Stripe payment
        if (isStripe && response.data?.pay_link) {
          window.open(response.data.pay_link as string, '_blank')
          toast.success(i18next.t('Redirecting to payment page...'))
          return {
            type: 'redirect',
            url: response.data.pay_link as string,
            paymentMethod: paymentType,
          }
        }

        // Handle non-Stripe payment
        if (!isStripe && response.data) {
          const paymentData = response.data as Record<string, unknown>
          const url = (response as unknown as { url?: string }).url
          if (url) {
            const qrValue = getQrValue(url, paymentData)
            const checkoutUrl =
              typeof paymentData.checkout_url === 'string'
                ? paymentData.checkout_url
                : buildPaymentUrl(url, paymentData)
            return {
              type: 'qr',
              url: checkoutUrl,
              qrValue,
              paymentMethod: paymentType,
            }
          }
        }

        return null
      } catch (_error) {
        toast.error(i18next.t('Payment request failed'))
        return null
      } finally {
        setProcessing(false)
      }
    },
    [buildPaymentUrl, getQrValue]
  )

  return {
    amount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
    setAmount,
  }
}
