import { getPayload } from 'payload'
import config from '@payload-config'

const MARKER = /ai-faq-question|ai-faq-answer/i
const FAQ_LIKE = /faq|<details|<summary/i

// faq-from-html.ts-la irukkura same regex (updated version)
function countFaqs(html: string): number {
  const re =
    /<(button|summary|div|h[2-6]|p|span)\b[^>]*class=["'][^"']*ai-faq-question[^"']*["'][^>]*>([\s\S]*?)<\/\1>\s*<(div|p|section)\b[^>]*class=["'][^"']*ai-faq-answer[^"']*["'][^>]*>([\s\S]*?)<\/\3>/gi
  return [...html.matchAll(re)].length
}

function collectHtml(node: any, out: string[]) {
  if (!node || typeof node !== 'object') return
  for (const key of ['html', 'code']) {
    if (typeof node[key] === 'string') out.push(node[key])
  }
  if (node.fields) collectHtml(node.fields, out)
  if (Array.isArray(node.children)) node.children.forEach((c: any) => collectHtml(c, out))
  if (node.root) collectHtml(node.root, out)
}

async function main() {
  const payload = await getPayload({ config })
  let page = 1
  let bad = 0

  while (true) {
    const res = await payload.find({
      collection: 'posts',
      limit: 50,
      page,
      depth: 0,
      pagination: true,
    })

    for (const post of res.docs as any[]) {
      const blocks: string[] = []
      collectHtml(post.content, blocks)

      blocks.forEach((html, i) => {
        if (!FAQ_LIKE.test(html)) return
        if (!MARKER.test(html)) {
          bad++
          console.log(`❌ ${post.slug} [block ${i}] FAQ-like HTML but class marker illa`)
        } else if (countFaqs(html) === 0) {
          bad++
          console.log(`⚠️  ${post.slug} [block ${i}] marker irukku but parse aagala (structure mismatch)`)
        }
      })
    }

    if (page >= res.totalPages) break
    page++
  }

  console.log(`\nDone. ${bad} problem block(s).`)
  process.exit(0)
}

main()