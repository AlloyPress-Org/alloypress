"use client";

import { useEffect, useRef } from "react";
import "./AdSenseInArticle.css";

type AdSenseInArticleProps = {
  slot: string;
};

export default function AdSenseInArticle({
  slot,
}: AdSenseInArticleProps) {
  const adRef = useRef<HTMLModElement>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    const ad = adRef.current;

    if (!ad || !client || !slot) return;

    const initAd = () => {
      // Already initialized
      if (ad.dataset.adsInitialized === "true") return true;

      // Zero-width container: AdSense would throw, so wait
      if (ad.offsetWidth === 0) return false;

      try {
        const w = window as Window & { adsbygoogle?: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
        ad.dataset.adsInitialized = "true";
        return true;
      } catch (error) {
        console.error("In-article AdSense initialization failed:", error);
        return true; // don't retry in a loop
      }
    };

    if (initAd()) return;

    const observer = new ResizeObserver(() => {
      if (initAd()) observer.disconnect();
    });

    observer.observe(ad);

    return () => observer.disconnect();
  }, [client, slot]);

  if (!client || !slot) return null;
  return null;
  return (
    <div className="article-inline-ad">
      <span className="article-inline-ad-label">ADVERTISEMENT</span>

      <ins
        ref={adRef}
        className="adsbygoogle article-inline-ad-unit"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-full-width-responsive="true"
        data-ad-format="auto"
      />
    </div>
  );
}