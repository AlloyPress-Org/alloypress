"use client";

import "./AdSenseSidebar.css";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

type AdsWindow = Window & { adsbygoogle?: unknown[] };

const FALLBACK_TIMEOUT_MS = 5000;

function AdUnit({
  client,
  slot,
  fallback,
}: {
  client: string;
  slot: string;
  fallback?: ReactNode;
}) {
  const adRef = useRef<HTMLModElement>(null);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    const ad = adRef.current;
    if (!ad) return;

    let inView = false;
    let done = false;
    let fallbackTimer: number | undefined;

    // Google set panra data-ad-status-a watch pannu
    const statusObs = new MutationObserver(() => {
      const status = ad.dataset.adStatus;
      if (status === "unfilled") setUnfilled(true);
      if (status === "filled") {
        window.clearTimeout(fallbackTimer);
        setUnfilled(false);
      }
    });
    statusObs.observe(ad, { attributes: true, attributeFilter: ["data-ad-status"] });

    const tryInit = () => {
      if (done || !inView || ad.offsetWidth === 0) return;
      done = true;
      intersectObs.disconnect();
      resizeObs.disconnect();

      if (ad.dataset.adsbygoogleStatus) return; // already pushed

      try {
        const w = window as AdsWindow;
        (w.adsbygoogle = w.adsbygoogle || []).push({});
      } catch (error) {
        console.error("AdSense sidebar init failed:", error);
        setUnfilled(true);
        return;
      }

      // Adblocker / script block aanaa status varave varaadhu -> fallback
      fallbackTimer = window.setTimeout(() => {
        if (ad.dataset.adStatus !== "filled") setUnfilled(true);
      }, FALLBACK_TIMEOUT_MS);
    };

    const intersectObs = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        tryInit();
      },
      { rootMargin: "300px 0px" }
    );
    intersectObs.observe(ad);

    const resizeObs = new ResizeObserver(tryInit);
    resizeObs.observe(ad);

    return () => {
      window.clearTimeout(fallbackTimer);
      statusObs.disconnect();
      intersectObs.disconnect();
      resizeObs.disconnect();
    };
  }, []);

  return (
    <div className="sidebar-ad-card">
      {/* ins-a unmount pannaadha — late fill vandhaa thirumba kaattum */}
      <ins
        ref={adRef}
        className="adsbygoogle sidebar-ad-unit"
        style={{ display: unfilled ? "none" : "inline-block", width: 160, height: 600 }}
        data-ad-client={client}
        data-ad-slot={slot}
      />
      {unfilled && fallback}
    </div>
  );
}

export default function AdSenseSidebar({ fallback }: { fallback?: ReactNode }) {
  const pathname = usePathname();
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID;

  if (!client || !slot) return <>{fallback}</>;

  // key = pathname -> article to article navigation-ku fresh ad request
  return <AdUnit key={pathname} client={client} slot={slot} fallback={fallback} />;
}