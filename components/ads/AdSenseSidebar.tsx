"use client";

import "./AdSenseSidebar.css";

import { useEffect, useRef } from "react";

export default function AdSenseSidebar() {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const ad = adRef.current;

    if (!ad) return;

    const initAd = () => {
      // Already initialized
      if (ad.dataset.adsInitialized === "true") return true;

      // Hidden / zero-width container (e.g. sidebar is display:none on mobile).
      // AdSense throws "No slot size for availableWidth=0" in this case.
      if (ad.offsetWidth === 0) return false;

      try {
        const w = window as Window & { adsbygoogle?: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
        ad.dataset.adsInitialized = "true";
        return true;
      } catch (error) {
        console.error("AdSense sidebar initialization failed:", error);
        return true; // don't retry in a loop
      }
    };

    // Try now; if the container has no width yet, wait until it does
    if (initAd()) return;

    const observer = new ResizeObserver(() => {
      if (initAd()) observer.disconnect();
    });

    observer.observe(ad);

    return () => observer.disconnect();
  }, []);

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID;

  if (!client || !slot) return null;

  return (
    <div className="sidebar-ad-card">
      <span className="sidebar-ad-label">ADVERTISEMENT</span>

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