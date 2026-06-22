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
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  contentClassName?: string
  sidebarTrigger?: React.ReactNode
}

export function Header({
  className,
  contentClassName,
  sidebarTrigger,
  children,
  ...props
}: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 h-[var(--app-header-height,3rem)] w-full shrink-0 bg-transparent',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-full items-center gap-1.5 px-2 sm:gap-2 sm:px-3',
          contentClassName
        )}
      >
        {sidebarTrigger ?? (
          <SidebarTrigger
            variant='ghost'
            mobileLabel='目录'
            className='h-9 w-auto shrink-0 gap-1.5 rounded-lg bg-transparent px-2 text-sm font-semibold text-slate-700 hover:bg-slate-950/[0.05] md:size-8 md:px-0 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/[0.06]'
          />
        )}
        {children}
      </div>
    </header>
  )
}
