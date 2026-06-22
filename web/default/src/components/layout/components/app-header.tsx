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
import { useEffect, useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { PanelLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useChatSessionsSidebar } from '@/context/chat-sessions-sidebar-provider'
import { useNotifications } from '@/hooks/use-notifications'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { ConfigDrawer } from '@/components/config-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { defaultTopNavLinks } from '../config/top-nav.config'
import { type TopNavLink } from '../types'
import { Header } from './header'
import { TopNav } from './top-nav'

const appHeaderToolButtonClass =
  'size-8 !rounded-full text-slate-600 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-105 hover:bg-white/90 hover:text-slate-950 hover:shadow-[0_8px_18px_rgba(15,23,42,0.10)] data-popup-open:bg-white/90 dark:text-slate-300 dark:hover:bg-white/12 dark:hover:text-white dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.28)]'

const appHeaderProfileButtonClass =
  '!h-8 !w-auto max-w-[5.25rem] !rounded-full px-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white/90 hover:text-slate-950 hover:shadow-[0_8px_18px_rgba(15,23,42,0.10)] data-popup-open:bg-white/90 sm:max-w-[10rem] dark:text-slate-300 dark:hover:bg-white/12 dark:hover:text-white dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.28)]'

/**
 * General application Header component
 * Integrates navigation bar, search, configuration and profile functions
 *
 * @example
 * // Basic usage
 * <AppHeader />
 *
 * @example
 * // Custom navigation links
 * <AppHeader navLinks={customLinks} />
 *
 * @example
 * // Hide navigation bar and search box
 * <AppHeader showTopNav={false} showSearch={false} />
 *
 * @example
 * // Fully customize left and right content
 * <AppHeader
 *   leftContent={<CustomLeft />}
 *   rightContent={<CustomRight />}
 * />
 */
type AppHeaderProps = {
  /**
   * Custom navigation links, uses default global navigation or dynamically generated from backend if not provided
   */
  navLinks?: TopNavLink[]
  /**
   * Whether to show top navigation bar
   * @default true
   */
  showTopNav?: boolean
  /**
   * Left content, overrides TopNav if provided
   */
  leftContent?: React.ReactNode
  /**
   * Whether to show search box
   * @default true
   */
  showSearch?: boolean
  /**
   * Custom right content, overrides default right content if provided
   */
  rightContent?: React.ReactNode
  /**
   * Whether to show notification button
   * @default true
   */
  showNotifications?: boolean
  /**
   * Whether to show config drawer
   * @default true
   */
  showConfigDrawer?: boolean
  /**
   * Whether to show profile dropdown
   * @default true
   */
  showProfileDropdown?: boolean
}

export function AppHeader({
  navLinks = defaultTopNavLinks,
  showTopNav = true,
  leftContent,
  rightContent,
  showNotifications = true,
  showConfigDrawer = true,
  showProfileDropdown = true,
}: AppHeaderProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { toggleSidebar } = useSidebar()
  const { toggleDesktopOpen, toggleMobileOpen } = useChatSessionsSidebar()
  const [scrolled, setScrolled] = useState(false)
  // Prioritize dynamically generated links from backend
  const dynamicLinks = useTopNavLinks()
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  const expandTopNav =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/console')
  const isChatPage =
    location.pathname === '/chat' || location.pathname.startsWith('/chat/')
  // Notifications hook
  const notifications = useNotifications()

  useEffect(() => {
    let frameId = 0
    const mobileQuery = window.matchMedia('(max-width: 639px)')

    const getMaxScrollTop = (eventTarget?: EventTarget | null) => {
      const documentScrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      const eventScrollTop =
        eventTarget instanceof HTMLElement ? eventTarget.scrollTop : 0
      const scrollableTops = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[class*="overflow-auto"], [class*="overflow-y-auto"], [data-radix-scroll-area-viewport]'
        )
      ).map((element) => element.scrollTop)

      return Math.max(documentScrollTop, eventScrollTop, ...scrollableTops)
    }

    const updateScrolled = (eventTarget?: EventTarget | null) => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        setScrolled(mobileQuery.matches && getMaxScrollTop(eventTarget) > 20)
      })
    }

    const handleScroll = (event: Event) => {
      updateScrolled(event.target)
    }

    const handleMobileChange = () => {
      updateScrolled()
    }

    updateScrolled()
    window.addEventListener('scroll', handleScroll, true)
    mobileQuery.addEventListener('change', handleMobileChange)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', handleScroll, true)
      mobileQuery.removeEventListener('change', handleMobileChange)
    }
  }, [location.pathname])

  return (
    <>
      <Header
        className='bg-transparent'
        sidebarTrigger={
          <Button
            type='button'
            variant='ghost'
            className={cn(
              'h-9 w-auto shrink-0 gap-1.5 rounded-lg bg-transparent px-2 text-sm font-semibold text-slate-700 hover:bg-slate-950/[0.05] md:size-8 md:px-0 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/[0.06]',
              !isChatPage && 'md:hidden'
            )}
            onClick={() => {
              if (isChatPage) {
                if (isMobile) {
                  toggleMobileOpen()
                } else {
                  toggleDesktopOpen()
                }
                return
              }

              toggleSidebar()
            }}
            aria-label={
              isChatPage ? t('Toggle chat sessions') : t('Toggle Sidebar')
            }
          >
            <PanelLeft className='size-4' />
            <span className='md:sr-only'>
              {isChatPage ? t('Sessions') : t('Directory')}
            </span>
          </Button>
        }
        contentClassName={cn(
          'relative rounded-xl border backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'md:[&_[data-sidebar=trigger]]:size-8 [&_[data-slot=button]]:rounded-lg [&_[data-slot=button]]:text-slate-700 [&_[data-slot=button]]:hover:bg-slate-950/[0.055] dark:[&_[data-slot=button]]:text-slate-300 dark:[&_[data-slot=button]]:hover:bg-white/[0.075]',
          'mx-3 mt-3 h-12 w-[calc(100%-1.5rem)] border-slate-200/70 bg-white/72 px-2.5 shadow-[0_12px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-zinc-950/58 dark:shadow-[0_14px_46px_rgba(0,0,0,0.42)] sm:bg-white/62',
          scrolled
            ? 'max-sm:mx-auto max-sm:mt-2 max-sm:h-10 max-sm:w-[min(1120px,calc(100%-3rem))] max-sm:border-slate-200/80 max-sm:bg-white/82 max-sm:pr-1.5 max-sm:pl-2.5 max-sm:shadow-[0_14px_44px_rgba(15,23,42,0.14)] dark:max-sm:border-white/10 dark:max-sm:bg-zinc-950/82 dark:max-sm:shadow-[0_14px_48px_rgba(0,0,0,0.56)]'
            : ''
        )}
      >
        {leftContent ? (
          <div className='ms-2 flex items-center'>{leftContent}</div>
        ) : showTopNav ? (
          <TopNav
            links={links}
            expanded={expandTopNav}
            showMobileMenu={false}
          />
        ) : null}

        {rightContent ?? (
          <div className='ms-auto flex min-w-0 items-center gap-1 sm:gap-2'>
            <div className='flex h-full items-center gap-1 px-0 sm:px-1'>
              <div className='flex min-w-0 items-center gap-0.5 rounded-full bg-white/35 p-0.5 ring-1 ring-slate-200/45 backdrop-blur-sm dark:bg-white/[0.03] dark:ring-white/8'>
                <LanguageSwitcher className={appHeaderToolButtonClass} />
                <ThemeSwitch className={appHeaderToolButtonClass} />
                {showNotifications && (
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
                    className={appHeaderToolButtonClass}
                  />
                )}
                {showConfigDrawer && (
                  <ConfigDrawer triggerClassName={appHeaderToolButtonClass} />
                )}
                {showProfileDropdown && (
                  <ProfileDropdown
                    showName
                    nameMode='username'
                    className={appHeaderProfileButtonClass}
                  />
                )}
              </div>
              {showTopNav && (
                <TopNav
                  links={links}
                  showDesktopNav={false}
                />
              )}
            </div>
          </div>
        )}
      </Header>
    </>
  )
}
