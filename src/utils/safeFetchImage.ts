import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'

/**
 * SSRF-safe image downloader.
 *
 * - http/https only, default ports only (80/443)
 * - every connection's resolved IP is validated at connect time (blocks DNS rebinding)
 * - private / loopback / link-local / metadata ranges are rejected
 * - redirects are followed manually and re-validated on each hop
 * - hard size cap while streaming, hard timeout
 */

export class ImportError extends Error {
  status: number
  constructor(message: string, status = 422) {
    super(message)
    this.status = status
  }
}

const isPrivateIPv4 = (ip: string): boolean => {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local + cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast + reserved
  )
}

export const isPrivateIp = (ip: string): boolean => {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip)

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase()
    if (lower === '::' || lower === '::1') return true
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateIPv4(mapped[1])
    return (
      lower.startsWith('fc') ||
      lower.startsWith('fd') ||
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb') ||
      lower.startsWith('ff')
    )
  }

  return true // not a valid IP -> block
}

// Validates the IP at connection time (not just before the request).
const safeLookup = ((hostname: string, options: dns.LookupOptions, cb: (...args: unknown[]) => void) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return cb(err)
    const safe = (addresses as dns.LookupAddress[]).filter((a) => !isPrivateIp(a.address))
    if (!safe.length) return cb(new ImportError('Blocked address', 400))
    if (options?.all) return cb(null, safe)
    return cb(null, safe[0].address, safe[0].family)
  })
}) as unknown as net.LookupFunction

const requestOnce = (
  url: URL,
  maxBytes: number,
  timeoutMs: number,
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body?: Buffer }> =>
  new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http

    const req = client.request(
      url,
      {
        method: 'GET',
        lookup: safeLookup,
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AlloyPress-Importer/1.0)',
          Accept: 'image/*,*/*;q=0.5',
        },
      },
      (res) => {
        const status = res.statusCode || 0

        if (status >= 300 && status < 400) {
          res.resume()
          return resolve({ status, headers: res.headers })
        }

        if (status < 200 || status >= 300) {
          res.resume()
          return reject(new ImportError(`Source responded with ${status}`))
        }

        const declared = Number(res.headers['content-length'] || 0)
        if (declared > maxBytes) {
          res.destroy()
          return reject(new ImportError('Image is too large'))
        }

        const chunks: Buffer[] = []
        let size = 0

        res.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > maxBytes) {
            res.destroy()
            return reject(new ImportError('Image is too large'))
          }
          chunks.push(chunk)
        })
        res.on('end', () => resolve({ status, headers: res.headers, body: Buffer.concat(chunks) }))
        res.on('error', reject)
      },
    )

    req.on('timeout', () => req.destroy(new ImportError('Source timed out')))
    req.on('error', (e) => reject(e instanceof ImportError ? e : new ImportError(e.message)))
    req.end()
  })

export const fetchImageSafely = async (
  rawUrl: string,
  { maxBytes = 15 * 1024 * 1024, timeoutMs = 20_000, maxRedirects = 4 } = {},
): Promise<{ buffer: Buffer; mimetype: string }> => {
  let url: URL

  try {
    url = new URL(rawUrl)
  } catch {
    throw new ImportError('Invalid URL', 400)
  }

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!['http:', 'https:'].includes(url.protocol)) throw new ImportError('Protocol not allowed', 400)
    if (url.username || url.password) throw new ImportError('Credentials in URL not allowed', 400)

    const port = url.port || (url.protocol === 'https:' ? '443' : '80')
    if (port !== '80' && port !== '443') throw new ImportError('Port not allowed', 400)

    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (net.isIP(host) && isPrivateIp(host)) throw new ImportError('Blocked address', 400)
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
      throw new ImportError('Blocked address', 400)
    }

    const res = await requestOnce(url, maxBytes, timeoutMs)

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.location
      if (!location) throw new ImportError('Redirect without location')
      url = new URL(location, url)
      continue
    }

    const mimetype = String(res.headers['content-type'] || '')
      .split(';')[0]
      .trim()
      .toLowerCase()

    if (!mimetype.startsWith('image/')) throw new ImportError('URL is not an image')

    return { buffer: res.body as Buffer, mimetype }
  }

  throw new ImportError('Too many redirects')
}