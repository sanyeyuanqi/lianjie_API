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
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import {
  normalizeInterfaceLanguage,
  type InterfaceLanguageCode,
} from './languages'

type TranslationResource = Record<string, unknown>
type LocaleResource = { translation: TranslationResource }

const localeLoaders: Record<
  InterfaceLanguageCode,
  () => Promise<{ default: LocaleResource }>
> = {
  en: () => import('./locales/en.json'),
  zh: () => import('./locales/zh.json'),
  fr: () => import('./locales/fr.json'),
  ru: () => import('./locales/ru.json'),
  ja: () => import('./locales/ja.json'),
  vi: () => import('./locales/vi.json'),
}

function getInitialLanguage(): InterfaceLanguageCode {
  if (typeof window === 'undefined') return 'en'

  try {
    const savedLanguage = window.localStorage.getItem('i18nextLng')
    if (savedLanguage) {
      return normalizeInterfaceLanguage(savedLanguage) as InterfaceLanguageCode
    }
  } catch {
    // Fall through to the browser language when local storage is unavailable.
  }

  return normalizeInterfaceLanguage(
    window.navigator.language
  ) as InterfaceLanguageCode
}

const initialLanguage = getInitialLanguage()

export const i18nReady = localeLoaders[initialLanguage]().then(
  ({ default: translations }) =>
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        lng: initialLanguage,
        fallbackLng: 'en',
        resources: {
          [initialLanguage]: translations,
        },
        supportedLngs: ['en', 'zh', 'fr', 'ru', 'ja', 'vi'],
        load: 'languageOnly', // Convert zh-CN -> zh
        nsSeparator: false, // Allow literal colons in keys (e.g., URLs, labels)
        keySeparator: false, // Translation keys are stored flat, including dotted keys.
        debug: false,
        interpolation: {
          escapeValue: false, // not needed for react as it escapes by default
        },
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
        },
        react: {
          useSuspense: false,
        },
      })
)

export async function changeLanguage(language: string) {
  const normalizedLanguage = normalizeInterfaceLanguage(
    language
  ) as InterfaceLanguageCode

  if (!i18n.hasResourceBundle(normalizedLanguage, 'translation')) {
    const { default: translations } = await localeLoaders[normalizedLanguage]()
    i18n.addResourceBundle(
      normalizedLanguage,
      'translation',
      translations.translation
    )
  }

  await i18n.changeLanguage(normalizedLanguage)
}

export default i18n
