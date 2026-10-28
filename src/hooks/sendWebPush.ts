type Args = { title: string; message: string; url: string; image?: string; audience: 'all' | 'test' }

export function sendWebPush(a: Args, logger: { warn: (m: string) => void; error: (m: string) => void }) {
  const key = process.env.WEBPUSHR_API_KEY
  const token = process.env.WEBPUSHR_AUTH_TOKEN
  const testSeg = process.env.WEBPUSHR_TEST_SEGMENT_ID
  if (!key || !token) return logger.warn('Webpushr keys missing')
  if (a.audience === 'test' && !testSeg) return logger.warn('WEBPUSHR_TEST_SEGMENT_ID missing')

  const endpoint = a.audience === 'test' ? 'send/segment' : 'send/all'
  const body: Record<string, unknown> = {
    title: a.title.slice(0, 80),
    message: a.message.slice(0, 120) || a.title,
    target_url: a.url,
    image: a.image,
    expire_push: '2d',
  }
  if (a.audience === 'test') body.segments = [testSeg]

  setTimeout(() => void (async () => {
    try {
      const res = await fetch(`https://api.webpushr.com/v1/notification/${endpoint}`, {
        method: 'POST',
        headers: { webpushrKey: key, webpushrAuthToken: token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) logger.error(`Webpushr ${res.status} ${await res.text()}`)
    } catch (e) { logger.error(`Webpushr failed: ${String(e)}`) }
  })(), 10_000) // revalidation aagura varaikkum wait
}