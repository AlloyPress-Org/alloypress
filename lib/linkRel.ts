const INTERNAL_DOMAINS = ['alloypress.com']

// "google.com" -> "https://google.com"
export function normalizeUrl(url?: string | null): string {
  const u = (url || '').trim()
  if (!u) return u
  if (u.startsWith('//')) return 'https:' + u
  if (/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(u)) return u // has scheme or is relative
  if (/^[^\s/]+\.[a-z]{2,}(\/|\?|#|$)/i.test(u)) return 'https://' + u
  return u
}

export function isInternalUrl(url?: string | null): boolean {
  const u = normalizeUrl(url)
  if (!u) return true
  const hasHost = /^([a-z][a-z0-9+.-]*:)?\/\//i.test(u)
  if (!hasHost) return true // /blogs/x, #section, mailto:, tel:
  try {
    const host = new URL(u).hostname.toLowerCase()
    return INTERNAL_DOMAINS.some((d) => host === d || host.endsWith('.' + d))
  } catch {
    return false
  }
}

export type FollowMode = 'auto' | 'dofollow' | 'nofollow'

export function buildLinkAttrs(opts: {
  url: string
  linkType?: string
  newTab?: boolean
  followMode?: FollowMode | null
  legacyNofollow?: boolean | null
  sponsored?: boolean | null
  noopener?: boolean | null
  noreferrer?: boolean | null
}) {
  const url = normalizeUrl(opts.url)

  let mode: FollowMode = opts.followMode ?? 'auto'
  if (mode === 'auto' && opts.legacyNofollow) mode = 'nofollow'

  const internal = opts.linkType === 'internal' || isInternalUrl(url)
  const nofollow = mode === 'nofollow' || (mode === 'auto' && !internal)

  const rel = new Set<string>()
  if (nofollow) rel.add('nofollow')
  if (opts.sponsored) rel.add('sponsored')
  if (opts.newTab || opts.noopener) rel.add('noopener')
  if (opts.noreferrer) rel.add('noreferrer')

  return {
    href: url,
    target: opts.newTab ? '_blank' : undefined,
    rel: rel.size ? Array.from(rel).join(' ') : undefined,
  }
}