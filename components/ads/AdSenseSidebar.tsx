"use client";

import "./AdSenseSidebar.css";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type AdsWindow = Window & { adsbygoogle?: unknown[] };

function AdUnit({ client, slot }: { client: string; slot: string }) {
  const adRef = useRef<HTMLModElement>(null);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    const ad = adRef.current;
    if (!ad) return;

    let inView = false;
    let done = false;

    const statusObs = new MutationObserver(() => {
      setUnfilled(ad.dataset.adStatus === "unfilled");
    });
    statusObs.observe(ad, { attributes: true, attributeFilter: ["data-ad-status"] });

    const tryInit = () => {
      if (done || !inView || ad.offsetWidth === 0) return;
      done = true;
      intersectObs.disconnect();
      resizeObs.disconnect();
      if (ad.dataset.adsbygoogleStatus) return;
      try {
        const w = window as AdsWindow;
        (w.adsbygoogle = w.adsbygoogle || []).push({});
      } catch (error) {
        console.error("AdSense init failed:", error);
      }
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
      statusObs.disconnect();
      intersectObs.disconnect();
      resizeObs.disconnect();
    };
  }, []);

  return (
    <div className="sidebar-ad-card" hidden={unfilled}>
      <ins
        ref={adRef}
        className="adsbygoogle sidebar-ad-unit"
        style={{ display: "inline-block", width: 160, height: 600 }}
        data-ad-client={client}
        data-ad-slot={slot}
      />
    </div>
  );
}

export default function AdSenseSidebar({ slot: slotProp }: { slot?: string }) {
  const pathname = usePathname();
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slot = slotProp ?? process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID;

  if (!client || !slot) return null;
  return <AdUnit key={pathname} client={client} slot={slot} />;
}