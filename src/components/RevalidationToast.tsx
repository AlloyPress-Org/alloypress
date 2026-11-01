'use client'

import { useEffect } from 'react'
import { toast } from '@payloadcms/ui'

type Entry = {
  id: string
  label: string
  status: 'pending' | 'success' | 'error'
  message?: string
}

type StatusResponse = { now: number; entries: Entry[] }

const POLL_MS = 2500

// If the editor does nothing for this long, polling pauses so Neon can scale to zero.
// Any click / key press / scroll / touch (or coming back to the tab) resumes it at once.
const IDLE_MS = 60_000

/**
 * Registered in payload.config.ts -> admin.components.actions.
 * Polls /api/revalidation-status and shows a toast when the CMS tells the website
 * to refresh its cache: "Updating website..." -> success / error.
 *
 * Polls only while the tab is visible AND the editor is active.
 */
export const RevalidationToast = () => {
  useEffect(() => {
    let stopped = false
    let since: number | null = null
    let lastActivity = Date.now()
    const shown = new Map<string, 'pending' | 'done'>()

    const isIdle = () => Date.now() - lastActivity > IDLE_MS

    const poll = async () => {
      if (stopped || document.hidden || isIdle()) return

      try {
        // First call only learns the server clock (no old toasts on page load).
        const url = `/api/revalidation-status?since=${since ?? Number.MAX_SAFE_INTEGER}`
        const res = await fetch(url, { credentials: 'include', cache: 'no-store' })

        if (res.status === 401) {
          stopped = true // logged out
          return
        }
        if (!res.ok) return

        const data = (await res.json()) as StatusResponse

        if (since !== null) {
          for (const entry of data.entries) {
            const state = shown.get(entry.id)

            if (entry.status === 'pending' && !state) {
              shown.set(entry.id, 'pending')
              toast.loading(`Updating website: ${entry.label}...`, { id: entry.id })
            } else if (entry.status === 'success' && state !== 'done') {
              shown.set(entry.id, 'done')
              toast.success(`Website updated: ${entry.label}`, {
                id: entry.id,
                description: entry.message,
              })
            } else if (entry.status === 'error' && state !== 'done') {
              shown.set(entry.id, 'done')
              toast.error(`Website update FAILED: ${entry.label}`, {
                id: entry.id,
                description: entry.message,
                duration: 15000,
              })
            }
          }
        }

        since = data.now
      } catch {
        // network blip: try again next tick
      }
    }

    // Any real user activity marks the editor as active again.
    const markActive = () => {
      const wasIdle = isIdle()
      lastActivity = Date.now()
      if (wasIdle) void poll() // resume immediately, no waiting for the next tick
    }

    const onVisibility = () => {
      if (!document.hidden) markActive()
    }

    const activityEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, markActive, { capture: true, passive: true }),
    )
    document.addEventListener('visibilitychange', onVisibility)

    void poll()
    const timer = window.setInterval(() => void poll(), POLL_MS)

    return () => {
      stopped = true
      window.clearInterval(timer)
      activityEvents.forEach((evt) => window.removeEventListener(evt, markActive, true))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return null
}