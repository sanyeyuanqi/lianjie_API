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
          sideOffset={8}
          className='w-[220px] overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_14px_42px_rgba(15,23,42,0.14)] backdrop-blur-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-[0_18px_52px_rgba(0,0,0,0.46)]'
        >
          <div className='flex items-center rounded-lg bg-slate-50/85 px-2.5 py-2 dark:bg-white/[0.045]'>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold text-slate-950 dark:text-slate-50'>
                {displayName}
              </p>
              <p className='truncate text-xs text-slate-500 dark:text-slate-400'>
                {roleLabel}
                {user?.group ? ` · ${String(user.group)}` : ''}
              </p>
            </div>
          </div>

          <DropdownMenuSeparator className='my-1.5 bg-slate-200/70 dark:bg-white/10' />

          <DropdownMenuItem
            className='group h-8 cursor-pointer gap-2 rounded-lg px-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100/90 focus:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-white/8 dark:focus:bg-white/8'
            onClick={() => navigate({ to: '/profile' })}
          >
            <User className='size-4 text-slate-500 transition-colors group-hover:text-slate-950 dark:text-slate-400 dark:group-hover:text-white' />
            {t('Profile')}
          </DropdownMenuItem>

          <DropdownMenuItem
            className='group h-8 cursor-pointer gap-2 rounded-lg px-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100/90 focus:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-white/8 dark:focus:bg-white/8'
            onClick={() => navigate({ to: '/wallet' })}
          >
            <Wallet className='size-4 text-slate-500 transition-colors group-hover:text-slate-950 dark:text-slate-400 dark:group-hover:text-white' />
            {t('Wallet')}
          </DropdownMenuItem>

          {isSuperAdmin && (
            <DropdownMenuItem
              className='group h-8 cursor-pointer gap-2 rounded-lg px-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100/90 focus:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-white/8 dark:focus:bg-white/8'
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

          <DropdownMenuSeparator className='my-1.5 bg-slate-200/70 dark:bg-white/10' />

          <DropdownMenuItem
            className='group h-8 cursor-pointer gap-2 rounded-lg px-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10'
            variant='destructive'
            onClick={() => setOpen(true)}
          >
            <LogOut className='size-4' />
            {t('Sign out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
