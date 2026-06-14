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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Settings, Key, Wallet, MessageSquare, Home } from 'lucide-react'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Skeleton } from '@/components/ui/skeleton'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitch } from '@/components/theme-switch'

type AuthLayoutProps = {
  children: React.ReactNode
}

const sidebarNavItems = [
  { icon: Home, label: 'Home' },
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: MessageSquare, label: 'Chat' },
  { icon: Key, label: 'API Keys' },
  { icon: Wallet, label: 'Wallet' },
  { icon: Settings, label: 'Settings' },
]

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='flex h-svh w-full overflow-hidden'>
      {/* Left Sidebar */}
      <div className='bg-zinc-900 dark:bg-zinc-950 relative hidden w-[280px] shrink-0 flex-col overflow-hidden md:flex'>
        {/* Background gradient */}
        <div className='from-primary/10 absolute inset-0 bg-gradient-to-b to-transparent' />

        {/* Brand */}
        <Link to='/' className='relative z-10 flex items-center gap-3 px-8 pt-10 pb-8'>
          <div className='relative h-9 w-9 shrink-0 overflow-hidden rounded-xl'>
            {loading ? (
              <Skeleton className='absolute inset-0 rounded-xl' />
            ) : (
              <img
                src={logo}
                alt={t('Logo')}
                className='h-full w-full rounded-xl object-cover'
              />
            )}
          </div>
          {loading ? (
            <Skeleton className='h-6 w-24' />
          ) : (
            <span className='text-lg font-semibold text-white'>{systemName}</span>
          )}
        </Link>

        {/* Nav items */}
        <nav className='relative z-10 flex-1 space-y-1 px-4'>
          {sidebarNavItems.map((item) => (
            <div
              key={item.label}
              className='text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 flex cursor-default items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors'
            >
              <item.icon className='h-5 w-5 shrink-0' />
              <span>{t(item.label)}</span>
            </div>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className='relative z-10 flex items-center gap-2 border-t border-zinc-800 px-4 py-4'>
          <ThemeSwitch />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Right Content Area */}
      <div className='bg-background flex flex-1 flex-col'>
        {/* Mobile header */}
        <div className='flex items-center gap-2 px-4 pt-4 md:hidden'>
          <Link to='/' className='flex items-center gap-2'>
            <div className='relative h-8 w-8 shrink-0 overflow-hidden rounded-lg'>
              {!loading && (
                <img
                  src={logo}
                  alt={t('Logo')}
                  className='h-full w-full rounded-lg object-cover'
                />
              )}
            </div>
            {!loading && (
              <span className='text-sm font-semibold'>{systemName}</span>
            )}
          </Link>
          <div className='ml-auto flex items-center gap-1'>
            <ThemeSwitch />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Form content */}
        <div className='flex flex-1 items-center justify-center px-4 py-8 sm:px-8 md:px-12 lg:px-16'>
          <div className='w-full max-w-[420px]'>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
