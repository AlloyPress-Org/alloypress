import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'

import { finishRevalidation, startRevalidation } from './revalidationLog'

type Logger = { warn: (m: string) => void; error: (m: string) => void }

const DELAY_MS = 3000

const SECOND_PURGE_DELAY_MS = 75000

type RevalidateInfo = {
  revalidated?: unknown
  edgePurge?: unknown
}

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

  const post = (payload: Record<string, unknown>) =>
    fetch(webUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })

  const scheduleSecondPurge = () => {
    if (body.skipEdgePurge === true) return

    setTimeout(() => {
      void (async () => {
        try {
          const response = await post({ purgeOnly: true })

          if (!response.ok) {
            logger.error(
              `Second Cloudflare purge failed for ${label}: HTTP ${response.status}`,
            )
            return
          }

          const info = (await response.json().catch(() => null)) as RevalidateInfo | null

          if (info?.edgePurge !== 'ok') {
            logger.error(
              `Second Cloudflare purge for ${label} returned "${String(info?.edgePurge)}".`,
            )
          }
        } catch (err) {
          logger.error(
            `Second Cloudflare purge error for ${label}: ${err instanceof Error ? err.message : String(err)}`,
          )
        }
      })()
    }, SECOND_PURGE_DELAY_MS)
  }

  setTimeout(() => {
    void (async () => {
      let lastProblem = ''
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await post(body)
          if (response.ok) {
            const info = (await response.json().catch(() => null)) as RevalidateInfo | null
            const tags = Array.isArray(info?.revalidated) ? info.revalidated.length : null
            const edge = typeof info?.edgePurge === 'string' ? info.edgePurge : null
            const base =
              tags === null ? 'Website cache refreshed.' : `Website cache refreshed (${tags} tags).`

            if (edge === 'skipped' && process.env.NODE_ENV === 'production') {
              logger.error(
                `Cloudflare edge purge SKIPPED for ${label}: CF_ZONE_ID / CF_API_TOKEN are missing on the website Worker.`,
              )
              finishRevalidation(
                entryId,
                'error',
                `${base} But the Cloudflare edge purge was SKIPPED: CF_ZONE_ID / CF_API_TOKEN are missing on the website Worker, so old pages can stay cached.`,
              )
              return
            }

            if (edge === 'failed') {
              logger.error(`Cloudflare edge purge FAILED for ${label}. Check the website Worker logs.`)
              finishRevalidation(
                entryId,
                'error',
                `${base} But the Cloudflare edge purge FAILED. Check CF_API_TOKEN (needs Zone > Cache Purge > Purge) and the Worker logs.`,
              )
              return
            }

            finishRevalidation(
              entryId,
              'success',
              edge === 'ok' ? `${base} Edge cache purged.` : base,
            )

            scheduleSecondPurge()
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

/* Image slots (own ads) */
export const imageSlotAfterChange: CollectionAfterChangeHook = async ({ req }) => {
  await sendWebRevalidation({ scope: 'image-slots' }, req.payload.logger, 'image slots')
}
export const imageSlotAfterDelete: CollectionAfterDeleteHook = async ({ req }) => {
  await sendWebRevalidation({ scope: 'image-slots' }, req.payload.logger, 'deleted image slot')
}


/* Redirects */
export const redirectAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const from = str(doc?.from)
  if (!from) return
  await sendWebRevalidation({ scope: 'redirect', from }, req.payload.logger, `redirect "${from}"`)

  // "From URL" maathinaa, pazhaya URL-um clear aaganum
  const prev = str(previousDoc?.from)
  if (prev && prev !== from) {
    await sendWebRevalidation(
      { scope: 'redirect', from: prev, skipEdgePurge: true },
      req.payload.logger,
      `redirect "${prev}" (old)`,
    )
  }
}
export const redirectAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const from = str(doc?.from)
  if (!from) return
  await sendWebRevalidation({ scope: 'redirect', from }, req.payload.logger, `deleted redirect "${from}"`)
}