import Image from 'next/image'
import type { Media } from '@/lib/cms'

type BlogArticleHeaderProps = {
  title: string
  excerpt?: string
  author?: string
  publishedAt?: string
  updatedAt?: string
  category?: string
  featuredImage?: Media
}

function formatDate(value?: string) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getImageUrl(
  image?: Media,
): string | null {
  if (
    !image?.url ||
    typeof image.url !== 'string'
  ) {
    return null
  }

  return image.url
}

export default function BlogArticleHeader({
  title,
  excerpt,
  author,
  publishedAt,
  updatedAt,
  category,
  featuredImage,
}: BlogArticleHeaderProps) {
  const imageUrl =
    getImageUrl(featuredImage)

  const publishedDate =
    formatDate(publishedAt)

  const updatedDate =
    formatDate(updatedAt)

  return (
    <header className="blog-hero">
      <div className="blog-hero-inner">

        {/* Breadcrumb */}
        <nav
          className="blog-breadcrumb"
          aria-label="Breadcrumb"
        >
          <a href="/">
            AlloyPress
          </a>

          <span>/</span>

          <a href="/blogs">
            Blogs
          </a>

          {category && (
            <>
              <span>/</span>
              <span>{category}</span>
            </>
          )}
        </nav>

        {/* Main hero */}
        <div className="blog-hero-grid">

          <div className="blog-hero-copy">

            {category && (
              <div className="blog-category">
                {category}
              </div>
            )}

            <h1 className="blog-title">
              {title}
            </h1>

            {excerpt && (
              <p className="blog-excerpt">
                {excerpt}
              </p>
            )}

            <div className="blog-meta">

              {author && (
                <div className="blog-author">
                  <span className="blog-author-avatar">
                    {author
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <div>
                    <span className="blog-meta-label">
                      Written by
                    </span>

                    <strong>
                      {author}
                    </strong>
                  </div>
                </div>
              )}

              {publishedDate && (
                <div className="blog-meta-item">
                  <span className="blog-meta-label">
                    Published
                  </span>

                  <time dateTime={publishedAt}>
                    {publishedDate}
                  </time>
                </div>
              )}

              {updatedDate &&
                updatedDate !==
                  publishedDate && (
                  <div className="blog-meta-item">
                    <span className="blog-meta-label">
                      Updated
                    </span>

                    <time dateTime={updatedAt}>
                      {updatedDate}
                    </time>
                  </div>
                )}
            </div>
          </div>

          {/* Hero side card */}
          <aside className="blog-hero-side">
            <div className="blog-hero-side-card">

              <span className="blog-side-eyebrow">
                ALLOY PRESS
              </span>

              <strong>
                Technology,
                AI &amp; Digital
                Insights
              </strong>

              <p>
                Practical insights,
                reviews and guides
                from AlloyPress.
              </p>

              <a href="/blogs">
                Explore articles
                <span>→</span>
              </a>
            </div>
          </aside>
        </div>

        {/* Featured image */}
        {imageUrl && (
          <figure className="blog-featured-image">
            <Image
              src={imageUrl}
              alt={
                featuredImage?.alt ||
                title
              }
              width={
                featuredImage?.width ||
                1200
              }
              height={
                featuredImage?.height ||
                675
              }
              unoptimized
              priority
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 92vw, 900px"
            />
          </figure>
        )}

      </div>
    </header>
  )
}