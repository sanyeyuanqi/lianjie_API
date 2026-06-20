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

const baseClassName =
  'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-all'

const variantClassNames = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline:
    'border-border bg-background hover:bg-muted hover:text-foreground border',
}

type ErrorActionButtonProps = React.ComponentProps<'button'> & {
  variant?: keyof typeof variantClassNames
}

export function ErrorActionButton({
  className,
  variant = 'default',
  type = 'button',
  ...props
}: ErrorActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseClassName, variantClassNames[variant], className)}
      {...props}
    />
  )
}

type ErrorActionLinkProps = React.ComponentProps<'a'> & {
  variant?: keyof typeof variantClassNames
}

export function ErrorActionLink({
  className,
  variant = 'default',
  ...props
}: ErrorActionLinkProps) {
  return (
    <a
      className={cn(baseClassName, variantClassNames[variant], className)}
      {...props}
    />
  )
}
