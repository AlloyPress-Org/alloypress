import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import "@/components/css-style/navbar.css";
import "@/components/css-style/hero.css";
import "@/components/css-style/latest.css";
import "@/components/css-style/category.css";
import "@/components/css-style/alloy-pick.css";
import "@/components/css-style/learn-ai.css";
import "@/components/css-style/recent-ai-news.css";
import "@/components/css-style/ai-tool-reviews.css";
import "@/components/css-style/footer.css";
import "@/components/css-style/popular.css";
import "@/components/css-style/news-letter.css";
import "@/components/css-style/tool-submit.css";
import "@/components/css-style/testing-partner.css";

import EmailCtaModal from "@/components/ui/EmailCtaModal";
import HtmlWidgetRuntime from "@/components/HtmlWidgetRuntime";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeScript from "@/components/ThemeScript";
import BackToTop from "@/components/BackToTop";
import ScrollToTop from "@/components/ScrollToTop";

import { SITE_URL } from "@/lib/seo/constants";
import { createOrganizationSchema } from "@/lib/seo/schema";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "AlloyPress — AI Info Simplified For Everyone",
    template: "%s | AlloyPress",
  },

  description:
    "Honest AI tool reviews, comparisons, alternatives, news, and practical guides based on real-world testing.",

  applicationName: "AlloyPress",

  robots: {
    index: true,
    follow: true,
  },

  verification: {
    google: "u-tEyx4uriJ97Uw5PGR_BZS1fghdWv8q28OLfQPpQpc",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [createOrganizationSchema()],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.variable}
    >
      <head>
        <link
          rel="preconnect"
          href="https://media.alloypress.com"
        />
      </head>

      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        <ThemeScript />

        <ScrollToTop />

        <Navbar />
        <HtmlWidgetRuntime />

        <main>{children}</main>

        <BackToTop />

        <Footer />
        <EmailCtaModal />
      </body>
    </html>
  );
}
