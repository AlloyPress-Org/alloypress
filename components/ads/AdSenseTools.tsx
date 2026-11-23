"use client";

import "./AdSenseSidebar.css";

import { useEffect, useRef } from "react";

type AdsWindow = Window & { adsbygoogle?: unknown[] };

export default function AdSenseTools({ slot }: { slot: string }) {
  const adRef = useRef<HTMLModElement>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    const ad = adRef.current;
    if (!ad || !client || !slot) return;

    let inView = false;
    let done = false;
    let resizeObs: ResizeObserver | undefined;
    let intersectObs: IntersectionObserver | undefined;

    const tryInit = () => {
      if (done || !inView) return;
      if (ad.offsetWidth === 0) return;
      if (ad.dataset.adsInitialized === "true") {
        done = true;
        return;
      }

      try {
        const w = window as AdsWindow;
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
        ad.dataset.adsInitialized = "true";
      } catch (error) {
        console.error("AdSense tools ad initialization failed:", error);
      }

      done = true;
      resizeObs?.disconnect();
      intersectObs?.disconnect();
    };

    intersectObs = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        tryInit();
      },
      { rootMargin: "300px 0px" }
    );
    intersectObs.observe(ad);

    resizeObs = new ResizeObserver(tryInit);
    resizeObs.observe(ad);

    return () => {
      resizeObs?.disconnect();
      intersectObs?.disconnect();
    };
  }, [client, slot]);

  if (!client || !slot) return null;

  return (
    <div className="sidebar-ad-card">
      <ins
        ref={adRef}
        className="adsbygoogle sidebar-ad-unit"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}