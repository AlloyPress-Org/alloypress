// apps/web/src/app/api/newsletter/route.ts  (path adjust pannikonga)
//
// Browser -> this route (server side) -> Payload /api/subscribers/subscribe
// x-internal-key server-la mattum irukkum, browser-ku varaadhu.

import { NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: Request) {
    const body = await req.json().catch(() => null)

    if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const email = String(body.email || '').trim().toLowerCase()
    const interests = Array.isArray(body.interests) ? body.interests : []

    if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    if (interests.length < 1) {
        return NextResponse.json({ error: 'Pick at least one topic to continue.' }, { status: 400 })
    }

    // Cloudflare adds this header. Local dev la irukkaadhu (undefined = fine).
    const countryCode = req.headers.get('cf-ipcountry') || undefined

    // Unga existing payloadFetch use panra base URL env-ah inga use pannunga.
    const baseUrl = process.env.PAYLOAD_API_URL || "http://localhost:3001/api";
    const key = process.env.PAYLOAD_INTERNAL_KEY

    if (!baseUrl || !key) {
        console.error('Newsletter: PAYLOAD_API_URL / PAYLOAD_INTERNAL_KEY missing')
        return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 })
    }

    try {
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/subscribers/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-key': key,
            },
            body: JSON.stringify({
                email,
                interests,
                source: 'home-newsletter',
                website: body.website || '',
                countryCode,
            }),
            cache: 'no-store',
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
            return NextResponse.json(
                { error: data?.error || 'Could not subscribe. Please try again.' },
                { status: res.status === 400 ? 400 : 502 },
            )
        }

        if (!res.ok) {
            console.error('Newsletter: Payload responded', res.status, data)   // <-- add
            return NextResponse.json(
                { error: data?.error || 'Could not subscribe. Please try again.' },
                { status: res.status === 400 ? 400 : 502 },
            )
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('Newsletter subscribe failed:', err)
        return NextResponse.json({ error: 'Could not subscribe. Please try again.' }, { status: 502 })
    }
}