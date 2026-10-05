import { getPayload } from 'payload'
import config from '@payload-config'

const MEDIA_BASE = 'https://media.alloypress.com'
const DRY_RUN = false

const norm = (f: string) =>
    f.replace(/^\d+-/, '').replace(/\.[a-z0-9]+$/i, '').toLowerCase()

const payload = await getPayload({ config })

const SKIP = ['media', 'users', 'payload-preferences', 'payload-migrations', 'payload-locked-documents', 'payload-kv']
const COLLECTIONS = payload.config.collections.map((c) => c.slug).filter((s) => !SKIP.includes(s))
console.log('collections:', COLLECTIONS)

// 1. media la irundhu: normalized name -> real R2 filename (main + sizes)
const map = new Map<string, string>()
let page = 1
while (true) {
    const res = await payload.find({ collection: 'media', limit: 500, page, depth: 0 })
    for (const m of res.docs as any[]) {
        if (m.filename) map.set(norm(m.filename), m.filename)
        for (const s of Object.values(m.sizes || {}) as any[]) {
            if (s?.filename && !map.has(norm(s.filename))) map.set(norm(s.filename), s.filename)
        }
    }
    if (!res.hasNextPage) break
    page++
}
console.log('mapped keys:', map.size)

const lookup = (name: string) => {
    const n = norm(decodeURIComponent(name))
    return (
        map.get(n) ||
        map.get(n.replace(/-\d+x\d+$/, '').replace(/-scaled$/, '')) // size illana main image
    )
}

const re = /https?:\/\/(?:www\.)?alloypress\.com\/wp-content\/uploads\/\d{4}\/\d{2}\/([^"'\s)\\<>]+)/g
const missing = new Set<string>()
let updated = 0

for (const collection of COLLECTIONS) {
    let p = 1
    while (true) {
        const res = await payload.find({ collection: collection as any, limit: 50, page: p, depth: 0 })
        for (const doc of res.docs as any[]) {
            const before = JSON.stringify(doc)
            const after = before.replace(re, (full, name) => {
                const key = lookup(name)
                if (!key) { missing.add(name); return full }
                return `${MEDIA_BASE}/${key}`
            })
            if (before !== after) {
                updated++
                console.log('update', collection, doc.id)
                if (!DRY_RUN) {
                    const { id, createdAt, updatedAt, ...data } = JSON.parse(after)
                    await payload.update({ collection: collection as any, id: doc.id, data, depth: 0 })
                }
            }
        }
        if (!res.hasNextPage) break
        p++
    }
}
console.log('docs to update:', updated)
console.log('no match:', [...missing])