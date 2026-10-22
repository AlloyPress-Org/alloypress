/**
 * Remove dead wp-content links/embeds from ONE post's rich text.
 * Put in apps/cms/scripts/ and run from apps/cms:
 *   1) Preview (changes nothing):  npx payload run scripts/fix-post-wp-links.ts
 *   2) Apply (PowerShell):         $env:APPLY="1"; npx payload run scripts/fix-post-wp-links.ts
 * Other post: $env:POST_ID="90"
 * Rules: a link node -> replaced by its plain text; any other node (embed/block/upload) -> removed.
 * The previous content stays in the post's Versions tab in the admin (can be restored).
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const ID = process.env.POST_ID || '25'
const APPLY = process.env.APPLY === '1'
const WP = /wp-content/i

type LNode = {
  type?: string
  text?: string
  url?: string
  fields?: { url?: unknown; [k: string]: unknown }
  children?: LNode[]
  [k: string]: unknown
}

const textOf = (n: LNode): string =>
  (typeof n.text === 'string' ? n.text : '') + (n.children ?? []).map(textOf).join('')

const log: string[] = []

const clean = (nodes: LNode[], path: string): LNode[] => {
  const out: LNode[] = []
  nodes.forEach((node, i) => {
    const p = `${path}[${i}]`
    const url = node.fields?.url ?? node.url
    if (typeof url === 'string' && WP.test(url)) {
      if (node.type === 'link' || node.type === 'autolink') {
        log.push(`UNLINK  ${p} (${node.type}) text="${textOf(node).slice(0, 80)}"`)
        out.push(...clean(node.children ?? [], `${p}.children`))
      } else {
        log.push(`REMOVE  ${p} (${node.type}/${String(node.fields?.blockType ?? '')}) url=${url}`)
      }
      return
    }
    if (Array.isArray(node.children)) node.children = clean(node.children, `${p}.children`)
    out.push(node)
  })
  return out
}

const payload = await getPayload({ config })
const doc = (await payload.findByID({
  collection: 'posts',
  id: ID,
  depth: 0,
  overrideAccess: true,
})) as unknown as { slug?: string; title?: string; content?: { root?: LNode } }

console.log(`posts #${ID} slug=${doc.slug} title=${doc.title}`)
console.log(APPLY ? 'MODE: APPLY' : 'MODE: PREVIEW (nothing changed)')

const content = JSON.parse(JSON.stringify(doc.content ?? {})) as { root?: LNode }
if (!content.root || !Array.isArray(content.root.children)) {
  console.log('No rich-text content found. Nothing to do.')
  process.exit(0)
}
content.root.children = clean(content.root.children, 'root')
log.forEach((l) => console.log('  ' + l))

const left = JSON.stringify(content).match(/wp-content/gi)?.length ?? 0
console.log(`\nchanges: ${log.length}   wp-content left in content after clean: ${left}`)

if (APPLY && log.length > 0) {
  await payload.update({
    collection: 'posts',
    id: ID,
    data: { content } as never,
    depth: 0,
    overrideAccess: true,
  })
  console.log('Post updated.')
} else if (!APPLY) {
  console.log('Preview only. Re-run with APPLY=1 to save.')
}
process.exit(0)