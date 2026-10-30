import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import "@/components/css-style/navbar.css";
import "@/components/css-style/hero.css";
import "@/components/css-style/footer.css";
import "@/components/css-style/testing-partner.css";

import EmailCtaModal from "@/components/ui/EmailCtaModal";
import HtmlWidgetRuntime from "@/components/HtmlWidgetRuntime";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThemeScript from "@/components/ThemeScript";
import BackToTop from "@/components/BackToTop";
import ScrollToTop from "@/components/ScrollToTop";
import DelayedScripts from "@/components/DelayedScripts";

import { SITE_URL } from "@/lib/seo/constants";
import { createOrganizationSchema } from "@/lib/seo/schema";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700", "800"],
});

const GTM_ID = "GTM-P72SG3JX";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

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

  // AdSense site ownership (script delay aanalum verify aagum)
  ...(ADSENSE_CLIENT
    ? { other: { "google-adsense-account": ADSENSE_CLIENT } }
    : {}),
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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://media.alloypress.com" />
        <style dangerouslySetInnerHTML={{
          __html: `
    html{background:#000}
    html[data-theme="light"]{background:#f1f8f3}
  `}} />
      </head>

      <body>
        {/* GTM (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

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

        {/* GTM + AdSense: interaction illa 4s after load */}
        <DelayedScripts />
      </body>
    </html>
  );
}