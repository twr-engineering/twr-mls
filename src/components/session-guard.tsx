'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Must match Users.ts tokenExpiration
const TOKEN_EXPIRY_SECS = 3600
// Silently refresh when user is active and this many seconds have elapsed
const REFRESH_INTERVAL_SECS = 15 * 60 // 15 minutes
// Show warning dialog when this many seconds remain
const WARN_THRESHOLD_SECS = 5 * 60    // 5 minutes
// Heartbeat interval for checking session state
const HEARTBEAT_MS = 30_000            // 30 seconds

/**
 * SessionGuard — mounts once in the agent layout and manages the entire
 * session lifecycle:
 *
 * 1. Silently refreshes the Payload JWT every 15 minutes while the user is active.
 * 2. Shows a countdown warning dialog 5 minutes before expiry.
 * 3. Redirects to /login?reason=session_expired if the session fully expires.
 *
 * Uses Payload's built-in POST /api/users/refresh-token endpoint which reads
 * the current httpOnly cookie and issues a new one.
 */
export function SessionGuard() {
  const router = useRouter()
  const lastRefreshAt = useRef(Date.now())
  const lastActivityAt = useRef(Date.now())
  const [warningOpen, setWarningOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(WARN_THRESHOLD_SECS)
  const [extending, setExtending] = useState(false)

  const goToLogin = useCallback(() => {
    router.push('/login?reason=session_expired')
  }, [router])

  const doRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/users/refresh-token', {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        lastRefreshAt.current = Date.now()
        setWarningOpen(false)
        setSecondsLeft(WARN_THRESHOLD_SECS)
        return true
      }
      // 401 means token already expired — send to login
      if (res.status === 401) {
        goToLogin()
      }
    } catch {
      // Network failure — let the heartbeat handle expiry detection
    }
    return false
  }, [goToLogin])

  // On mount, immediately refresh the token so lastRefreshAt reflects a known-fresh state.
  // Without this, if the token was issued before this component mounted (e.g., user logged in
  // 50 minutes ago then opened a new tab), the guard would miscalculate remaining time
  // and never trigger a proactive refresh, causing an unexpected server-side logout.
  useEffect(() => {
    doRefresh()
  }, [doRefresh])

  // Register passive activity listeners to detect if the user is still present
  useEffect(() => {
    const recordActivity = () => {
      lastActivityAt.current = Date.now()
    }
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    events.forEach((ev) => window.addEventListener(ev, recordActivity, { passive: true }))
    return () => events.forEach((ev) => window.removeEventListener(ev, recordActivity))
  }, [])

  // Heartbeat: runs every 30 seconds, checks session state and triggers
  // silent refreshes or the warning dialog as needed
  useEffect(() => {
    const id = setInterval(async () => {
      const now = Date.now()
      const elapsedSec = (now - lastRefreshAt.current) / 1000
      const remaining = TOKEN_EXPIRY_SECS - elapsedSec

      // Session fully expired server-side
      if (remaining <= 0) {
        clearInterval(id)
        goToLogin()
        return
      }

      // Enter warning zone — show countdown dialog
      if (remaining <= WARN_THRESHOLD_SECS && !warningOpen) {
        setSecondsLeft(Math.round(remaining))
        setWarningOpen(true)
        return
      }

      // Silent refresh: if not in warning zone, check if we need to refresh based on activity
      if (!warningOpen && elapsedSec >= REFRESH_INTERVAL_SECS) {
        // User is considered active if they interacted in the last 5 minutes
        const recentlyActive = (now - lastActivityAt.current) / 1000 < 300
        if (recentlyActive) {
          await doRefresh()
        }
      }

    }, HEARTBEAT_MS)

    return () => clearInterval(id)
  }, [doRefresh, goToLogin, warningOpen])

  // Countdown: 1-second tick only while the warning dialog is open
  useEffect(() => {
    if (!warningOpen) return

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          goToLogin()
          return 0
        }
        return prev - 1
      })
    }, 1_000)

    return () => clearInterval(id)
  }, [warningOpen, goToLogin])

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <Dialog open={warningOpen} onOpenChange={() => { }}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Your session is about to expire</DialogTitle>
          <DialogDescription>
            You will be logged out in{' '}
            <span className="font-semibold text-destructive tabular-nums">
              {fmt(secondsLeft)}
            </span>
            . Any unsaved work will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={goToLogin} disabled={extending}>
            Log Out Now
          </Button>
          <Button
            onClick={async () => {
              setExtending(true)
              await doRefresh()
              setExtending(false)
            }}
            disabled={extending}
          >
            {extending ? 'Extending…' : 'Stay Logged In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
