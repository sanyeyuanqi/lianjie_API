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
import { useMemo, useState, useCallback, useEffect } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog } from '@/components/dialog'
import { type TopNavLink } from '../types'

const AUTH_PROMPT_SECONDS = 5

type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: TopNavLink[]
  expanded?: boolean
}

function normalizePath(path: string) {
  if (path === '/') return path
  return path.replace(/\/+$/, '')
}

function isPathActive(currentPath: string, href: string) {
  const targetPath = normalizePath(href)

  if (targetPath === '/') {
    return currentPath === '/'
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

/**
 * 顶部导航栏组件
 * 在大屏幕显示水平导航，在小屏幕显示下拉菜单
 */
export function TopNav({
  className,
  links,
  expanded: _expanded = false,
  ...props
}: TopNavProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [authPromptTarget, setAuthPromptTarget] = useState<TopNavLink | null>(
    null
  )
  const [authPromptSecondsLeft, setAuthPromptSecondsLeft] =
    useState(AUTH_PROMPT_SECONDS)
  const currentPath = normalizePath(location.pathname)

  useEffect(() => {
    if (!authPromptTarget) return

    const intervalId = window.setInterval(() => {
      setAuthPromptSecondsLeft((seconds) => Math.max(seconds - 1, 0))
    }, 1000)

    const timeoutId = window.setTimeout(() => {
      const redirect = authPromptTarget.href
      setAuthPromptTarget(null)
      navigate({ to: '/sign-in', search: { redirect } })
    }, AUTH_PROMPT_SECONDS * 1000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [authPromptTarget, navigate])

  const handleLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, link: TopNavLink) => {
      if (link.disabled) {
        event.preventDefault()
        return
      }

      if (link.requiresAuth) {
        event.preventDefault()
        setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
        setAuthPromptTarget(link)
      }
    },
    []
  )

  const closeAuthPrompt = useCallback(() => {
    setAuthPromptTarget(null)
    setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
  }, [])

  const navigateToSignIn = useCallback(() => {
    const redirect = authPromptTarget?.href || '/'
    setAuthPromptTarget(null)
    navigate({ to: '/sign-in', search: { redirect } })
  }, [authPromptTarget?.href, navigate])

  // 规范化链接，确保所有可选属性都有默认值
  const normalizedLinks = useMemo(
    () =>
      links.map((link) => ({
        disabled: false,
        external: false,
        ...link,
        isActive: link.isActive ?? isPathActive(currentPath, link.href),
      })),
    [links, currentPath]
  )

  return (
    <>
      {/* 移动端下拉菜单 */}
      <div className='lg:hidden'>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={
              <Button
                size='icon'
                variant='outline'
                className='size-10 rounded-full border-slate-200/80 bg-white/70 shadow-none dark:border-white/10 dark:bg-white/[0.045]'
              />
            }
          >
            <Menu className='size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent side='bottom' align='start'>
            {normalizedLinks.map(
              ({ title, href, isActive, disabled, external, requiresAuth }) => (
                <DropdownMenuItem
                  key={`${title}-${href}`}
                  render={
                    external ? (
                      <a
                        href={href}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={!isActive ? 'text-muted-foreground' : ''}
                      >
                        {title}
                      </a>
                    ) : (
                      <Link
                        to={href}
                        className={!isActive ? 'text-muted-foreground' : ''}
                        onClick={(event) =>
                          handleLinkClick(event, {
                            title,
                            href,
                            disabled,
                            external,
                            requiresAuth,
                          })
                        }
                        disabled={disabled}
                      >
                        {title}
                      </Link>
                    )
                  }
                ></DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 桌面端水平导航 */}
      <nav
        className={cn(
          'absolute top-1/2 left-1/2 hidden h-8 min-w-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-lg border-transparent bg-transparent p-0 shadow-none backdrop-blur-none transition-[width,max-width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:inline-flex dark:border-transparent dark:bg-transparent',
          className
        )}
        {...props}
      >
        {normalizedLinks.map(
          ({ title, href, isActive, disabled, external, requiresAuth }) =>
            external ? (
              <a
                key={`${title}-${href}`}
                href={href}
                target='_blank'
                rel='noopener noreferrer'
                className={cn(
                  'inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                    : 'text-slate-500 hover:bg-slate-950/[0.045] hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.075] dark:hover:text-white'
                )}
              >
                {title}
              </a>
            ) : (
              <Link
                key={`${title}-${href}`}
                to={href}
                disabled={disabled}
                onClick={(event) =>
                  handleLinkClick(event, {
                    title,
                    href,
                    disabled,
                    external,
                    requiresAuth,
                  })
                }
                className={cn(
                  'inline-flex h-7 items-center rounded-lg px-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                    : 'text-slate-500 hover:bg-slate-950/[0.045] hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.075] dark:hover:text-white',
                  disabled && 'pointer-events-none opacity-50'
                )}
              >
                {title}
              </Link>
            )
        )}
      </nav>
      <Dialog
        open={!!authPromptTarget}
        onOpenChange={(open) => {
          if (!open) {
            closeAuthPrompt()
          }
        }}
        title={t('Sign in required')}
        description={t('Please sign in to view {{module}}.', {
          module: authPromptTarget?.title || '',
        })}
        contentClassName='sm:max-w-md'
        contentHeight='auto'
        footer={
          <>
            <Button variant='outline' onClick={closeAuthPrompt}>
              {t('Cancel')}
            </Button>
            <Button onClick={navigateToSignIn}>{t('Sign in now')}</Button>
          </>
        }
      >
        <div className='bg-muted/40 text-muted-foreground rounded-lg px-3 py-2 text-sm'>
          {t('Redirecting to sign in in {{seconds}} seconds.', {
            seconds: authPromptSecondsLeft,
          })}
        </div>
      </Dialog>
    </>
  )
}
