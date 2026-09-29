import type { NextConfig } from 'next'

type Pattern = { protocol: 'http' | 'https'; hostname: string; port?: string }

const remotePatterns: Pattern[] = [
  { protocol: 'https', hostname: 'pub-c555bbd45f8b41b3bd6910202b4ee75d.r2.dev' },
  // Old WordPress-era URLs still referenced in migrated content
  { protocol: 'https', hostname: 'staging.alloypress.com' },
  { protocol: 'https', hostname: 'staging1.alloypress.com' },
]

// localhost dev-ku mattum
if (process.env.NODE_ENV !== 'production') {
  remotePatterns.push({ protocol: 'http', hostname: 'localhost', port: '3000' })
}

const nextConfig: NextConfig = {
  images: {
    // Kammi width variants = kammi image transformations
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [96, 192, 384],
    remotePatterns,
  },
}

export default nextConfig