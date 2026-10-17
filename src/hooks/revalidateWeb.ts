import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'

import { finishRevalidation, startRevalidation } from './revalidationLog'

type Logger = { warn: (m: string) => void; error: (m: string) => void }

const DELAY_MS = 3000

// Fire-and-forget. Payload hooks run inside the DB transaction, so wait a few
// seconds for the commit before telling the website, and never block the admin save.
// The result (success / failure) is also recorded in revalidationLog so the admin UI
// can show a toast (see components/RevalidationToast.tsx).
export function sendWebRevalidation(
  body: Record<string, unknown>,
  logger: Logger,
  label: string,
): void {
  const webUrl = process.env.WEB_REVALIDATION_URL
  const secret = process.env.REVALIDATION_SECRET
  const entryId = startRevalidation(label)

  if (!webUrl || !secret) {
    logger.warn('Revalidation skipped: WEB_REVALIDATION_URL or REVALIDATION_SECRET is missing.')
    finishRevalidation(
      entryId,
      'error',
      'WEB_REVALIDATION_URL or REVALIDATION_SECRET is missing on the CMS server.',
    )
    return
  }

  setTimeout(() => {
    void (async () => {
      let lastProblem = ''
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(webUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8000),
          })
          if (response.ok) {
            const info = (await response.json().catch(() => null)) as {
              revalidated?: unknown
            } | null
            const tags = Array.isArray(info?.revalidated) ? info.revalidated.length : null
            finishRevalidation(
              entryId,
              'success',
              tags === null ? 'Website cache refreshed.' : `Website cache refreshed (${tags} tags).`,
            )
            return
          }
          const text = await response.text().catch(() => '')
          lastProblem = `HTTP ${response.status} ${text || response.statusText}`
          if ([400, 401, 403].includes(response.status)) break
        } catch (err) {
          lastProblem = err instanceof Error ? err.message : String(err)
        }
        if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1000))
      }
      logger.error(`REVALIDATION FAILED for ${label} (${lastProblem}). Site updates only when cache TTL expires. Check REVALIDATION_SECRET / WEB_REVALIDATION_URL.`)
      finishRevalidation(entryId, 'error', lastProblem || 'Unknown error')
    })()
  }, DELAY_MS)
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined

/* Categories */
export const categoryAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const slug = str(doc?.slug)
  if (!slug) return
  const prev = str(previousDoc?.slug)
  await sendWebRevalidation(
    { scope: 'category', categorySlug: slug, previousCategorySlug: prev && prev !== slug ? prev : undefined },
    req.payload.logger, `category "${slug}"`,
  )
}
export const categoryAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const slug = str(doc?.slug)
  if (!slug) return
  await sendWebRevalidation({ scope: 'category', categorySlug: slug }, req.payload.logger, `deleted category "${slug}"`)
}

/* Pages */
export const pageAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const slug = str(doc?.slug)
  if (!slug) return
  const prev = str(previousDoc?.slug)
  await sendWebRevalidation(
    { scope: 'page', pageSlug: slug, previousPageSlug: prev && prev !== slug ? prev : undefined },
    req.payload.logger, `page "${slug}"`,
  )
}
export const pageAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const slug = str(doc?.slug)
  if (!slug) return
  await sendWebRevalidation({ scope: 'page', pageSlug: slug }, req.payload.logger, `deleted page "${slug}"`)
}

/* Homepage settings */
export const homepageAfterChange: CollectionAfterChangeHook = async ({ req }) => {
  await sendWebRevalidation({ scope: 'homepage' }, req.payload.logger, 'homepage settings')
}
export const homepageAfterDelete: CollectionAfterDeleteHook = async ({ req }) => {
  await sendWebRevalidation({ scope: 'homepage' }, req.payload.logger, 'deleted homepage settings')
}

/* Media: edits/replacements only. New uploads skipped on purpose. */
export const mediaAfterChange: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'update' || doc?.id == null) return
  await sendWebRevalidation({ scope: 'media', mediaId: String(doc.id) }, req.payload.logger, `media ${doc.id}`)
}
export const mediaAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (doc?.id == null) return
  await sendWebRevalidation({ scope: 'media', mediaId: String(doc.id) }, req.payload.logger, `deleted media ${doc.id}`)
}