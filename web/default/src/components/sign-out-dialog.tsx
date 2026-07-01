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
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { logout } from '@/features/auth/api'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const { t } = useTranslation()
  const { auth } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await logout()
    } catch {
      /* empty */
    }
    auth.reset()
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('uid')
      }
    } catch {
      /* empty */
    }
    toast.success(t('Signed out'))
    // Refresh the page to clear all state and update UI
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/98 p-0 shadow-[0_22px_70px_rgba(15,23,42,0.16),0_1px_0_rgba(255,255,255,0.9)_inset] sm:max-w-[23rem] dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-[0_24px_80px_rgba(0,0,0,0.58),0_1px_0_rgba(255,255,255,0.08)_inset]'>
        <div className='px-5 pt-5 pb-4 sm:px-5'>
          <AlertDialogHeader className='min-w-0 gap-2 text-left'>
            <div className='flex items-center gap-2.5'>
              <span className='flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-200/70 bg-red-50 text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300'>
                <LogOut className='size-4' />
              </span>
              <AlertDialogTitle className='text-base leading-6 font-semibold tracking-normal text-slate-950 dark:text-slate-50'>
                {t('Sign out')}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className='pl-10 text-sm leading-6 text-slate-500 dark:text-slate-400'>
              {t('Sign out')}
              ：
              {t(
                'Are you sure you want to sign out? You will need to sign in again to access your account.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter className='mx-0 mb-0 flex-row items-center justify-end gap-2 border-t border-slate-200/70 bg-slate-50/55 px-5 py-3 dark:border-white/10 dark:bg-white/[0.025]'>
          <AlertDialogCancel className='mt-0 h-8 rounded-lg border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-none transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'>
            {t('Cancel')}
          </AlertDialogCancel>
          <Button
            className='h-8 rounded-lg border border-red-500 bg-red-500 px-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(239,68,68,0.18)] transition-colors hover:border-red-600 hover:bg-red-600 dark:border-red-400/70 dark:bg-red-500/90 dark:hover:bg-red-400'
            onClick={handleSignOut}
          >
            {t('Sign out')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
