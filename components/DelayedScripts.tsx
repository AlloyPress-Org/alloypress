"use client";

import { useEffect } from "react";

const GTM_ID = "GTM-P72SG3JX";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const WEBPUSHR_KEY = process.env.NEXT_PUBLIC_WEBPUSHR_KEY;

// Page load aana apuram evlo ms wait pannanum (user interact pannala na)
const FALLBACK_DELAY_MS = 4000;

type WebpushrFn = {
  (...args: unknown[]): void;
  q?: IArguments[];
};

type W = Window & {
  dataLayer?: unknown[];
  webpushr?: WebpushrFn;
};

function injectScript(id: string, src: string, crossOrigin?: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.src = src;
  s.async = true;
  if (crossOrigin) s.crossOrigin = crossOrigin;
  document.head.appendChild(s);
}

function loadWebpushr(key: string) {
  const w = window as W;

  // Official Webpushr queue stub (SDK load aagura varaikkum calls queue aagum)
  if (!w.webpushr) {
    const stub = function () {
      // eslint-disable-next-line prefer-rest-params
      (stub.q = stub.q || []).push(arguments);
    } as WebpushrFn;
    w.webpushr = stub;
  }

  injectScript("webpushr-jssdk", "https://cdn.webpushr.com/app.min.js");
  w.webpushr("setup", { key });
}

export default function DelayedScripts() {
  useEffect(() => {
    let started = false;
    let timer: number | undefined;

    const events = ["scroll", "click", "touchstart", "keydown", "mousemove"];

    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, start));
      if (timer) window.clearTimeout(timer);
    };

    const start = () => {
      if (started) return;
      started = true;
      cleanup();

      // GTM
      const w = window as W;
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      injectScript(
        "gtm-script",
        `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
      );

      // AdSense (FundingChoices consent adhula irundhu load aagum)
      if (ADSENSE_CLIENT) {
        injectScript(
          "adsense-script",
          `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
          "anonymous"
        );
      }

      // Webpushr (push + email popup)
      if (WEBPUSHR_KEY) {
        loadWebpushr(WEBPUSHR_KEY);
      }
    };

    events.forEach((e) =>
      window.addEventListener(e, start, { once: true, passive: true })
    );

    const armTimer = () => {
      timer = window.setTimeout(start, FALLBACK_DELAY_MS);
    };

    if (document.readyState === "complete") armTimer();
    else window.addEventListener("load", armTimer, { once: true });

    return () => {
      cleanup();
      window.removeEventListener("load", armTimer);
    };
  }, []);

  return null;
}