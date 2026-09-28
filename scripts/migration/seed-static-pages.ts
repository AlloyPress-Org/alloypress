import dotenv from 'dotenv'
import { getPayload } from 'payload'

// Load CMS environment before importing Payload config.
dotenv.config({ path: '.env' })

const { default: configPromise } = await import('../../src/payload.config')
const config = await configPromise

type StaticPageSeed = {
  title: string
  slug: string
  seo: {
    title: string
    description: string
    canonicalURL: string
  }
}

/**
 * These are the existing AlloyPress static routes.
 *
 * IMPORTANT:
 * - This seed creates the Page records only.
 * - It does NOT replace the existing page.tsx UI/content.
 * - Existing Page content is preserved on update.
 * - The operation is idempotent and can safely be run again.
 */
const STATIC_PAGES: readonly StaticPageSeed[] = [
  {
    title: 'About AlloyPress',
    slug: 'about',
    seo: {
      title: 'About AlloyPress',
      description:
        'AlloyPress is an independent AI editorial publication. We test AI tools hands-on, write what we actually find, and help readers choose without expensive trial and error.',
      canonicalURL: '/about',
    },
  },
  {
    title: 'Contact AlloyPress',
    slug: 'contact',
    seo: {
      title: 'Contact AlloyPress — AI Reviews, Partnerships & Enquiries',
      description:
        'Contact AlloyPress for AI tool reviews, article inclusion, partnerships, editorial enquiries, and other collaboration requests.',
      canonicalURL: '/contact',
    },
  },
  {
    title: 'Do Not Sell or Share My Personal Information',
    slug: 'do-not-sell',
    seo: {
      title: 'Do Not Sell or Share My Personal Information | AlloyPress',
      description:
        'Learn how AlloyPress handles personal information and how to submit a request regarding the sale or sharing of personal information.',
      canonicalURL: '/do-not-sell',
    },
  },
  {
    title: 'AI Tool Article Inclusion',
    slug: 'get-featured',
    seo: {
      title: 'AI Tool Article Inclusion',
      description:
        'Submit your AI tool for consideration in AlloyPress editorial lists and alternatives articles. Learn how inclusion works, what we evaluate, and what to expect.',
      canonicalURL: '/get-featured',
    },
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    seo: {
      title: 'Privacy Policy',
      description:
        'Learn how AlloyPress collects, uses, protects, and retains information, including cookies, analytics, affiliate links, advertising, GDPR and CCPA privacy rights.',
      canonicalURL: '/privacy-policy',
    },
  },
  {
    title: 'Terms and Conditions',
    slug: 'terms',
    seo: {
      title: 'Terms and Conditions',
      description:
        'Read the Terms and Conditions governing use of AlloyPress, editorial coverage, sponsored content, payments, affiliate relationships, intellectual property, privacy, and website use.',
      canonicalURL: '/terms',
    },
  },
  {
    title: 'AI Tool Testing Partner',
    slug: 'testing-partner',
    seo: {
      title: 'AI Tool Testing Partner',
      description:
        'Partner with AlloyPress for structured, real-world AI tool testing, competitive benchmarking, and business/SEO input grounded in category experience.',
      canonicalURL: '/testing-partner',
    },
  },
  {
    title: 'AI Tool Reviews — Tested Before We Recommend',
    slug: 'review-tool',
    seo: {
      title: 'AI Tool Reviews — Tested Before We Recommend',
      description:
        'Request an AlloyPress AI tool review. We test real workflows, verify claims, explain limitations, and publish practical, reader-first reviews.',
      canonicalURL: '/review-tool',
    },
  },
]

const run = async () => {
  const payload = await getPayload({ config })

  let created = 0
  let updated = 0
  let unchanged = 0

  console.log('')
  console.log('==============================================')
  console.log(' AlloyPress — Seed Static Page Records')
  console.log('==============================================')
  console.log(`Target pages: ${STATIC_PAGES.length}`)
  console.log('')

  for (const page of STATIC_PAGES) {
    const existing = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: page.slug,
        },
      },
      limit: 10,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.docs.length > 1) {
      throw new Error(
        `Duplicate Page records found for slug "${page.slug}". ` +
          'Resolve the duplicates before running this seed again.',
      )
    }

    const data = {
      title: page.title,
      slug: page.slug,
      status: 'published' as const,
      seo: page.seo,
    }

    if (existing.docs.length === 0) {
      const createdPage = await payload.create({
        collection: 'pages',
        data,
        overrideAccess: true,
      })

      created += 1

      console.log(
        `✓ CREATED  /${page.slug}  → Payload ID ${createdPage.id}`,
      )

      continue
    }

    const current = existing.docs[0]

    const currentSeo = current.seo ?? {}

    const isSame =
      current.title === data.title &&
      current.slug === data.slug &&
      current.status === data.status &&
      currentSeo.title === data.seo.title &&
      currentSeo.description === data.seo.description &&
      currentSeo.canonicalURL === data.seo.canonicalURL

    if (isSame) {
      unchanged += 1
      console.log(`• UNCHANGED /${page.slug} → Payload ID ${current.id}`)
      continue
    }

    const updatedPage = await payload.update({
      collection: 'pages',
      id: current.id,
      data,
      overrideAccess: true,
    })

    updated += 1

    console.log(
      `↻ UPDATED  /${page.slug}  → Payload ID ${updatedPage.id}`,
    )
  }

  console.log('')
  console.log('----------------------------------------------')
  console.log(`Created:   ${created}`)
  console.log(`Updated:   ${updated}`)
  console.log(`Unchanged: ${unchanged}`)
  console.log(`Total:     ${STATIC_PAGES.length}`)
  console.log('----------------------------------------------')

  if (created + updated + unchanged !== STATIC_PAGES.length) {
    throw new Error('Seed verification failed: page counts do not match.')
  }

  console.log('✓ STATIC PAGE SEED FINISHED')
  console.log('')
}

try {
  await run()
} catch (error) {
  console.error('')
  console.error('✗ STATIC PAGE SEED FAILED')
  console.error(error)
  console.error('')
  process.exitCode = 1
}
