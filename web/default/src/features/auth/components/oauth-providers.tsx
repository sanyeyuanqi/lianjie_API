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
import type { ReactNode } from 'react'
import { Globe2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  IconDiscord,
  IconGithub,
  IconLinuxDo,
  IconTelegram,
  IconWeChat,
} from '@/assets/brand-icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useOAuthLogin } from '../hooks/use-oauth-login'
import type { SystemStatus } from '../types'

type OAuthProvidersProps = {
  status: SystemStatus | null
  disabled?: boolean
  className?: string
  onWeChatLogin?: () => void
  isWeChatLoading?: boolean
  showDivider?: boolean
  onBeforeLogin?: () => boolean
}

type ProviderButton = {
  key: string
  label: string
  onClick: () => void
  icon?: ReactNode
  className?: string
  disabled?: boolean
}

export function OAuthProviders({
  status,
  disabled = false,
  className,
  onWeChatLogin,
  isWeChatLoading = false,
  showDivider = true,
  onBeforeLogin,
}: OAuthProvidersProps) {
  const { t } = useTranslation()
  const {
    isLoading,
    githubButtonText,
    githubButtonDisabled,
    handleGitHubLogin,
    handleDiscordLogin,
    handleOIDCLogin,
    handleLinuxDOLogin,
    handleTelegramLogin,
    handleCustomOAuthLogin,
  } = useOAuthLogin(status)

  const providerButtons: ProviderButton[] = []

  if (status?.wechat_login && onWeChatLogin) {
    providerButtons.push({
      key: 'wechat',
      label: t('Continue with WeChat'),
      onClick: onWeChatLogin,
      icon: <IconWeChat className='h-4 w-4' />,
      className:
        'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/18 dark:text-emerald-400',
      disabled: isWeChatLoading,
    })
  }

  if (status?.github_oauth) {
    providerButtons.push({
      key: 'github',
      label: githubButtonText || t('Continue with GitHub'),
      onClick: handleGitHubLogin,
      icon: <IconGithub className='h-4 w-4' />,
      className:
        'border-foreground/15 bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.11]',
      disabled: githubButtonDisabled,
    })
  }

  if (status?.discord_oauth) {
    providerButtons.push({
      key: 'discord',
      label: t('Continue with Discord'),
      onClick: handleDiscordLogin,
      icon: <IconDiscord className='h-4 w-4' />,
      className:
        'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/18 dark:text-indigo-400',
    })
  }

  if (status?.oidc_enabled) {
    providerButtons.push({
      key: 'oidc',
      label: t('Continue with OIDC'),
      onClick: handleOIDCLogin,
      icon: <ShieldCheck className='h-5 w-5' />,
      className:
        'border-sky-500/20 bg-sky-500/10 text-sky-600 hover:bg-sky-500/18 dark:text-sky-400',
    })
  }

  if (status?.linuxdo_oauth) {
    providerButtons.push({
      key: 'linuxdo',
      label: t('Continue with LinuxDO'),
      onClick: handleLinuxDOLogin,
      icon: <IconLinuxDo className='h-4 w-4' />,
      className:
        'border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/18 dark:text-amber-300',
    })
  }

  if (status?.telegram_oauth) {
    providerButtons.push({
      key: 'telegram',
      label: t('Continue with Telegram'),
      onClick: handleTelegramLogin,
      icon: <IconTelegram className='h-5 w-5' />,
      className:
        'border-cyan-500/20 bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/18 dark:text-cyan-400',
    })
  }

  // Custom OAuth providers
  const customProviders = status?.custom_oauth_providers
  if (customProviders && customProviders.length > 0) {
    for (const provider of customProviders) {
      providerButtons.push({
        key: `custom-${provider.slug}`,
        label: t('Continue with {{name}}', { name: provider.name }),
        onClick: () => handleCustomOAuthLogin(provider),
        icon: <Globe2 className='h-5 w-5' />,
        className:
          'border-violet-500/20 bg-violet-500/10 text-violet-600 hover:bg-violet-500/18 dark:text-violet-400',
      })
    }
  }

  if (providerButtons.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {showDivider && (
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              {t('Or continue with')}
            </span>
          </div>
        </div>
      )}

      <div className='mx-auto flex max-w-[14.25rem] flex-wrap items-center justify-center gap-3'>
        {providerButtons.map(
          ({
            key,
            label,
            onClick,
            icon,
            className: providerClassName,
            disabled: extraDisabled,
          }) => (
            <Tooltip key={key}>
              <TooltipTrigger
                render={
                  <Button
                    variant='outline'
                    type='button'
                    size='icon'
                    aria-label={label}
                    disabled={disabled || isLoading || extraDisabled}
                    onClick={() => {
                      if (onBeforeLogin && !onBeforeLogin()) return
                      onClick()
                    }}
                    className={cn(
                      'size-12 rounded-xl shadow-sm transition-[color,background-color,border-color,box-shadow] duration-200 hover:shadow-md disabled:opacity-55 [&_svg]:size-7',
                      providerClassName
                    )}
                  />
                }
              >
                {icon}
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          )
        )}
      </div>
    </div>
  )
}
