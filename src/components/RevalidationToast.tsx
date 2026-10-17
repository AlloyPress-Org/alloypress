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

/**
 * Registered in payload.config.ts -> admin.components.actions.
 * Polls /api/revalidation-status and shows a toast when the CMS tells the website
 * to refresh its cache: "Updating website..." -> success / error.
 */
export const RevalidationToast = () => {
  useEffect(() => {
    let stopped = false
    let since: number | null = null
    const shown = new Map<string, 'pending' | 'done'>()

    const poll = async () => {
      if (stopped || document.hidden) return

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

    void poll()
    const timer = window.setInterval(() => void poll(), POLL_MS)

    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [])

  return null
}