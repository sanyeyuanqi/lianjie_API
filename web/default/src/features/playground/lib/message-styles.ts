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
/**
 * Get message content styles based on role
 * Encapsulates styling logic for user and assistant messages
 */
export function getMessageContentStyles() {
  return [
    // Assistant content fills the row; user bubble auto-width
    'group-[.is-assistant]:w-full',
    'group-[.is-assistant]:max-w-none',
    // User bubble: rounded and themed background
    'group-[.is-user]:text-foreground',
    'group-[.is-user]:border',
    'group-[.is-user]:border-border/70',
    'group-[.is-user]:bg-muted/45',
    'group-[.is-user]:px-4',
    'group-[.is-user]:py-2.5',
    'group-[.is-user]:shadow-sm',
    'dark:group-[.is-user]:bg-muted/60',
    'group-[.is-user]:rounded-[10px]',
    // Assistant bubble: flat serif style (one-sided style)
    'group-[.is-assistant]:text-foreground',
    'group-[.is-assistant]:bg-transparent',
    'group-[.is-assistant]:p-0',
    'group-[.is-assistant]:font-serif',
    // Preferred readable widths and wrapping
    'leading-relaxed',
    'break-words',
    'whitespace-pre-wrap',
    'sm:leading-7',
  ].join(' ')
}
