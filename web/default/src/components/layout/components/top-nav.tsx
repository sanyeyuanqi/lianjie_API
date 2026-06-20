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
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_SYSTEM_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/dialog'
import { type TopNavLink } from '../types'

const AUTH_PROMPT_SECONDS = 5

type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: TopNavLink[]
  expanded?: boolean
  showMobileMenu?: boolean
  showDesktopNav?: boolean
  mobileMenuClassName?: string
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
  showMobileMenu = true,
  showDesktopNav = true,
  mobileMenuClassName,
  ...props
}: TopNavProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [authPromptTarget, setAuthPromptTarget] = useState<TopNavLink | null>(
    null
  )
  const [mobileOpen, setMobileOpen] = useState(false)
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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

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

  const mobileDrawer =
    showMobileMenu && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={cn(
              'fixed inset-0 z-[70] transition-colors duration-150 lg:hidden',
              mobileOpen
                ? 'pointer-events-auto bg-slate-950/18 backdrop-blur-[1px] dark:bg-black/40'
                : 'pointer-events-none bg-transparent'
            )}
            onClick={() => setMobileOpen(false)}
          >
            <div
              className={cn(
                'absolute top-2 right-2 bottom-2 flex w-[min(70vw,18rem)] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/94 shadow-[-18px_18px_58px_rgba(15,23,42,0.20),0_1px_0_rgba(255,255,255,0.86)_inset] backdrop-blur-2xl transition-transform duration-200 ease-out dark:border-white/10 dark:bg-zinc-950/94 dark:shadow-[-18px_18px_64px_rgba(0,0,0,0.58),0_1px_0_rgba(255,255,255,0.08)_inset]',
                mobileOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div className='flex items-start justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/10'>
                <div className='min-w-0'>
                  <p className='text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500'>
                    {t('Navigation')}
                  </p>
                  <p className='mt-1 truncate text-sm font-semibold text-slate-950 dark:text-slate-50'>
                    {DEFAULT_SYSTEM_NAME}
                  </p>
                </div>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  className='-mt-1 -mr-2 size-8 rounded-lg text-slate-500 hover:bg-slate-950/[0.05] hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white'
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('Close')}
                >
                  <X className='size-4' />
                </Button>
              </div>

              <nav className='mx-3 mt-3 flex flex-col gap-1 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-1.5 dark:border-white/10 dark:bg-white/[0.04]'>
                {normalizedLinks.map(
                  ({ title, href, isActive, disabled, external, requiresAuth }) => {
                    const linkClassName = cn(
                      'flex h-11 items-center rounded-xl px-3.5 text-[15px] font-medium tracking-tight transition-all duration-150 ease-out',
                      mobileOpen
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-2 opacity-0',
                      isActive
                        ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80 dark:bg-white/10 dark:text-white dark:ring-white/10'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100',
                      disabled && 'pointer-events-none opacity-50'
                    )

                    if (external) {
                      return (
                        <a
                          key={`${title}-${href}`}
                          href={href}
                          target='_blank'
                          rel='noopener noreferrer'
                          className={linkClassName}
                          onClick={(event) => {
                            handleLinkClick(event, {
                              title,
                              href,
                              disabled,
                              external,
                              requiresAuth,
                            })
                            if (!disabled && !requiresAuth) setMobileOpen(false)
                          }}
                        >
                          {title}
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={`${title}-${href}`}
                        to={href}
                        disabled={disabled}
                        className={linkClassName}
                        onClick={(event) => {
                          handleLinkClick(event, {
                            title,
                            href,
                            disabled,
                            external,
                            requiresAuth,
                          })
                          if (!disabled && !requiresAuth) setMobileOpen(false)
                        }}
                      >
                        {title}
                      </Link>
                    )
                  }
                )}
              </nav>

              <div
                className={cn(
                  'mt-auto border-t border-slate-200/70 p-4 transition-all duration-150 ease-out dark:border-white/10',
                  mobileOpen
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-2 opacity-0'
                )}
              >
                <Link
                  to='/dashboard'
                  onClick={() => setMobileOpen(false)}
                  className='inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] transition-colors hover:bg-slate-800 active:bg-slate-950 dark:bg-white dark:text-slate-950 dark:shadow-[0_12px_30px_rgba(0,0,0,0.42)] dark:hover:bg-slate-200'
                >
                  {t('Go to Dashboard')}
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      {/* 移动端右侧抽屉菜单 */}
      <div className={cn('lg:hidden', !showMobileMenu && 'hidden')}>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className={cn(
            'size-9 rounded-xl text-slate-700 hover:bg-slate-950/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.06]',
            mobileMenuClassName
          )}
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={t('Toggle navigation menu')}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className='size-4' /> : <Menu className='size-4' />}
        </Button>
      </div>
      {mobileDrawer}

      {/* 桌面端水平导航 */}
      <nav
        className={cn(
          'absolute top-1/2 left-1/2 hidden h-8 min-w-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1 rounded-lg border-transparent bg-transparent p-0 shadow-none backdrop-blur-none transition-[width,max-width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:inline-flex dark:border-transparent dark:bg-transparent',
          !showDesktopNav && 'lg:hidden',
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
