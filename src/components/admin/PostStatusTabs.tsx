import type { BeforeListServerProps } from 'payload'
import React from 'react'

import { PostStatusTabsClient } from './PostStatusTabsClient'

export async function PostStatusTabs({ payload, user }: BeforeListServerProps) {
  const countByStatus = async (status?: 'published' | 'draft'): Promise<number> => {
    const result = await payload.find({
      collection: 'posts',
      ...(status ? { where: { _status: { equals: status } } } : {}),
      draft: true,
      depth: 0,
      limit: 1,
      pagination: true,
      select: { slug: true },
      user,
      overrideAccess: false,
    })

    return result.totalDocs
  }

  const [all, published, draft] = await Promise.all([
    countByStatus(),
    countByStatus('published'),
    countByStatus('draft'),
  ])

  return <PostStatusTabsClient counts={{ all, published, draft }} />
}