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

type SearchValue = unknown

export function asString(value: SearchValue, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export function asOptionalString(value: SearchValue) {
  return typeof value === 'string' ? value : undefined
}

export function asNumber(value: SearchValue, fallback?: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function asBoolean(value: SearchValue) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true' || value === '1') return true
    if (value === 'false' || value === '0') return false
  }
  return undefined
}

export function asStringArray(value: SearchValue) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value]
  return values.filter((item): item is string => typeof item === 'string')
}

export function asEnum<T extends string>(
  value: SearchValue,
  allowed: readonly T[]
) {
  return typeof value === 'string' && allowed.includes(value as T)
    ? (value as T)
    : undefined
}

export function asEnumArray<T extends string>(
  value: SearchValue,
  allowed: readonly T[]
) {
  return asStringArray(value).filter((item): item is T =>
    allowed.includes(item as T)
  )
}

export function compactSearch<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined)
  ) as {
    [K in keyof T]?: Exclude<T[K], undefined>
  }
}
