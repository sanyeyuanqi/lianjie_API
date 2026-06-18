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
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/use-notifications'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { ConfigDrawer } from '@/components/config-drawer'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { defaultTopNavLinks } from '../config/top-nav.config'
import { type TopNavLink } from '../types'
import { Header } from './header'
import { TopNav } from './top-nav'

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
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  // Prioritize dynamically generated links from backend
  const dynamicLinks = useTopNavLinks()
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  const expandTopNav =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/console')
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
            <div className='flex h-full items-center gap-1 px-0 sm:px-1 [&_[data-slot=button]]:size-8'>
              <LanguageSwitcher />
              <ThemeSwitch />
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
                />
              )}
              {showConfigDrawer && <ConfigDrawer />}
              {showProfileDropdown && (
                <ProfileDropdown
                  showName
                  nameMode='username'
                  className='!h-8 !w-auto max-w-[5.25rem] px-2 text-sm font-semibold sm:max-w-[10rem]'
                />
              )}
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
