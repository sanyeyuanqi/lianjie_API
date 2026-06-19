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
import { useCallback } from 'react'
import {
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
} from '@/i18n/languages'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function TranslationIcon() {
  return (
    <svg
      viewBox='0 0 32 32'
      className='size-6'
      aria-hidden='true'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <rect
        x='12'
        y='11'
        width='17'
        height='17'
        rx='4.5'
        className='fill-white stroke-slate-950 dark:fill-zinc-900 dark:stroke-zinc-100'
        strokeWidth='1.8'
      />
      <rect
        x='3'
        y='3'
        width='17'
        height='17'
        rx='4.5'
        className='fill-white stroke-slate-950 dark:fill-zinc-900 dark:stroke-zinc-100'
        strokeWidth='1.8'
      />
      <text
        x='11.5'
        y='16.2'
        textAnchor='middle'
        className='fill-slate-950 text-[12px] font-semibold dark:fill-zinc-100'
      >
        A
      </text>
      <text
        x='20.5'
        y='24.5'
        textAnchor='middle'
        className='fill-slate-950 text-[11px] font-semibold dark:fill-zinc-100'
      >
        文
      </text>
      <path
        d='M25.5 1.5c.45 2.25 1.75 3.55 4 4-2.25.45-3.55 1.75-4 4-.45-2.25-1.75-3.55-4-4 2.25-.45 3.55-1.75 4-4Z'
        className='fill-slate-950 dark:fill-cyan-300'
      />
      <path
        d='M5.5 22c.35 1.75 1.35 2.75 3.1 3.1-1.75.35-2.75 1.35-3.1 3.1-.35-1.75-1.35-2.75-3.1-3.1 1.75-.35 2.75-1.35 3.1-3.1Z'
        className='fill-slate-950 dark:fill-cyan-300'
      />
    </svg>
  )
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const currentLanguage = normalizeInterfaceLanguage(i18n.language)

  const handleChangeLanguage = useCallback(
    async (code: string) => {
      await i18n.changeLanguage(code)
      if (user) {
        try {
          await api.put('/api/user/self', { language: code })
        } catch {
          // Best-effort persistence; don't block the UI on failure
        }
      }
    },
    [i18n, user]
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-lg text-slate-950 hover:bg-slate-100 dark:text-zinc-100 dark:hover:bg-zinc-800/70'
          />
        }
      >
        <TranslationIcon />
        <span className='sr-only'>{t('Change language')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        sideOffset={8}
        className='w-36 min-w-36 p-1.5'
      >
        {INTERFACE_LANGUAGE_OPTIONS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChangeLanguage(lang.code)}
            className='h-8 px-2'
          >
            {lang.label}
            <Check
              size={14}
              className={cn(
                'ms-auto',
                currentLanguage !== lang.code && 'hidden'
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
