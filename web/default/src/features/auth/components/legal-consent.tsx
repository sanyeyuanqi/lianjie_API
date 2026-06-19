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
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { getPrivacyPolicy, getUserAgreement } from '@/features/legal/api'
import type { SystemStatus } from '../types'
import { LegalDocumentDialog } from './legal-document-dialog'

interface LegalConsentProps {
  status: SystemStatus | null
  checked: boolean
  onCheckedChange: (nextValue: boolean) => void
  className?: string
}

export function LegalConsent({
  status,
  checked,
  onCheckedChange,
  className,
}: LegalConsentProps) {
  const { t } = useTranslation()
  const [activeDocument, setActiveDocument] = useState<
    'user-agreement' | 'privacy-policy' | null
  >(null)
  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)

  if (!hasUserAgreement && !hasPrivacyPolicy) {
    return null
  }

  const handleChange = (value: boolean) => {
    onCheckedChange(value === true)
  }

  return (
    <>
      <div
        className={cn(
          'border-border/60 bg-muted/40 flex items-start gap-3 rounded-md border p-3',
          className
        )}
      >
        <Checkbox
          id='legal-consent'
          checked={checked}
          onCheckedChange={handleChange}
          className={cn(
            'mt-0.5 size-5 rounded-md dark:border-white/35',
            checked &&
              'border-slate-700 bg-slate-700 text-white shadow-sm dark:border-white/80 dark:bg-slate-700 dark:text-white dark:ring-2 dark:ring-white/20 [&_[data-slot=checkbox-indicator]]:text-white [&_[data-slot=checkbox-indicator]>svg]:size-4 [&_[data-slot=checkbox-indicator]>svg]:text-white [&_[data-slot=checkbox-indicator]>svg]:stroke-[3]'
          )}
        />
        <Label
          htmlFor='legal-consent'
          className='text-muted-foreground items-start gap-1 text-left text-xs leading-5 font-normal'
        >
          <span>
            {t('I have read and agree to the')}{' '}
            {hasUserAgreement && (
              <button
                type='button'
                className='text-primary cursor-pointer p-0 align-baseline hover:underline'
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setActiveDocument('user-agreement')
                }}
              >
                {t('User Agreement')}
              </button>
            )}
            {hasUserAgreement && hasPrivacyPolicy && ' and the '}
            {hasPrivacyPolicy && (
              <button
                type='button'
                className='text-primary cursor-pointer p-0 align-baseline hover:underline'
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setActiveDocument('privacy-policy')
                }}
              >
                {t('Privacy Policy')}
              </button>
            )}
            .
          </span>
        </Label>
      </div>

      {hasUserAgreement && (
        <LegalDocumentDialog
          open={activeDocument === 'user-agreement'}
          onOpenChange={(open) => {
            if (!open) setActiveDocument(null)
          }}
          queryKey='user-agreement'
          fetchDocument={getUserAgreement}
          emptyMessage={t(
            'The administrator has not configured a user agreement yet.'
          )}
        />
      )}
      {hasPrivacyPolicy && (
        <LegalDocumentDialog
          open={activeDocument === 'privacy-policy'}
          onOpenChange={(open) => {
            if (!open) setActiveDocument(null)
          }}
          queryKey='privacy-policy'
          fetchDocument={getPrivacyPolicy}
          emptyMessage={t(
            'The administrator has not configured a privacy policy yet.'
          )}
        />
      )}
    </>
  )
}
