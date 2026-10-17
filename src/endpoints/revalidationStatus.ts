import type { Endpoint } from 'payload'
import { revalidationEntriesSince } from '../hooks/revalidationLog'

export const revalidationStatusEndpoint: Endpoint = {
  path: '/revalidation-status',
  method: 'get',
  handler: (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const since = Number(new URL(req.url || 'http://localhost').searchParams.get('since'))

    return Response.json({
      now: Date.now(),
      entries: Number.isFinite(since) ? revalidationEntriesSince(since) : [],
    })
  },
}