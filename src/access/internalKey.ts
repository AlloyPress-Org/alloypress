import type { Access, PayloadRequest } from 'payload'

/**
 * The website (Cloudflare Worker) sends `x-internal-key` on every request
 * (see payloadFetch in the web app). Anonymous callers without it are rejected,
 * so bots can no longer hit Neon through the public API.
 */
export const hasInternalKey = (req: PayloadRequest): boolean => {
  const key = process.env.PAYLOAD_INTERNAL_KEY
  return Boolean(key) && req.headers.get('x-internal-key') === key
}

// Logged-in users (admin / editor / viewer) OR the website with the key.
export const internalOrUser: Access = ({ req }) =>
  Boolean(req.user) || hasInternalKey(req)

// For custom endpoints (they bypass collection access control).
export const forbidUnlessInternalOrUser = (
  req: PayloadRequest,
): Response | null =>
  req.user || hasInternalKey(req)
    ? null
    : Response.json({ error: 'Forbidden' }, { status: 403 })