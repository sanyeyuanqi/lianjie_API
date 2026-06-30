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
import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/theme-provider'
import { useNotifications } from '@/hooks/use-notifications'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ThemeSwitch } from '@/components/theme-switch'

type AuthLayoutProps = {
  children: ReactNode
}

type BrandIntroProps = {
  isDark: boolean
  compact?: boolean
  chipStyle: CSSProperties
}

function BrandIntro({ isDark, compact = false, chipStyle }: BrandIntroProps) {
  const { t } = useTranslation()

  return (
    <>
      {isDark && !compact && (
        <div className='absolute -inset-x-8 -inset-y-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.08),rgba(255,255,255,0)_58%)]' />
      )}
      <p
        className='mb-2 max-w-full text-xs tracking-[0.18em] uppercase sm:mb-3 sm:tracking-[0.2em]'
        style={{ color: isDark ? '#e5e7eb' : '#818cf8', fontWeight: 700 }}
      >
        {t('Global AI API Platform')}
      </p>
      <h2
        className={
          compact
            ? 'mb-2 max-w-[min(100%,36rem)] break-words sm:mb-3'
            : 'mb-3 max-w-[38rem]'
        }
        style={{
          fontSize: compact
            ? 'clamp(1.85rem, 8.5vw, 2.55rem)'
            : 'clamp(2.1rem, 5.4vw, 3rem)',
          fontWeight: 800,
          color: isDark ? '#f8fafc' : '#1e1b4b',
          lineHeight: compact ? 1.12 : 1.2,
          textShadow: isDark
            ? '0 0 28px rgba(255,255,255,0.18)'
            : undefined,
        }}
      >
        {t('Unified API, Connected World')}
      </h2>
      <p
        className={
          compact
            ? 'max-w-[42rem] text-sm leading-relaxed sm:text-[15px]'
            : 'hidden max-w-[42rem] text-sm leading-relaxed sm:block sm:text-[15px]'
        }
        style={{ color: isDark ? '#aeb7c6' : '#6b7280' }}
      >
        {t(
          'Aggregate DeepSeek, OpenAI, Anthropic and other mainstream providers. One key connects global leading AI models.'
        )}
      </p>
      {!compact && (
        <div className='mt-5 hidden max-w-2xl flex-wrap gap-2 sm:flex'>
          {[
            'OpenAI Compatible',
            'Low Latency Routing',
            'Pay Per Use',
            'Global Nodes',
          ].map((f) => (
            <span
              key={f}
              className='rounded-full border px-3 py-1 text-xs'
              style={chipStyle}
            >
              {t(f)}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

function AuthDetailPanels({ isDark }: { isDark: boolean }) {
  const panelClass = isDark
    ? 'border-white/[0.10] bg-zinc-950/62 text-zinc-200 shadow-[0_22px_58px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.06)]'
    : 'border-indigo-200/60 bg-white/55 text-slate-700 shadow-[0_18px_42px_rgba(99,102,241,0.10)]'
  const accentClass = isDark ? 'text-cyan-100' : 'text-indigo-700'
  const mutedTextClass = isDark ? 'text-zinc-500' : 'text-slate-500'

  const metrics = [
    { label: '模型接入', value: '100+', tone: 'from-cyan-300/60' },
    { label: '统一格式', value: 'OpenAI', tone: 'from-violet-300/55' },
    { label: '按量计费', value: '实时', tone: 'from-amber-200/60' },
  ]
  return (
    <>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 z-0 hidden lg:block'
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(115deg,transparent 0%,rgba(34,211,238,0.045) 44%,rgba(168,85,247,0.035) 56%,transparent 72%)'
            : 'linear-gradient(rgba(99,102,241,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.055) 1px,transparent 1px),linear-gradient(115deg,transparent 0%,rgba(125,211,252,0.12) 44%,rgba(99,102,241,0.08) 56%,transparent 72%)',
          backgroundSize: '72px 72px,72px 72px,100% 100%',
          maskImage:
            'linear-gradient(180deg,transparent 0%,black 16%,black 78%,transparent 100%)',
        }}
      />

      <div className='pointer-events-none absolute bottom-[clamp(2.5rem,9vh,6rem)] left-[clamp(2rem,6vw,5rem)] z-0 hidden w-[min(36vw,560px)] select-none lg:block'>
        <div className='grid grid-cols-3 gap-3'>
          {metrics.map((item) => (
            <div
              key={item.label}
              className={`relative overflow-hidden rounded-2xl border px-4 py-3 backdrop-blur-xl ${panelClass}`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${item.tone} via-white/20 to-transparent`}
              />
              <div className={`text-[11px] ${mutedTextClass}`}>{item.label}</div>
              <div className={`mt-1 text-lg font-bold ${accentClass}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='pointer-events-none absolute top-[23vh] right-[clamp(2rem,7vw,7rem)] z-0 hidden size-[300px] select-none xl:block'>
        <div
          className='absolute top-8 left-1/2 h-48 w-px -translate-x-1/2'
          style={{
            background: isDark
              ? 'linear-gradient(180deg,transparent,rgba(103,232,249,0.46),rgba(216,180,254,0.34),transparent)'
              : 'linear-gradient(180deg,transparent,rgba(99,102,241,0.28),rgba(56,189,248,0.24),transparent)',
          }}
        />
        {[
          { top: 'top-6', width: 'w-40', glow: 'cyan' },
          { top: 'top-24', width: 'w-56', glow: 'violet' },
          { top: 'top-[10.5rem]', width: 'w-44', glow: 'cyan' },
        ].map((item, index) => (
          <div
            key={item.top}
            className={`absolute ${item.top} left-1/2 h-16 ${item.width} -translate-x-1/2 rounded-[1.35rem] border backdrop-blur-xl`}
            style={{
              borderColor: isDark
                ? item.glow === 'cyan'
                  ? 'rgba(103,232,249,0.28)'
                  : 'rgba(216,180,254,0.26)'
                : 'rgba(99,102,241,0.18)',
              background: isDark
                ? 'linear-gradient(135deg,rgba(255,255,255,0.070),rgba(255,255,255,0.026))'
                : 'linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,255,255,0.28))',
              boxShadow: isDark
                ? item.glow === 'cyan'
                  ? '0 0 36px rgba(103,232,249,0.10),inset 0 1px 0 rgba(255,255,255,0.08)'
                  : '0 0 36px rgba(216,180,254,0.10),inset 0 1px 0 rgba(255,255,255,0.08)'
                : '0 16px 38px rgba(99,102,241,0.10)',
            }}
          >
            <div
              className='absolute top-1/2 left-5 size-3 -translate-y-1/2 rounded-full'
              style={{
                background: isDark
                  ? item.glow === 'cyan'
                    ? 'rgba(103,232,249,0.78)'
                    : 'rgba(216,180,254,0.72)'
                  : index % 2 === 0
                    ? 'rgba(99,102,241,0.48)'
                    : 'rgba(56,189,248,0.50)',
                boxShadow: isDark
                  ? item.glow === 'cyan'
                    ? '0 0 24px rgba(103,232,249,0.48)'
                    : '0 0 24px rgba(216,180,254,0.42)'
                  : '0 0 20px rgba(99,102,241,0.20)',
              }}
            />
            <div
              className='absolute top-1/2 right-5 h-px w-16 -translate-y-1/2'
              style={{
                background: isDark
                  ? 'linear-gradient(90deg,rgba(255,255,255,0.26),transparent)'
                  : 'linear-gradient(90deg,rgba(99,102,241,0.24),transparent)',
              }}
            />
          </div>
        ))}
        <div
          className='absolute top-[4.15rem] left-1/2 h-24 w-44 -translate-x-1/2 rounded-b-[2rem] border-x border-b'
          style={{
            borderColor: isDark
              ? 'rgba(103,232,249,0.18)'
              : 'rgba(99,102,241,0.14)',
          }}
        />
        <div
          className='absolute right-12 bottom-10 size-14 rounded-2xl border'
          style={{
            borderColor: isDark
              ? 'rgba(216,180,254,0.34)'
              : 'rgba(56,189,248,0.22)',
            background: isDark
              ? 'linear-gradient(135deg,rgba(103,232,249,0.16),rgba(216,180,254,0.16))'
              : 'linear-gradient(135deg,rgba(99,102,241,0.13),rgba(56,189,248,0.16))',
            boxShadow: isDark
              ? '0 0 40px rgba(216,180,254,0.16)'
              : '0 0 36px rgba(99,102,241,0.12)',
          }}
        />
      </div>

      <div className='pointer-events-none absolute right-[clamp(5rem,16vw,18rem)] bottom-[clamp(3rem,13vh,8rem)] z-0 hidden size-[300px] select-none 2xl:block'>
        <div
          className='absolute inset-8 rounded-full border'
          style={{
            borderColor: isDark
              ? 'rgba(103,232,249,0.46)'
              : 'rgba(99,102,241,0.18)',
            boxShadow: isDark
              ? '0 0 78px rgba(34,211,238,0.22), inset 0 0 64px rgba(168,85,247,0.10)'
              : '0 0 70px rgba(99,102,241,0.12), inset 0 0 60px rgba(125,211,252,0.10)',
          }}
        />
        <div
          className='absolute inset-20 rounded-full border'
          style={{
            borderColor: isDark
              ? 'rgba(216,180,254,0.42)'
              : 'rgba(56,189,248,0.20)',
          }}
        />
        <div
          className='absolute top-1/2 left-1/2 h-px w-44 origin-left -translate-y-1/2 rotate-[-28deg]'
          style={{
            background: isDark
              ? 'linear-gradient(90deg,rgba(103,232,249,0.72),rgba(103,232,249,0.22),transparent)'
              : 'linear-gradient(90deg,rgba(99,102,241,0.34),transparent)',
          }}
        />
        <div
          className='absolute top-1/2 left-1/2 h-px w-40 origin-left -translate-y-1/2 rotate-[34deg]'
          style={{
            background: isDark
              ? 'linear-gradient(90deg,rgba(216,180,254,0.70),rgba(216,180,254,0.20),transparent)'
              : 'linear-gradient(90deg,rgba(56,189,248,0.32),transparent)',
          }}
        />
        {[
          'top-8 left-1/2 -translate-x-1/2',
          'right-10 top-1/2 -translate-y-1/2',
          'bottom-10 left-16',
          'bottom-20 right-20',
        ].map((position, index) => (
          <div
            key={position}
            className={`absolute ${position} size-3 rounded-full border`}
            style={{
              borderColor: isDark
                ? 'rgba(255,255,255,0.62)'
                : 'rgba(99,102,241,0.32)',
              background:
                index % 2 === 0
                  ? isDark
                    ? 'rgba(103,232,249,0.72)'
                    : 'rgba(99,102,241,0.32)'
                  : isDark
                    ? 'rgba(216,180,254,0.66)'
                    : 'rgba(56,189,248,0.32)',
              boxShadow: isDark
                ? '0 0 24px rgba(103,232,249,0.52),0 0 44px rgba(216,180,254,0.22)'
                : '0 0 22px rgba(99,102,241,0.20)',
            }}
          />
        ))}
        <div
          className='absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-2xl border'
          style={{
            borderColor: isDark
              ? 'rgba(255,255,255,0.50)'
              : 'rgba(99,102,241,0.28)',
            background: isDark
              ? 'linear-gradient(135deg,rgba(103,232,249,0.42),rgba(216,180,254,0.32))'
              : 'linear-gradient(135deg,rgba(99,102,241,0.16),rgba(56,189,248,0.18))',
            boxShadow: isDark
              ? '0 0 42px rgba(103,232,249,0.34),0 0 76px rgba(216,180,254,0.18)'
              : '0 0 42px rgba(99,102,241,0.16)',
          }}
        />
      </div>

      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-[7vw] top-[30vh] z-0 hidden h-px rotate-[-4deg] lg:block'
        style={{
          background: isDark
            ? 'linear-gradient(90deg,transparent,rgba(34,211,238,0.18),rgba(255,255,255,0.08),transparent)'
            : 'linear-gradient(90deg,transparent,rgba(99,102,241,0.22),transparent)',
        }}
      />
    </>
  )
}

/* ── AuthLayout ──────────────────────────────────────────────── */

export function AuthLayout({ children }: AuthLayoutProps) {
  const { resolvedTheme } = useTheme()
  const notifications = useNotifications()
  const isDark = resolvedTheme === 'dark'
  const pageBackground = isDark
    ? 'linear-gradient(180deg,rgba(255,255,255,0.035) 0%,rgba(255,255,255,0) 18%),radial-gradient(ellipse at 50% 42%,rgba(34,211,238,0.055),rgba(34,211,238,0) 34%),radial-gradient(ellipse at 78% 64%,rgba(168,85,247,0.05),rgba(168,85,247,0) 28%),linear-gradient(180deg,#050607 0%,#090a0c 44%,#030405 100%)'
    : 'radial-gradient(circle at 78% 36%,rgba(255,255,255,0.82),rgba(255,255,255,0) 28%),linear-gradient(135deg,#edf6ff 0%,#f3f8ff 48%,#f8fbff 100%)'
  const navPanelClass = isDark
    ? 'border-white/18 bg-zinc-950/72 shadow-[0_14px_38px_rgba(0,0,0,0.84),0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.10)] [&_[data-slot=button]]:bg-white/[0.06] [&_[data-slot=button]]:text-zinc-100 [&_[data-slot=button]]:transition-colors [&_[data-slot=button]]:hover:bg-white/15 [&_[data-slot=button]]:hover:text-white [&_[data-slot=button]]:focus-visible:bg-white/15 [&_[data-slot=button]]:focus-visible:text-white'
    : 'border-indigo-200/45 bg-white/45 shadow-[0_10px_30px_rgba(99,102,241,0.10),inset_0_1px_0_rgba(255,255,255,0.72)] [&_[data-slot=button]]:text-slate-600 [&_[data-slot=button]]:hover:bg-white/70 [&_[data-slot=button]]:hover:text-indigo-950'
  const chipStyle = isDark
    ? {
        borderColor: 'rgba(255,255,255,0.22)',
        color: '#d4d4d8',
        background: 'rgba(255,255,255,0.08)',
      }
    : {
        borderColor: 'rgba(99,102,241,0.25)',
        color: '#6366f1',
        background: 'rgba(99,102,241,0.06)',
      }
  const authFormSurfaceClass = isDark
    ? 'border-white/[0.13] bg-[#111216]/78 text-slate-50 shadow-[0_30px_90px_rgba(0,0,0,0.54),0_0_0_1px_rgba(255,255,255,0.025),0_0_70px_rgba(34,211,238,0.055),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl transition-[border-color,background-color,box-shadow] duration-700 ease-out hover:border-white/20 hover:bg-[#14161b]/82 hover:shadow-[0_36px_110px_rgba(0,0,0,0.58),0_0_82px_rgba(34,211,238,0.075),inset_0_1px_0_rgba(255,255,255,0.12)] [&_input]:border-white/14 [&_input]:bg-black/20 [&_input]:text-slate-100 [&_input]:placeholder:text-slate-500 [&_label]:text-slate-300 [&_[data-slot=checkbox]]:border-white/18 [&_[data-slot=checkbox]]:bg-white/6'
    : 'border-white/75 bg-white/72 text-slate-950 shadow-[0_28px_90px_rgba(79,70,229,0.16),0_16px_44px_rgba(30,41,59,0.10),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition-[border-color,background-color,box-shadow] duration-700 ease-out hover:border-white hover:bg-white/82 hover:shadow-[0_34px_108px_rgba(79,70,229,0.20),0_20px_58px_rgba(30,41,59,0.13),0_0_48px_rgba(125,211,252,0.18),inset_0_1px_0_rgba(255,255,255,0.98)]'

  return (
    <div
      className='flex min-h-screen flex-col overflow-x-hidden'
      style={{ background: pageBackground }}
    >
      {/* Top bar */}
      <header className='z-30 flex h-16 flex-shrink-0 items-center justify-end bg-transparent px-4 sm:px-6 lg:px-10'>
        <div
          className={`flex items-center gap-1 rounded-full border p-1 backdrop-blur-xl [&_[data-slot=button]]:rounded-full ${navPanelClass}`}
        >
          <LanguageSwitcher />
          <ThemeSwitch />
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
        </div>
      </header>

      {/* Body */}
      <div className='relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto lg:min-h-0 lg:overflow-hidden'>
        <AuthDetailPanels isDark={isDark} />

        {/* Left — overlay text */}
        <div className='pointer-events-none absolute top-0 left-0 z-10 hidden min-w-0 shrink-0 overflow-visible lg:block lg:overflow-hidden'>
          <div className='pointer-events-none relative max-w-3xl px-6 pt-7 select-none sm:px-10 sm:pt-9 lg:px-14 lg:pt-8 xl:px-16'>
            <BrandIntro isDark={isDark} chipStyle={chipStyle} />
          </div>
        </div>

        <div className='relative z-10 px-4 pt-1 pb-5 select-none sm:px-8 sm:pt-3 sm:pb-6 md:px-10 lg:hidden'>
          <BrandIntro isDark={isDark} compact chipStyle={chipStyle} />
        </div>

        {/* Right — auth form */}
        <div
          className='relative z-10 flex w-full flex-1 items-start justify-center px-5 pt-0 pb-8 sm:px-8 md:px-10 lg:items-center lg:px-10 lg:pt-4 lg:pb-12'
        >
          <div
            className={`w-full max-w-[min(408px,100%)] rounded-[1.35rem] border px-5 py-7 sm:px-7 sm:py-8 md:px-8 lg:max-w-[392px] ${authFormSurfaceClass}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
