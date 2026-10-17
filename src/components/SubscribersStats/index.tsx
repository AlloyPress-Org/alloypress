import type { ServerProps, Where } from 'payload'
import {
  Users,
  UserCheck,
  UserX,
  Globe,
  Send,
  BookOpen,
  Wrench,
  Scale,
  Newspaper,
  Download,
} from 'lucide-react'

/**
 * Subscribers list top-la icon stat cards + CSV export.
 * Path: apps/cms/src/components/SubscribersStats/index.tsx
 *
 * Layout: 5-column grid, ellaa cards-um same size.
 *   Row 1: Total | Active | Unsubscribed | From Website | From Webpushr
 *   Row 2: 4 topics | Export CSV
 */

const TOPICS = [
  { value: 'guides-tutorials', label: 'Guides & Tutorials', Icon: BookOpen, rgb: '20,184,166' },
  { value: 'tools-recommendations', label: 'Tools & Recommendations', Icon: Wrench, rgb: '99,102,241' },
  { value: 'reviews-comparisons', label: 'Reviews & Comparisons', Icon: Scale, rgb: '236,72,153' },
  { value: 'news-updates', label: 'News & Updates', Icon: Newspaper, rgb: '14,165,233' },
]

const css = `
.sub-stats {
  padding: 20px var(--gutter-h) 16px;
  box-sizing: border-box;
  width: 100%;
}
.sub-stats__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.sub-stats__card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 96px;
  padding: 14px 16px;
  box-sizing: border-box;
  min-width: 0;
  border: 1px solid rgba(var(--c), 0.32);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--c), 0.14), rgba(var(--c), 0.03));
}
.sub-stats__icon {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(var(--c), 0.2);
  color: rgb(var(--c));
}
.sub-stats__body {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sub-stats__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--theme-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub-stats__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--theme-text);
}
.sub-stats__desc {
  font-size: 11.5px;
  line-height: 1.2;
  color: var(--theme-elevation-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub-stats__buttons {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}
.sub-stats__btn {
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(var(--c), 0.45);
  background: rgba(var(--c), 0.12);
  color: var(--theme-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
}
.sub-stats__btn:hover {
  background: rgba(var(--c), 0.25);
}
@media (max-width: 1200px) {
  .sub-stats__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .sub-stats__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
`

type Card = {
  title: string
  value: number
  desc: string
  rgb: string
  Icon: React.ElementType
}

const rgbStyle = (rgb: string) => ({ '--c': rgb }) as React.CSSProperties

export default async function SubscribersStats({ payload, user }: ServerProps) {
  const count = async (where?: Where): Promise<number> => {
    const res = await payload.count({
      collection: 'subscribers',
      where,
      user,
      overrideAccess: false,
    })
    return res.totalDocs
  }

  const [total, active, unsubscribed, website, imported, ...topicCounts] = await Promise.all([
    count(),
    count({ status: { equals: 'active' } }),
    count({ status: { equals: 'unsubscribed' } }),
    count({ source: { equals: 'home-newsletter' } }),
    count({ source: { equals: 'webpushr-import' } }),
    ...TOPICS.map((t) => count({ interests: { equals: t.value } } as Where)),
  ])

  const stats: Card[] = [
    { title: 'Total Subscribers', value: total, desc: 'All time subscribers', rgb: '24,183,107', Icon: Users },
    { title: 'Active Subscribers', value: active, desc: 'Currently active', rgb: '59,130,246', Icon: UserCheck },
    { title: 'Unsubscribed', value: unsubscribed, desc: 'Opted out from emails', rgb: '239,68,68', Icon: UserX },
    { title: 'From Website', value: website, desc: 'Subscribed via website', rgb: '139,92,246', Icon: Globe },
    { title: 'From Webpushr', value: imported, desc: 'Imported via Webpushr', rgb: '245,158,11', Icon: Send },
  ]

  const topicCards: Card[] = TOPICS.map((t, i) => ({
    title: t.label,
    value: topicCounts[i],
    desc: 'Interested subscribers',
    rgb: t.rgb,
    Icon: t.Icon,
  }))

  return (
    <div className="sub-stats">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="sub-stats__grid">
        {[...stats, ...topicCards].map((c) => (
          <div key={c.title} className="sub-stats__card" style={rgbStyle(c.rgb)}>
            <span className="sub-stats__icon">
              <c.Icon size={22} strokeWidth={1.9} />
            </span>
            <div className="sub-stats__body">
              <span className="sub-stats__title">{c.title}</span>
              <span className="sub-stats__value">{c.value}</span>
              <span className="sub-stats__desc">{c.desc}</span>
            </div>
          </div>
        ))}

        {/* Export card */}
        <div className="sub-stats__card" style={rgbStyle('148,163,184')}>
          <span className="sub-stats__icon">
            <Download size={22} strokeWidth={1.9} />
          </span>
          <div className="sub-stats__body">
            <span className="sub-stats__title">Export CSV</span>
            <div className="sub-stats__buttons">
              <a href="/api/subscribers/export-csv" download className="sub-stats__btn">
                All
              </a>
              <a
                href="/api/subscribers/export-csv?status=active"
                download
                className="sub-stats__btn"
              >
                Active
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}