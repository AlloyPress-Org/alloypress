import 'dotenv/config'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { parse } from 'csv-parse/sync'
import countries from 'i18n-iso-countries'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const require = createRequire(import.meta.url)
countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

const DRY = process.env.DRY === '1'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const payload = await getPayload({ config })

const rows = parse(fs.readFileSync('./webpushr.csv'), {
  columns: true,
  skip_empty_lines: true,
  trim: true,
}) as Record<string, string>[]

let created = 0
let skipped = 0
let noCountry = 0

for (const r of rows) {
  // ---- email ----
  const email = String(r['Email Address'] || '').trim().toLowerCase()

  if (!EMAIL_RE.test(email)) {
    console.log('bad email:', email)
    skipped++
    continue
  }

  // ---- duplicate check ----
  const dup = await payload.find({
    collection: 'subscribers',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })

  if (dup.totalDocs) {
    skipped++
    continue
  }

  // ---- country (CSV la 2-letter code irukku: KR, US, PK...) ----
  const rawCountry = String(r['Country'] || '').trim()

  const countryCode = /^[A-Za-z]{2}$/.test(rawCountry)
    ? rawCountry.toUpperCase()
    : rawCountry
      ? countries.getAlpha2Code(rawCountry, 'en')
      : undefined

  if (!countryCode) {
    noCountry++
    if (rawCountry) console.log('country not matched:', rawCountry)
  }

  // ---- date (assumes UTC) ----
  const parsedDate = new Date(
    String(r['Date Opted In'] || '').trim().replace(' ', 'T') + 'Z',
  )

  const subscribedAt = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString()

  // ---- create ----
  if (!DRY) {
    await payload.create({
      collection: 'subscribers',
      data: {
        email,
        status: 'active',
        source: 'webpushr-import',
        subscribedAt,
        ...(countryCode ? { countryCode } : {}),
      } as any,
    })
  }

  created++
}

console.log({ total: rows.length, created, skipped, noCountry, dryRun: DRY })
process.exit(0)