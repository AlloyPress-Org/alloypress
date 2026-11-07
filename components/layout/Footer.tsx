"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Copy } from "lucide-react";
import {
  FaYoutube,
  FaInstagram,
  FaXTwitter,
} from "react-icons/fa6";

const SHOW_FEATURED_BADGE = false;

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
  accent?: boolean;
};

/* Top Guides: biggest pages first, Resume Builders moved in, no badge */
const topGuideLinks: FooterLink[] = [
  { label: "AI Image Generators", href: "/blogs/best-ai-image-generator" },
  { label: "AI Website Builders", href: "/blogs/best-ai-website-builders" },
  { label: "AI Blog Writers", href: "/blogs/best-ai-blog-writing-tools" },
  { label: "AI Logo Generators", href: "/blogs/best-ai-logo-generators" },
  {
    label: "AI Background Removers",
    href: "/blogs/best-ai-background-remover-tools",
  },
  { label: "AI Voice Generators", href: "/blogs/best-ai-voice-generators" },
  {
    label: "AI Resume Builders",
    href: "/blogs/list-of-top-ai-resume-builders",
  },
];

/* Learn: beginner-first order, ends with All guides */
const learnLinks: FooterLink[] = [
  { label: "What is AI?", href: "/blogs/artificial-intelligence" },
  { label: "What is ChatGPT?", href: "/blogs/what-is-chat-gpt" },
  {
    label: "How AI Image Generators Work",
    href: "/blogs/how-ai-image-generators-work",
  },
  { label: "AI Hallucinations", href: "/blogs/ai-hallucinations-explained" },
  { label: "AI vs Humans", href: "/blogs/ai-vs-human-intelligence" },
];

const companyLinks: FooterLink[] = [
  { label: "About Us", href: "/about-us" },
  { label: "How We Test", href: "/how-we-test" },
  { label: "Editorial Policy", href: "/editorial-policy" },
  {
    label: "Careers",
    href: "https://nvdigital.in/careers/",
    external: true,
  },
  { label: "Contact Us", href: "/contact-us" },
];

const brandLinks: FooterLink[] = [
  { label: "Review Your AI Tool", href: "/review-your-ai-tool" },
  { label: "Submit Your AI Tool", href: "/submit-your-ai-tool" },
  { label: "AI Testing Partnership", href: "/testing-partner" },
];

/* Start here: label -> category page, title -> article */
const startHereLinks = [
  {
    category: "Best-of lists",
    categoryHref: "/blogs/listicles",
    label: "AI Video Generators",
    href: "/blogs/best-ai-video-generators",
  },
  {
    category: "Alternatives",
    categoryHref: "/alternatives",
    label: "ChatGPT Alternatives",
    href: "/alternatives/chatgpt",
  },
  {
    category: "Reviews",
    categoryHref: "/reviews",
    label: "Cursor AI Review",
    href: "/reviews/cursor-ai",
  },
  {
    category: "Guides",
    categoryHref: "/blogs/informatives",
    label: "Google AI Mode Explained",
    href: "/blogs/google-ai-mode-explained",
  },
  {
    category: "Comparisons",
    categoryHref: "/comparisons",
    label: "Invideo vs Synthesia",
    href: "/comparisons/invideo-vs-synthesia",
  },
];

/* Show an icon only while that account is active. Set active: false to hide. */
const socialLinks = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/@AlloyPress",
    active: true,
    Icon: FaYoutube,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/alloypressdotcom/",
    active: true,
    Icon: FaInstagram,
  },
  {
    label: "X",
    href: "https://x.com/AlloyPress",
    active: true,
    Icon: FaXTwitter,
  },
];

function SocialIcon({
  children,
  label,
  href = "#",
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
}) {
  return (
    <a
      href={href}
      className="footer-social"
      aria-label={label}
      rel={href === "#" ? "nofollow" : "noopener noreferrer"}
      target={href === "#" ? undefined : "_blank"}
    >
      {children}
    </a>
  );
}

function FooterColumn({
  title,
  links,
  className = "",
}: {
  title: string;
  links: FooterLink[];
  className?: string;
}) {
  return (
    <div className={`footer-column ${className}`.trim()}>
      <h3>{title}</h3>

      <nav aria-label={title}>
        <ul>
          {links.map((link) => (
            <li key={link.label}>
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link.accent ? "footer-link-accent" : undefined}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className={link.accent ? "footer-link-accent" : undefined}
                >
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default function Footer() {
  const [badgeCopied, setBadgeCopied] = useState(false);

  const footerBadgeCode = `<a href="https://alloypress.com"
   target="_blank"
   rel="noopener noreferrer"
   aria-label="Tested by AlloyPress">
 <img src="https://alloypress.com/badges/featured.svg"
     alt="Tested By AlloyPress"
     width="320"
     height="117">
</a>`;

  async function copyFooterBadgeCode() {
    try {
      await navigator.clipboard.writeText(footerBadgeCode);

      setBadgeCopied(true);

      window.setTimeout(() => {
        setBadgeCopied(false);
      }, 1800);
    } catch {
      setBadgeCopied(false);
    }
  }

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">

            {/* Brand */}
            <div className="footer-brand">
              <Link href="/" className="footer-logo">
                <Image
                  src="/ap-icons.png"
                  alt="AlloyPress"
                  width={34}
                  height={34}
                />

                <span className="footer-brand-name">
                  AlloyPress
                </span>
              </Link>

              <p className="footer-tagline">
                Honest AI tool reviews, comparisons and alternatives, based on
                hands-on testing.
              </p>

              <p className="footer-trust">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  fill="none"
                  stroke="#3be27f"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 1.5l5.5 2v4c0 3.4-2.4 5.9-5.5 7-3.1-1.1-5.5-3.6-5.5-7v-4z" />
                  <path d="M5.5 8l1.8 1.8L10.7 6.4" />
                </svg>
                <span>Every tool tested by our team. No paid rankings.</span>
              </p>

              {/* Google preferred source */}
              <a
                href="https://www.google.com/preferences/source?q=alloypress.com"
                className="footer-source-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/Google.png"
                  alt=""
                  width={18}
                  height={18}
                  aria-hidden="true"
                />
                <span>Add AlloyPress as a preferred<br />source on Google</span>
              </a>

              {/* Social Icons (active accounts only) */}
              <div className="footer-socials">
                {socialLinks
                  .filter((s) => s.active)
                  .map(({ label, href, Icon }) => (
                    <SocialIcon key={label} label={label} href={href}>
                      <Icon aria-hidden="true" />
                    </SocialIcon>
                  ))}
              </div>

              {/* Featured Badge */}
              {SHOW_FEATURED_BADGE && (<div className="footer-featured-badge">
                <span className="footer-featured-label">
                  Tested by Alloypress
                </span>

                <div className="footer-featured-row">
                  <a
                    href="https://alloypress.com"
                    className="footer-featured-card"
                    aria-label="Featured by AlloyPress"
                  >
                    <img
                      src="/badges/featured.svg"
                      alt="Tested by AlloyPress"
                      width={320}
                      height={117}
                      className="footer-featured-image"
                    />
                  </a>

                  <button
                    type="button"
                    className="footer-featured-copy"
                    onClick={copyFooterBadgeCode}
                    aria-label={
                      badgeCopied ? "Badge code copied" : "Copy badge code"
                    }
                    title={badgeCopied ? "Badge code copied" : "Copy badge code"}
                  >
                    {badgeCopied ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* Top Guides */}
            <FooterColumn title="Top Guides" links={topGuideLinks} />

            {/* Learn */}
            <FooterColumn title="Learn" links={learnLinks} />

            {/* Company + For AI Brands */}
            <div className="footer-stack">
              <FooterColumn title="Company" links={companyLinks} />
              <FooterColumn
                title="For AI Brands"
                links={brandLinks}
                className="footer-column-brands"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Start here */}
      <div className="footer-popular-section">
        <div className="container">
          <p className="footer-start-title">Start here</p>

          <div className="footer-popular-grid">
            {startHereLinks.map((item) => (
              <div key={item.label} className="footer-popular-item">
                <Link href={item.categoryHref} className="footer-popular-label">
                  {item.category}
                </Link>
                <Link href={item.href} className="footer-popular-title">
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Wordmark */}
      <div
        className="footer-brand-wordmark"
        aria-hidden="true"
      >
        ALLOYPRESS
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <nav
            className="footer-legal"
            aria-label="Legal"
          >
            <Link href="/privacy-policy">
              Privacy Policy
            </Link>

            <Link href="/terms-and-conditions">
              Terms and Conditions
            </Link>

            <Link href="/do-not-sell-my-info">
              Do Not Sell My Info
            </Link>
          </nav>

          <p>
            Copyright © {new Date().getFullYear()} AlloyPress.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}