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
import { useNavigate } from '@tanstack/react-router'
import { User, Wallet, LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { getUserAvatarFallback, getUserAvatarStyle } from '@/lib/avatar'
import { ROLE } from '@/lib/roles'
import { useDialogState } from '@/hooks/use-dialog'
import { useUserDisplay } from '@/hooks/use-user-display'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'

const avatarFallbackClassName = 'font-semibold text-white'

interface ProfileDropdownProps {
  showName?: boolean
  nameMode?: 'display' | 'username'
  className?: string
}

export function ProfileDropdown(props: ProfileDropdownProps = {}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useDialogState()
  const user = useAuthStore((state) => state.auth.user)
  const { displayName, roleLabel } = useUserDisplay(user)
  const triggerName =
    props.nameMode === 'username' ? user?.username || displayName : displayName
  const isSuperAdmin = user?.role === ROLE.SUPER_ADMIN
  const avatarName = user?.username || displayName
  const avatarFallback = getUserAvatarFallback(avatarName)
  const avatarFallbackStyle = getUserAvatarStyle(avatarName)

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              className={cn(
                'relative h-8 rounded-lg px-2 text-slate-700 hover:bg-slate-950/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.06]',
                props.showName ? 'max-w-[180px] gap-2' : 'size-6 p-0',
                props.className
              )}
            />
          }
        >
          {props.showName ? (
            <span className='relative z-10 truncate text-sm font-medium'>
              {triggerName}
            </span>
          ) : (
            <Avatar className='size-6'>
              <AvatarFallback
                className={`${avatarFallbackClassName} text-[11px]`}
                style={avatarFallbackStyle}
              >
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='end'
          sideOffset={12}
          className='w-64 overflow-hidden rounded-[1.25rem] border border-slate-200/75 bg-white/92 p-2 shadow-[0_22px_70px_rgba(15,23,42,0.16),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 dark:border-white/10 dark:bg-zinc-950/92 dark:shadow-[0_24px_76px_rgba(0,0,0,0.58),0_1px_0_rgba(255,255,255,0.08)_inset]'
        >
          <div className='relative overflow-hidden rounded-2xl border border-slate-200/65 bg-[linear-gradient(135deg,rgba(248,250,252,0.96)_0%,rgba(255,255,255,0.76)_52%,rgba(224,242,254,0.72)_100%)] px-3 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(39,39,42,0.78)_0%,rgba(9,9,11,0.88)_58%,rgba(8,47,73,0.46)_100%)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)]'>
            <div className='pointer-events-none absolute -top-10 -right-8 size-24 rounded-full bg-cyan-300/18 blur-2xl dark:bg-cyan-300/10' />
            <div className='relative flex flex-1 flex-col gap-1 overflow-hidden'>
              <p className='truncate text-[15px] font-bold text-slate-950 dark:text-slate-50'>
                {displayName}
              </p>
              <div className='flex min-w-0 items-center gap-1.5'>
                <span className='rounded-full bg-slate-950/[0.06] px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300'>
                  {roleLabel}
                </span>
                {user?.group && (
                  <span className='min-w-0 truncate rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-400/12 dark:text-sky-200'>
                    {String(user.group)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className='mx-2 my-2 bg-slate-200/65 dark:bg-white/10' />

          <DropdownMenuItem
            className='group h-10 cursor-pointer gap-2.5 rounded-xl px-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:translate-x-0.5 hover:bg-slate-100/90 focus:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-white/8 dark:focus:bg-white/8'
            onClick={() => navigate({ to: '/profile' })}
          >
            <User className='size-4 text-slate-500 transition-colors group-hover:text-slate-950 dark:text-slate-400 dark:group-hover:text-white' />
            {t('Profile')}
          </DropdownMenuItem>

          <DropdownMenuItem
            className='group h-10 cursor-pointer gap-2.5 rounded-xl px-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:translate-x-0.5 hover:bg-slate-100/90 focus:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-white/8 dark:focus:bg-white/8'
            onClick={() => navigate({ to: '/wallet' })}
          >
            <Wallet className='size-4 text-slate-500 transition-colors group-hover:text-slate-950 dark:text-slate-400 dark:group-hover:text-white' />
            {t('Wallet')}
          </DropdownMenuItem>

          {isSuperAdmin && (
            <DropdownMenuItem
              className='group h-10 cursor-pointer gap-2.5 rounded-xl px-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:translate-x-0.5 hover:bg-slate-100/90 focus:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-white/8 dark:focus:bg-white/8'
              onClick={() =>
                navigate({
                  to: '/system-settings/site/$section',
                  params: { section: 'system-info' },
                })
              }
            >
              <Settings className='size-4 text-slate-500 transition-colors group-hover:text-slate-950 dark:text-slate-400 dark:group-hover:text-white' />
              {t('System Settings')}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className='mx-2 my-2 bg-slate-200/65 dark:bg-white/10' />

          <DropdownMenuItem
            className='group h-10 cursor-pointer gap-2.5 rounded-xl px-3 text-sm font-semibold text-red-600 transition-all duration-200 hover:translate-x-0.5 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10'
            variant='destructive'
            onClick={() => setOpen(true)}
          >
            <LogOut className='size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
            {t('Sign out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
