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
import { Link, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useStatus } from '@/hooks/use-status'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { t } = useTranslation()
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const { status } = useStatus()

  return (
    <AuthLayout>
      <div className='w-full space-y-6'>
        <div className='space-y-1.5 text-center'>
          <h2 className='text-[1.65rem] leading-tight font-semibold tracking-normal text-slate-950 sm:text-[1.75rem] dark:text-slate-50'>
            {t('Log in')}
          </h2>
          <p className='text-sm leading-relaxed text-slate-500 dark:text-slate-400'>
            {t('Log in to your account to continue')}
          </p>
        </div>

        <UserAuthForm redirectTo={redirect} />

        {!status?.self_use_mode_enabled &&
          status?.register_enabled !== false && (
            <p className='text-center text-sm text-slate-500 dark:text-slate-400'>
              {t("Don't have an account?")}{' '}
              <Link
                to='/sign-up'
                className='font-semibold text-slate-950 underline underline-offset-4 transition-colors hover:text-slate-700 dark:text-slate-100 dark:hover:text-white'
              >
                {t('Sign up')}
              </Link>
            </p>
          )}
      </div>
    </AuthLayout>
  )
}
