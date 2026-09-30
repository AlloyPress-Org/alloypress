"use client";

import { type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  FileText,
  Link2,
  Share2,
  X as LucideX,
} from "lucide-react";
import {
  FaLinkedinIn,
  FaPinterestP,
  FaRedditAlien,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";

type Heading = {
  id: string;
  text: string;
  level: 2;
};

type Props = {
  children: ReactNode;
  headings: Heading[];
  postSlug: string;
  category: string;
  articleTitle: string;
};

type BadgeCopyButtonProps = {
  articlePath: string;
  articleTitle: string;
};

export function BadgeCopyButton({
  articlePath,
  articleTitle,
}: BadgeCopyButtonProps) {
  const [badgeCopied, setBadgeCopied] = useState(false);

  async function copyBadgeEmbedCode() {
    const articleUrl =
      typeof window !== "undefined" && window.location.href
        ? window.location.href
        : `https://alloypress.com${articlePath}`;

    const badgeToolName =
      articleTitle.trim() || "This tool";

    const badgeEmbedCode = `<a href="${articleUrl}"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Featured on AlloyPress — ${badgeToolName}">
  <img
    src="https://alloypress.com/badges/featured.png"
    alt="Featured on AlloyPress"
    width="320"
    height="117"
  />
</a>`;

    try {
      await navigator.clipboard.writeText(badgeEmbedCode);
      setBadgeCopied(true);

      window.setTimeout(() => {
        setBadgeCopied(false);
      }, 1800);
    } catch {
      setBadgeCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="alloypress-badge-copy-button"
      onClick={copyBadgeEmbedCode}
      aria-label={badgeCopied ? "Badge code copied" : "Copy badge code"}
      title={badgeCopied ? "Copied!" : "Copy badge code"}
    >
      {badgeCopied ? (
        <Check aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
    </button>
  );
}

export default function BlogPostInteractions({
  children,
  headings,
  postSlug,
  category,
  articleTitle,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [desktopTocOpen, setDesktopTocOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileToolsVisible, setMobileToolsVisible] = useState(false);
  const [articleUrl, setArticleUrl] = useState("");

  useEffect(() => {
    setArticleUrl(window.location.href);
  }, []);

  useEffect(() => {
    const previousScrollRestoration =
      window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    return () => {
      window.history.scrollRestoration =
        previousScrollRestoration;
    };
  }, [postSlug]);

  useEffect(() => {
    if (!shareOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setShareOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shareOpen]);

  useEffect(() => {
    if (!tocOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setTocOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tocOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 821px)");

    const updateViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    const start = document.getElementById("mobile-tools-start");
    const end = document.getElementById("article-tools-end");

    if (!start || !end) return;

    let heroFinished = false;
    let articleFinished = false;

    const updateVisibility = () => {
      setMobileToolsVisible(heroFinished && !articleFinished);
    };

    const startObserver = new IntersectionObserver(
      ([entry]) => {
        heroFinished = !entry.isIntersecting;
        updateVisibility();
      },
      { root: null, threshold: 0 }
    );

    const endObserver = new IntersectionObserver(
      ([entry]) => {
        articleFinished = entry.isIntersecting;
        updateVisibility();
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "0px 0px -70px 0px",
      }
    );

    startObserver.observe(start);
    endObserver.observe(end);

    return () => {
      startObserver.disconnect();
      endObserver.disconnect();
    };
  }, []);

  function openShareWindow(url: string) {
    const shareWindow = window.open(
      url,
      "alloypress-share",
      "noopener,noreferrer,width=720,height=640,resizable=yes,scrollbars=yes"
    );

    if (shareWindow) {
      shareWindow.opener = null;
    }

    setShareOpen(false);
  }

  async function copyArticleLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      setShareOpen(false);
    } catch {
      setCopied(false);
    }
  }

  function shareOnWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function shareOnX() {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function shareOnReddit() {
    const url = `https://www.reddit.com/submit?url=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function shareOnPinterest() {
    const url = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
      window.location.href
    )}`;

    openShareWindow(url);
  }

  function toggleToc() {
    if (window.matchMedia("(min-width: 821px)").matches) {
      setDesktopTocOpen((value) => !value);
      return;
    }

    setTocOpen((value) => !value);
  }

  function handleTocKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleToc();
    }
  }

  return (
    <>
      <div className="post-shell">
        <div className="post-layout">
          {tocOpen ? (
            <div
              className="mobile-toc-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) {
                  setTocOpen(false);
                }
              }}
            >
              <div
                id="mobile-article-toc"
                className="mobile-toc-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-toc-title"
              >
                <div className="mobile-toc-header">
                  <div>
                    <div className="mobile-toc-kicker">
                      Article navigation
                    </div>
                    <h2 id="mobile-toc-title">
                      Table of Contents
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="mobile-toc-close"
                    aria-label="Close table of contents"
                    onClick={() => setTocOpen(false)}
                  >
                    <LucideX aria-hidden="true" />
                  </button>
                </div>

                {headings.length ? (
                  <nav
                    className="mobile-toc-list"
                    aria-label="Article sections"
                  >
                    {headings.map((item, i) => (
                      <a
                        key={`${item.id}-${i}`}
                        href={`#${item.id}`}
                        className="mobile-toc-link"
                        onClick={() => setTocOpen(false)}
                      >
                        <span className="mobile-toc-number">
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        <span className="mobile-toc-text">
                          {item.text}
                        </span>
                      </a>
                    ))}
                  </nav>
                ) : (
                  <div className="mobile-toc-empty">
                    Article sections will appear here.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <aside
            className={`toc${tocOpen ? " mobile-open" : ""}${
              desktopTocOpen
                ? ""
                : " desktop-toc-collapsed"
            }`}
            data-open={tocOpen}
            aria-label="Table of contents"
          >
            <div className="toc-card">
              <button
                type="button"
                className="toc-header"
                aria-expanded={
                  isDesktop ? desktopTocOpen : tocOpen
                }
                aria-controls="article-toc-list"
                onClick={toggleToc}
                onKeyDown={handleTocKeyDown}
              >
                <span>Table of Contents</span>
                <ChevronDown
                  aria-hidden="true"
                  className={
                    (isDesktop ? desktopTocOpen : tocOpen)
                      ? "toc-chevron-open"
                      : ""
                  }
                />
              </button>

              {headings.length ? (
                <nav
                  id="article-toc-list"
                  className="toc-list"
                  aria-label="Article sections"
                >
                  {headings.map((item, i) => (
                    <a
                      key={`${item.id}-${i}`}
                      href={`#${item.id}`}
                      className="toc-link"
                      onClick={() => {
                        if (!isDesktop) {
                          setTocOpen(false);
                        }
                      }}
                    >
                      <span
                        className="toc-bullet"
                        aria-hidden="true"
                      >
                        •
                      </span>
                      <span>{item.text}</span>
                    </a>
                  ))}
                </nav>
              ) : (
                <div className="toc-empty">
                  Article sections will appear here.
                </div>
              )}
            </div>
          </aside>

          {children}

          <aside
            className={`article-sidebar${
              mobileToolsVisible
                ? ""
                : " mobile-tools-hidden"
            }`}
            aria-label="Article tools"
          >
            <div className="sidebar-card mobile-toc-card">
              <div className="side-label">
                Article navigation
              </div>

              <button
                type="button"
                className="mobile-toc-trigger"
                aria-haspopup="dialog"
                aria-expanded={tocOpen}
                aria-controls="mobile-article-toc"
                onClick={() => setTocOpen(true)}
              >
                <span className="mobile-toc-trigger-label">
                  <FileText aria-hidden="true" />
                  <span>TOC</span>
                </span>
              </button>
            </div>

            <div className="sidebar-card">
              <div className="side-label">Share article</div>

              <button
                type="button"
                className="share-trigger"
                aria-haspopup="dialog"
                aria-expanded={shareOpen}
                onClick={() => setShareOpen(true)}
              >
                <span className="share-trigger-label">
                  <Share2 aria-hidden="true" />
                  Share
                </span>
              </button>
            </div>

            <div className="sidebar-card alloypress-badge-card">
              <div className="side-label">
                Featured badge
              </div>

              <div className="alloypress-badge-copy-box">
                <div className="alloypress-badge-preview">
                  <img
                    src="/badges/featured.png"
                    alt="Featured on AlloyPress"
                    width={320}
                    height={117}
                    className="alloypress-badge-image"
                  />
                </div>

                <BadgeCopyButton
                  articlePath={`/${category}/${postSlug}`}
                  articleTitle={articleTitle}
                />
              </div>

              <p className="alloypress-badge-text">
                Copy this badge and add it to your website
                to show that this tool is featured on
                AlloyPress.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div
        id="article-tools-end"
        className="article-tools-end-sentinel"
        aria-hidden="true"
      />

      {shareOpen ? (
        <div
          className="share-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setShareOpen(false);
            }
          }}
        >
          <div
            className="share-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            <div className="share-modal-header">
              <div>
                <div className="share-modal-kicker">
                  AlloyPress
                </div>
                <h3 id="share-modal-title">
                  Share this article
                </h3>
              </div>

              <button
                type="button"
                className="share-modal-close"
                aria-label="Close share dialog"
                onClick={() => setShareOpen(false)}
              >
                <LucideX aria-hidden="true" />
              </button>
            </div>

            <div className="share-modal-options">
              <button
                type="button"
                className="share-option share-option-primary"
                onClick={shareOnWhatsApp}
              >
                <FaWhatsapp aria-hidden="true" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                className="share-option"
                onClick={shareOnLinkedIn}
              >
                <FaLinkedinIn aria-hidden="true" />
                <span>LinkedIn</span>
              </button>

              <button
                type="button"
                className="share-option"
                onClick={shareOnX}
              >
                <FaXTwitter aria-hidden="true" />
                <span>Share on X</span>
              </button>

              <button
                type="button"
                className="share-option"
                onClick={shareOnReddit}
              >
                <FaRedditAlien aria-hidden="true" />
                <span>Reddit</span>
              </button>

              <button
                type="button"
                className="share-option"
                onClick={shareOnPinterest}
              >
                <FaPinterestP aria-hidden="true" />
                <span>Pinterest</span>
              </button>

              <button
                type="button"
                className="share-option"
                onClick={copyArticleLink}
              >
                {copied ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
                <span>
                  {copied ? "Link copied" : "Copy link"}
                </span>
              </button>
            </div>

            <div className="share-modal-url">
              <Link2 aria-hidden="true" />
              <span title={articleUrl}>
                {articleUrl || "Article link"}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
