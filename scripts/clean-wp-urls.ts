import { getPayload } from 'payload'
import config from '@payload-config'

const APPLY = process.env.APPLY === '1'
const CLEAR_ORIGINAL_URL = process.env.CLEAR_ORIGINAL_URL === '1'

const hasWp = (v: unknown): boolean => typeof v === 'string' && /wp-content/i.test(v)
// whole value is exactly one wp-content URL (nothing else typed by a human)
const isBareWpUrl = (v: unknown): boolean =>
  typeof v === 'string' &&
  /^https?:\/\/(?:www\.)?alloypress\.com\/wp-content\/uploads\/\S+$/i.test(v.trim())

const payload = await getPayload({ config })

console.log(
  APPLY
    ? `MODE: APPLY (clear caption/description${CLEAR_ORIGINAL_URL ? ' + originalUrl' : ''})`
    : 'MODE: SCAN ONLY (nothing will be changed)',
)

/* ---------- 1. Content collections: anything still pointing at wp-content? ---------- */
const SKIP = [
  'media',
  'users',
  'payload-preferences',
  'payload-migrations',
  'payload-locked-documents',
  'payload-kv',
]
const collections = payload.config.collections.map((c) => c.slug).filter((s) => !SKIP.includes(s))

let contentHits = 0
for (const slug of collections) {
  let page = 1
  let scanned = 0
  const hits: Array<string | number> = []
  while (true) {
    const res = await payload.find({ collection: slug as never, limit: 100, page, depth: 0 })
    for (const doc of res.docs as unknown as Array<Record<string, unknown>>) {
      scanned++
      if (JSON.stringify(doc).includes('wp-content')) hits.push(doc.id as string | number)
    }
    if (!res.hasNextPage) break
    page++
  }
  contentHits += hits.length
  console.log(
    `[content] ${slug}: scanned ${scanned}, with wp-content links: ${hits.length}` +
      (hits.length ? `  ids=${hits.slice(0, 30).join(',')}` : ''),
  )
}

/* ---------- 2. Media: originalUrl / caption / description ---------- */
let mediaTotal = 0
let withOriginal = 0
let junkCaption = 0
let junkDescription = 0
let manualReview = 0
let updated = 0
let failed = 0

let page = 1
while (true) {
  const res = await payload.find({ collection: 'media', limit: 100, page, depth: 0 })
  for (const m of res.docs as unknown as Array<Record<string, unknown>>) {
    mediaTotal++
    const data: Record<string, null> = {}

    if (hasWp(m.originalUrl)) {
      withOriginal++
      if (CLEAR_ORIGINAL_URL) data.originalUrl = null
    }
    for (const field of ['caption', 'description'] as const) {
      const v = m[field]
      if (!hasWp(v)) continue
      if (isBareWpUrl(v)) {
        if (field === 'caption') junkCaption++
        else junkDescription++
        data[field] = null
      } else {
        manualReview++
        console.log(`  [review manually] media ${String(m.id)} ${field} contains text + wp URL`)
      }
    }

    if (APPLY && Object.keys(data).length > 0) {
      try {
        await payload.update({ collection: 'media', id: m.id as number, data, depth: 0 })
        updated++
      } catch (err) {
        failed++
        console.error(`  FAILED media ${String(m.id)}:`, err instanceof Error ? err.message : err)
      }
    }
  }
  if (!res.hasNextPage) break
  page++
}

console.log('\n========== SUMMARY ==========')
console.log(`content docs still linking to wp-content : ${contentHits}   (must be 0)`)
console.log(`media scanned                            : ${mediaTotal}`)
console.log(`media with wp originalUrl                : ${withOriginal}`)
console.log(`media with junk caption (bare wp URL)    : ${junkCaption}`)
console.log(`media with junk description (bare URL)   : ${junkDescription}`)
console.log(`needs manual review                      : ${manualReview}`)
if (APPLY) console.log(`media updated: ${updated}, failed: ${failed}`)
else console.log('Nothing changed. Re-run with APPLY=1 to clean.')

process.exit(failed > 0 ? 1 : 0)