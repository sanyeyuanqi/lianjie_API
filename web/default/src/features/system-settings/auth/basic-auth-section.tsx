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
import { useMemo } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  SettingsControlChildren,
  SettingsControlGroup,
  SettingsEnableDisableButton,
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useResetForm } from '../hooks/use-reset-form'
import { useUpdateOption } from '../hooks/use-update-option'

const basicAuthSchema = z.object({
  PasswordLoginEnabled: z.boolean(),
  PasswordRegisterEnabled: z.boolean(),
  EmailVerificationEnabled: z.boolean(),
  PasswordResetCountdownSeconds: z.number().int().min(1).max(86400),
  RegisterEnabled: z.boolean(),
  EmailDomainRestrictionEnabled: z.boolean(),
  EmailAliasRestrictionEnabled: z.boolean(),
  EmailDomainWhitelist: z.string(),
})

type BasicAuthFormValues = z.infer<typeof basicAuthSchema>

type BasicAuthSectionProps = {
  defaultValues: BasicAuthFormValues
}

export function BasicAuthSection({ defaultValues }: BasicAuthSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const formDefaults = useMemo<BasicAuthFormValues>(
    () => ({
      ...defaultValues,
      EmailDomainWhitelist: defaultValues.EmailDomainWhitelist.split(',')
        .map((domain) => domain.trim())
        .filter(Boolean)
        .join('\n'),
    }),
    [defaultValues]
  )

  const form = useForm<BasicAuthFormValues>({
    resolver: zodResolver(basicAuthSchema),
    defaultValues: formDefaults,
  })

  useResetForm(form, formDefaults)

  const onSubmit = async (data: BasicAuthFormValues) => {
    const updates: Array<{ key: string; value: string | number | boolean }> = []

    Object.entries(data).forEach(([key, value]) => {
      if (key === 'EmailDomainWhitelist') {
        if (typeof value !== 'string') return
        const domains = value
          .split('\n')
          .map((domain) => domain.trim())
          .filter(Boolean)
          .join(',')
        if (domains !== defaultValues.EmailDomainWhitelist) {
          updates.push({ key, value: domains })
        }
      } else if (value !== defaultValues[key as keyof typeof defaultValues]) {
        updates.push({ key, value })
      }
    })

    for (const update of updates) {
      await updateOption.mutateAsync(update)
    }
  }

  const authOptions: Array<{
    name: keyof Omit<
      BasicAuthFormValues,
      'EmailDomainWhitelist' | 'PasswordResetCountdownSeconds'
    >
    title: string
    description: string
  }> = [
    {
      name: 'PasswordLoginEnabled',
      title: t('Password Login'),
      description: t('Allow users to log in with password'),
    },
    {
      name: 'RegisterEnabled',
      title: t('Registration Enabled'),
      description: t('Allow new users to register'),
    },
    {
      name: 'PasswordRegisterEnabled',
      title: t('Password Registration'),
      description: t('Allow registration with password'),
    },
    {
      name: 'EmailVerificationEnabled',
      title: t('Email Verification'),
      description: t('Require email verification for new accounts'),
    },
    {
      name: 'EmailDomainRestrictionEnabled',
      title: t('Email Domain Restriction'),
      description: t('Only allow specific email domains'),
    },
    {
      name: 'EmailAliasRestrictionEnabled',
      title: t('Email Alias Restriction'),
      description: t('Block email aliases (e.g., user+alias@domain.com)'),
    },
  ]

  return (
    <SettingsSection title={t('Basic Authentication')}>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={updateOption.isPending}
          />
          <SettingsControlGroup className='w-full min-w-0'>
            <SettingsControlChildren className='ml-0 flex flex-wrap gap-3 border-l-0 pl-0'>
              {authOptions.map((item) => (
                <FormField
                  key={item.name}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <SettingsSwitchItem className='bg-background/70 min-h-20 min-w-[220px] flex-[1_1_260px] rounded-lg border px-3 py-3 shadow-xs last:border-b xl:max-w-[360px]'>
                      <SettingsSwitchContent>
                        <FormLabel>{item.title}</FormLabel>
                        <FormDescription>{item.description}</FormDescription>
                      </SettingsSwitchContent>
                      <FormControl>
                        <SettingsEnableDisableButton
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </SettingsSwitchItem>
                  )}
                />
              ))}
            </SettingsControlChildren>
          </SettingsControlGroup>

          <FormField
            control={form.control}
            name='PasswordResetCountdownSeconds'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Password reset resend countdown')}</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={1}
                    max={86400}
                    step={1}
                    {...field}
                    onChange={(event) =>
                      field.onChange(parseInt(event.target.value, 10) || 1)
                    }
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'Minimum interval before a password reset email can be sent again, in seconds.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='EmailDomainWhitelist'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Email Domain Whitelist')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('example.com&#10;company.com')}
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'One domain per line (only used when domain restriction is enabled)'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
