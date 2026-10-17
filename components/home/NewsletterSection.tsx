'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

// Values must match NEWSLETTER_INTERESTS in the CMS Subscribers collection.
const INTERESTS = [
  { value: 'guides-tutorials', label: 'AI Guides & Tutorials' },
  { value: 'tools-recommendations', label: 'AI Tools & Recommendations' },
  { value: 'reviews-comparisons', label: 'AI Tool Reviews & Comparisons' },
  { value: 'news-updates', label: 'AI News & Updates' },
] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Status = 'idle' | 'loading' | 'success'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const emailValid = EMAIL_RE.test(email.trim())
  const showInterests = emailValid

  function toggleInterest(value: string) {
    setError('')
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'loading') return

    if (!emailValid) {
      setError('Please enter a valid email address.')
      return
    }

    if (selected.length < 1) {
      setError('Pick at least one topic to continue.')
      return
    }

    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          interests: selected,
          website,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        setStatus('idle')
        return
      }

      setStatus('success')
    } catch {
      setError('Network error. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <section className="newsletter-section">
      <div className="newsletter-inner">

        {/* LEFT CONTENT */}
        <div className="newsletter-content">

          <div className="newsletter-eyebrow">
          {/* eyebrow */}
          </div>

          <h2>
            The AI tools worth your
            <br />
            attention, tested and
            <br />
            curated.
          </h2>

          <p>
            One email a week. No filler, no hype. Just the
            <br />
            tools we’ve actually tested, the updates worth
            <br />
            knowing, and the occasional deal worth taking.
          </p>

          <div className="newsletter-benefits">
            <div className="newsletter-benefit">
              <span className="benefit-check">✓</span>
              <strong>No spam</strong>
            </div>

            <span className="benefit-divider">|</span>

            <div className="newsletter-benefit">
              <span className="benefit-check">✓</span>
              <strong>Unsubscribe anytime</strong>
            </div>
          </div>

          <div className="newsletter-meta">
            Curated by AlloyPress
          </div>

        </div>

        {/* RIGHT FORM */}
        <div className="newsletter-form-wrap">

          {status === 'success' ? (
            <div className="newsletter-success" role="status">
              <span className="benefit-check">✓</span>
              <div>
                <strong>You’re in!</strong>
                <p>Thanks for joining the AlloyPress community. 💚</p>
              </div>
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubmit} noValidate>

              <div className="newsletter-form-row">
                <label htmlFor="newsletter-email" className="sr-only">
                  Your email address
                </label>

                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Your email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  required
                />

                <button type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Joining…' : 'Join Free'}
                </button>
              </div>

              {/* Honeypot: hidden from humans, bots fill it */}
              <input
                type="text"
                name="website"
                className="nl-hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />

              {/* Interests: slide down once email is valid */}
              <div
                className={`newsletter-interests ${showInterests ? 'is-open' : ''}`}
                aria-hidden={!showInterests}
              >
                <div className="newsletter-interests-inner">
                  <p className="newsletter-interests-label" id="nl-interests-label">
                    What do you want to hear about? Pick 1–4.
                  </p>

                  <div
                    className="newsletter-chips"
                    role="group"
                    aria-labelledby="nl-interests-label"
                  >
                    {INTERESTS.map((item) => {
                      const active = selected.includes(item.value)

                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`interest-chip ${active ? 'is-selected' : ''}`}
                          aria-pressed={active}
                          tabIndex={showInterests ? 0 : -1}
                          onClick={() => toggleInterest(item.value)}
                        >
                          <span className="interest-chip-check" aria-hidden="true">
                            {active ? '✓' : '+'}
                          </span>
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <p className="newsletter-error" role="alert">
                  {error}
                </p>
              )}

            </form>
          )}

          <p className="newsletter-note">
            Discover the best AI tools, honest reviews and helpful comparisons.
          </p>

        </div>

      </div>
    </section>
  )
}