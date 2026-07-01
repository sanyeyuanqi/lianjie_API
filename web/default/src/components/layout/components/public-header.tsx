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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog } from '@/components/dialog'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { defaultTopNavLinks } from '../config/top-nav.config'
import type { TopNavLink } from '../types'

const AUTH_PROMPT_SECONDS = 5
const publicHeaderToolButtonClass =
  'size-8 rounded-full text-slate-600 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-white/90 hover:text-slate-950 hover:shadow-[0_8px_18px_rgba(15,23,42,0.10)] data-popup-open:bg-white/90 dark:text-slate-300 dark:hover:bg-white/12 dark:hover:text-white dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.28)]'
const publicHeaderProfileButtonClass =
  'group relative !h-8 !w-auto max-w-[7rem] overflow-hidden !rounded-full border border-slate-200/80 bg-white/70 px-3 text-[12px] font-semibold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.08)] ring-1 ring-white/60 transition-all duration-200 ease-out before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.26)_55%,rgba(14,165,233,0.12)_100%)] before:opacity-0 before:transition-opacity before:duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-slate-300 hover:bg-white/90 hover:text-slate-950 hover:shadow-[0_10px_24px_rgba(15,23,42,0.13)] hover:before:opacity-100 data-popup-open:bg-white/90 sm:max-w-[10rem] dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:ring-white/8 dark:before:bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.06)_55%,rgba(34,211,238,0.12)_100%)] dark:hover:border-white/18 dark:hover:bg-white/14 dark:hover:text-white dark:hover:shadow-[0_10px_24px_rgba(0,0,0,0.32)]'

type AuthPromptTarget = {
  title: string
  href: string
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

export interface PublicHeaderProps {
  navLinks?: TopNavLink[]
  mobileLinks?: TopNavLink[]
  navContent?: React.ReactNode
  showThemeSwitch?: boolean
  showLanguageSwitcher?: boolean
  logo?: React.ReactNode
  siteName?: string
  homeUrl?: string
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  mobileLeadingContent?: React.ReactNode
  hideMobileBrand?: boolean
  showNavigation?: boolean
  showAuthButtons?: boolean
  showNotifications?: boolean
  className?: string
}

export function PublicHeader(props: PublicHeaderProps) {
  const {
    navLinks = defaultTopNavLinks,
    showThemeSwitch = true,
    showLanguageSwitcher = true,
    siteName: customSiteName,
    homeUrl = '/',
    showAuthButtons = true,
    showNotifications = true,
  } = props

  const { t } = useTranslation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(min-width: 640px)').matches
  )
  const [authPromptTarget, setAuthPromptTarget] =
    useState<AuthPromptTarget | null>(null)
  const [authPromptSecondsLeft, setAuthPromptSecondsLeft] =
    useState(AUTH_PROMPT_SECONDS)
  const { auth } = useAuthStore()
  const { systemName, logo: systemLogo, loading } = useSystemConfig()
  const dynamicLinks = useTopNavLinks()
  const notifications = useNotifications({
    enabled: showNotifications,
  })
  const setNotificationPopoverOpenRef = useRef(notifications.setPopoverOpen)
  const routerState = useRouterState()
  const pathname = normalizePath(routerState.location.pathname)

  const user = auth.user
  const isAuthenticated = !!user
  const displaySiteName = customSiteName || systemName
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  const navItems = useMemo(
    () =>
      links.map((link) => ({
        ...link,
        translatedTitle: t(link.title),
        isActive: isPathActive(pathname, link.href),
      })),
    [links, pathname, t]
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setNotificationPopoverOpenRef.current = notifications.setPopoverOpen
  }, [notifications.setPopoverOpen])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)')
    const handleChange = () => {
      setIsDesktop(mediaQuery.matches)
      setNotificationPopoverOpenRef.current(false)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

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

  const closeAuthPrompt = useCallback(() => {
    setAuthPromptTarget(null)
    setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
  }, [])

  const navigateToSignIn = useCallback(() => {
    const redirect = authPromptTarget?.href || '/'
    setAuthPromptTarget(null)
    navigate({ to: '/sign-in', search: { redirect } })
  }, [authPromptTarget?.href, navigate])

  const handleNavLinkClick = useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement>,
      link: TopNavLink,
      closeMobile = false
    ) => {
      if (link.disabled) {
        event.preventDefault()
        return
      }

      if (link.requiresAuth) {
        event.preventDefault()
        if (closeMobile) {
          setMobileOpen(false)
        }
        setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
        setAuthPromptTarget({
          title: t(link.title),
          href: link.href,
        })
        return
      }

      if (closeMobile) {
        setMobileOpen(false)
      }
    },
    [t]
  )

  return (
    <>
      <header className='pointer-events-none fixed inset-x-0 top-0 z-50'>
        <div
          className={cn(
            'pointer-events-auto mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
            scrolled ? 'px-0 pt-2' : 'max-w-[1480px] px-4 pt-3 md:px-6'
          )}
          style={
            scrolled
              ? {
                  width: 'min(1120px, calc(100vw - 3rem))',
                }
              : undefined
          }
        >
          <nav
            className={cn(
              'relative flex items-center justify-between border backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
              scrolled
                ? 'h-10 rounded-xl border-slate-200/80 bg-white/82 pr-1.5 pl-3 shadow-[0_14px_44px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-zinc-950/82 dark:shadow-[0_14px_48px_rgba(0,0,0,0.56)]'
                : 'h-12 rounded-xl border-slate-200/70 bg-white/62 px-2.5 shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950/58 dark:shadow-[0_14px_46px_rgba(0,0,0,0.42)]'
            )}
          >
            {props.mobileLeadingContent && (
              <div className='flex shrink-0 items-center sm:hidden'>
                {props.mobileLeadingContent}
              </div>
            )}

            {/* Logo */}
            <Link
              to={homeUrl}
              className={cn(
                'group shrink-0 items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.05]',
                props.hideMobileBrand ? 'hidden sm:flex' : 'flex'
              )}
            >
              {loading ? (
                <Skeleton className='size-6 rounded-md' />
              ) : props.logo ? (
                props.logo
              ) : (
                <span className='flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md'>
                  <img
                    src={systemLogo}
                    alt={t('Logo')}
                    className='size-full object-contain'
                  />
                </span>
              )}
              <span className='text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100'>
                {loading ? <Skeleton className='h-4 w-16' /> : displaySiteName}
              </span>
            </Link>

            {/* Desktop nav */}
            <div className='absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-white/35 p-0.5 ring-1 ring-slate-200/45 backdrop-blur-sm sm:flex dark:bg-white/[0.03] dark:ring-white/8'>
              {navItems.map((link) => {
                if (link.external) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-disabled={link.disabled}
                      tabIndex={link.disabled ? -1 : undefined}
                      onClick={(event) => handleNavLinkClick(event, link)}
                      className={cn(
                        'inline-flex h-7 items-center justify-center rounded-full px-3 text-[12px] leading-none font-semibold text-slate-500 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/85 hover:text-slate-950 hover:shadow-[0_8px_18px_rgba(15,23,42,0.10)] active:translate-y-0 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.28)]',
                        link.disabled && 'pointer-events-none opacity-50'
                      )}
                    >
                      {link.translatedTitle}
                    </a>
                  )
                }
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    disabled={link.disabled}
                    onClick={(event) => handleNavLinkClick(event, link)}
                    className={cn(
                      'inline-flex h-7 items-center justify-center rounded-full px-3 text-[12px] leading-none font-semibold transition-all duration-200 ease-out active:translate-y-0',
                      link.isActive
                        ? 'scale-[1.02] bg-[linear-gradient(135deg,#020617_0%,#111827_52%,#1e293b_100%)] text-white shadow-[0_10px_24px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.16)] ring-1 ring-slate-950/10 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.26),inset_0_1px_0_rgba(255,255,255,0.20)] dark:bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#e2e8f0_100%)] dark:text-slate-950 dark:shadow-[0_10px_26px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.85)] dark:ring-white/15'
                        : 'text-slate-500 hover:-translate-y-0.5 hover:bg-white/85 hover:text-slate-950 hover:shadow-[0_8px_18px_rgba(15,23,42,0.10)] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100 dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.28)]',
                      link.disabled && 'pointer-events-none opacity-50'
                    )}
                  >
                    {link.translatedTitle}
                  </Link>
                )
              })}
            </div>

            <div className='ml-auto hidden items-center gap-1.5 sm:flex'>
              {(showLanguageSwitcher ||
                showThemeSwitch ||
                (showNotifications && isDesktop)) && (
                <div className='flex items-center gap-0.5 rounded-full bg-white/35 p-0.5 ring-1 ring-slate-200/45 backdrop-blur-sm dark:bg-white/[0.03] dark:ring-white/8'>
                  {showLanguageSwitcher && (
                    <LanguageSwitcher className={publicHeaderToolButtonClass} />
                  )}
                  {showThemeSwitch && (
                    <ThemeSwitch className={publicHeaderToolButtonClass} />
                  )}
                  {showNotifications && isDesktop && (
                    <NotificationPopover
                      open={notifications.popoverOpen}
                      onOpenChange={notifications.setPopoverOpen}
                      unreadCount={notifications.unreadCount}
                      activeTab={notifications.activeTab}
                      onTabChange={notifications.setActiveTab}
                      notice={notifications.notice}
                      announcements={notifications.announcements}
                      loading={notifications.loading}
                      onCloseToday={notifications.closeToday}
                      singleTabMode={notifications.isAutoPrompt}
                      className={publicHeaderToolButtonClass}
                    />
                  )}
                </div>
              )}

              {showAuthButtons && (
                <>
                  <div className='mx-1 h-5 w-px bg-slate-200/80 dark:bg-white/10' />
                  {loading ? (
                    <Skeleton className='h-8 w-20 rounded-lg' />
                  ) : isAuthenticated ? (
                    <ProfileDropdown
                      showName
                      nameMode='username'
                      className={publicHeaderProfileButtonClass}
                    />
                  ) : (
                    <Link
                      to='/sign-in'
                      className='inline-flex h-8 min-w-14 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 px-3.5 text-[12px] leading-none font-semibold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:text-slate-950 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:hover:border-white/18 dark:hover:bg-white/14 dark:hover:text-white'
                    >
                      {t('Sign in')}
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Mobile: keep the utility actions visible beside the menu. */}
            <div className='ml-auto flex min-w-0 items-center gap-1 sm:hidden'>
              {showLanguageSwitcher && <LanguageSwitcher />}
              {showThemeSwitch && <ThemeSwitch />}
              {showNotifications && !isDesktop && (
                <NotificationPopover
                  open={notifications.popoverOpen}
                  onOpenChange={notifications.setPopoverOpen}
                  unreadCount={notifications.unreadCount}
                  activeTab={notifications.activeTab}
                  onTabChange={notifications.setActiveTab}
                  notice={notifications.notice}
                  announcements={notifications.announcements}
                  loading={notifications.loading}
                  onCloseToday={notifications.closeToday}
                  singleTabMode={notifications.isAutoPrompt}
                />
              )}
              {showAuthButtons && !loading && isAuthenticated && (
                <ProfileDropdown
                  showName
                  nameMode='username'
                  className='max-w-[92px]'
                />
              )}
              <button
                type='button'
                className='inline-flex size-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-950/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.06]'
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={t('Toggle navigation menu')}
              >
                <div className='relative size-4'>
                  <span
                    className={cn(
                      'absolute inset-x-0 block h-[1.5px] origin-center rounded-full bg-current transition-all duration-300',
                      mobileOpen ? 'top-[7px] rotate-45' : 'top-[3px]'
                    )}
                  />
                  <span
                    className={cn(
                      'absolute inset-x-0 top-[7px] block h-[1.5px] rounded-full bg-current transition-all duration-300',
                      mobileOpen ? 'scale-x-0 opacity-0' : 'opacity-100'
                    )}
                  />
                  <span
                    className={cn(
                      'absolute inset-x-0 block h-[1.5px] origin-center rounded-full bg-current transition-all duration-300',
                      mobileOpen ? 'top-[7px] -rotate-45' : 'top-[11px]'
                    )}
                  />
                </div>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile right drawer */}
      <div
        className={cn(
          'fixed inset-0 z-[60] transition-colors duration-150 sm:pointer-events-none sm:hidden',
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
          <div className='border-b border-slate-200/70 px-5 py-4 dark:border-white/10'>
            <p className='text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500'>
              {t('Navigation')}
            </p>
            <p className='mt-1 text-sm font-semibold text-slate-950 dark:text-slate-50'>
              {displaySiteName}
            </p>
          </div>

          <nav className='mx-3 mt-3 flex flex-col gap-1 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-1.5 dark:border-white/10 dark:bg-white/[0.04]'>
            {navItems.map((link) => {
              const linkClassName = cn(
                'flex h-11 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium tracking-tight transition-all duration-150 ease-out',
                mobileOpen
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-2 opacity-0',
                link.isActive
                  ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/80 dark:bg-white/10 dark:text-white dark:ring-white/10'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-slate-100',
                link.disabled && 'pointer-events-none opacity-50'
              )
              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-disabled={link.disabled}
                    tabIndex={link.disabled ? -1 : undefined}
                    onClick={(event) => handleNavLinkClick(event, link, true)}
                    className={linkClassName}
                  >
                    {link.translatedTitle}
                  </a>
                )
              }
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  disabled={link.disabled}
                  onClick={(event) => handleNavLinkClick(event, link, true)}
                  className={linkClassName}
                >
                  {link.translatedTitle}
                </Link>
              )
            })}
          </nav>

          <div
            className={cn(
              'mt-auto border-t border-slate-200/70 p-4 transition-all duration-150 ease-out dark:border-white/10',
              mobileOpen
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0'
            )}
          >
            {showAuthButtons && (
              <Link
                to={isAuthenticated ? '/dashboard' : '/sign-in'}
                onClick={() => setMobileOpen(false)}
                className='inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] transition-colors hover:bg-slate-800 active:bg-slate-950 dark:bg-white dark:text-slate-950 dark:shadow-[0_12px_30px_rgba(0,0,0,0.42)] dark:hover:bg-slate-200'
              >
                {isAuthenticated ? t('Go to Dashboard') : t('Sign in')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {authPromptTarget ? (
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
              <button
                type='button'
                className='border-border bg-background hover:bg-muted hover:text-foreground inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium whitespace-nowrap transition-all'
                onClick={closeAuthPrompt}
              >
                {t('Cancel')}
              </button>
              <button
                type='button'
                className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-all'
                onClick={navigateToSignIn}
              >
                {t('Sign in now')}
              </button>
            </>
          }
        >
          <div className='bg-muted/40 text-muted-foreground rounded-lg px-3 py-2 text-sm'>
            {t('Redirecting to sign in in {{seconds}} seconds.', {
              seconds: authPromptSecondsLeft,
            })}
          </div>
        </Dialog>
      ) : null}
    </>
  )
}
