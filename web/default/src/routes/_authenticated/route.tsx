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
import { lazy, Suspense, useEffect } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { getSelf } from '@/lib/api'

const AuthenticatedLayout = lazy(() =>
  import('@/components/layout/components/authenticated-layout').then(
    (module) => ({
      default: module.AuthenticatedLayout,
    })
  )
)

// 内存中的验证标记，避免同一会话中重复验证
let sessionVerified = false
let sessionVerificationPromise: Promise<boolean> | null = null

function verifySessionInBackground() {
  if (sessionVerified) return Promise.resolve(true)
  if (sessionVerificationPromise) return sessionVerificationPromise

  sessionVerificationPromise = getSelf()
    .then((res) => {
      const { auth } = useAuthStore.getState()

      if (res?.success && res.data) {
        auth.setUser(res.data)
        sessionVerified = true
        return true
      }

      auth.reset()
      return false
    })
    .catch(() => {
      useAuthStore.getState().auth.reset()
      return false
    })
    .finally(() => {
      sessionVerificationPromise = null
    })

  return sessionVerificationPromise
}

function AuthenticatedRouteComponent() {
  const navigate = useNavigate()

  useEffect(() => {
    void verifySessionInBackground().then((valid) => {
      if (!valid) {
        navigate({
          to: '/sign-in',
          search: { redirect: window.location.href },
          replace: true,
        })
      }
    })
  }, [navigate])

  return (
    <Suspense fallback={null}>
      <AuthenticatedLayout />
    </Suspense>
  )
}

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { auth } = useAuthStore.getState()

    // 如果本地没有用户信息，直接跳转登录页
    if (!auth.user) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }

    // 本地有用户信息时先渲染页面，再在组件内后台校验 session。
    // 这样部署环境网络较慢时，登录后不会被 getSelf() 阻塞首屏。
  },
  component: AuthenticatedRouteComponent,
})
