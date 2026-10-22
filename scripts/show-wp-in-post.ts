/**
 * Read-only: show exactly WHERE a document still contains "wp-content".
 * Put in apps/cms/scripts/ and run from apps/cms:
 *   npx payload run scripts/show-wp-in-post.ts
 * Other doc:  $env:POST_ID="25"; $env:COLLECTION="posts"; npx payload run scripts/show-wp-in-post.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const COLLECTION = process.env.COLLECTION || 'posts'
const ID = process.env.POST_ID || '25'

const payload = await getPayload({ config })
const doc = (await payload.findByID({
  collection: COLLECTION as never,
  id: ID,
  depth: 0,
  overrideAccess: true,
})) as unknown as Record<string, unknown>

console.log(`${COLLECTION} #${ID}  slug=${String(doc.slug)}  title=${String(doc.title)}`)
console.log('Fields containing wp-content:\n')

let found = 0
const walk = (v: unknown, path: string): void => {
  if (typeof v === 'string') {
    const re = /wp-content/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(v)) !== null) {
      found++
      const a = Math.max(0, m.index - 90)
      const b = Math.min(v.length, m.index + 140)
      console.log(`- path: ${path}\n  ...${v.slice(a, b).replace(/\s+/g, ' ')}...\n`)
    }
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, `${path}[${i}]`))
  } else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k)
  }
}
walk(doc, '')
console.log(found ? `Total matches: ${found}` : 'No wp-content found in this doc.')
process.exit(0)