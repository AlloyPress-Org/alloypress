import { cache } from 'react'

const CMS_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL

export const getHomepageSettings = cache(async () => {
  const url = new URL(`${CMS_URL}/api/homepage-settings`)

  url.searchParams.set('limit', '1')
  url.searchParams.set('depth', '2')

  const response = await fetch(url.toString(), {
    next: {
      revalidate: 300,
      tags: ['homepage'],
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch homepage settings')
  }

  const data = await response.json()

  return data.docs?.[0] ?? null
})