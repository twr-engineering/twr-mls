'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Tokens are valid for 30 days (tokenExpiration: 2592000 in Users collection).
// Refreshing on every mount implements sliding expiration — visiting any page
// extends the session by another 30 days.
//
// The interval below is a safety net only for tabs that stay open for long
// periods without navigation (e.g. an agent dashboard left open overnight).
// 6 hours is well within the 30-day window.
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours

/**
 * SessionGuard — mounts once in the agent layout.
 *
 * On mount: silently refreshes the token, implementing sliding expiration.
 * Every 6 hours: refreshes again for long-running open tabs.
 *
 * A 401 response means the token has genuinely expired (30+ days of inactivity)
 * or the account was deactivated. In that case, redirect to login.
 *
 * Security note: server-side requireAuth() + isActive check remain the
 * authoritative gate on every page navigation. This component is an
 * optimistic UX helper, not the primary security enforcement.
 */
export function SessionGuard() {
  const router = useRouter()

  const doRefresh = useCallback(async () => {
    try {
      const res = await fetch('/api/users/refresh-token', {
        method: 'POST',
        credentials: 'include',
      })
      if (res.status === 401) {
        // Token genuinely expired (30+ days inactive) — redirect to login.
        router.push('/login?reason=session_expired')
      }
    } catch {
      // Network failure — server-side auth on the next navigation will catch expiry.
    }
  }, [router])

  // Refresh on mount: extends the sliding 30-day window on every page visit.
  useEffect(() => {
    doRefresh()
  }, [doRefresh])

  // Safety-net interval for tabs that stay open without navigating.
  useEffect(() => {
    const id = setInterval(doRefresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [doRefresh])

  return null
}
