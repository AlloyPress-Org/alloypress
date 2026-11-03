"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ReviewPopupContent = {
  eyebrow: string;
  title: string;
  text: string;
  email: string;
  subject: string;
  include: readonly string[];
};

type Props = {
  content: ReviewPopupContent;
};

/**
 * Review request popup.
 *
 * Any element with the `data-rv-open` attribute opens it (hero + CTA buttons).
 * It is a client component on purpose: the listener is attached in useEffect,
 * so it is always ready after hydration, survives client-side navigation and
 * is cleaned up on unmount (the old inline <Script> could miss clicks or
 * silently skip re-registering).
 */
export default function ReviewRequestPopup({ content }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const [copied, setCopied] = useState<"email" | "subject" | null>(null);
  const [failed, setFailed] = useState(false);

  const mailto =
    "mailto:" +
    content.email +
    "?subject=" +
    encodeURIComponent(content.subject) +
    "&body=" +
    encodeURIComponent(content.include.map((line) => line + ":\n").join("\n"));

  const openDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    try {
      dialog.showModal();
    } catch {
      dialog.setAttribute("open", "");
    }
    document.body.style.overflow = "hidden";
  }, []);

  const closeDialog = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    document.body.style.overflow = "";
    openerRef.current?.focus();
    openerRef.current = null;
  }, []);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-rv-open]");
      if (!trigger) return;
      event.preventDefault();
      openerRef.current = trigger;
      openDialog();
    };

    const dialog = dialogRef.current;
    // Native close (Esc key) must also restore scroll + focus.
    const onNativeClose = () => {
      document.body.style.overflow = "";
      openerRef.current?.focus();
      openerRef.current = null;
    };

    document.addEventListener("click", onDocumentClick);
    dialog?.addEventListener("close", onNativeClose);

    return () => {
      document.removeEventListener("click", onDocumentClick);
      dialog?.removeEventListener("close", onNativeClose);
      document.body.style.overflow = "";
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [openDialog]);

  async function copyText(value: string, key: "email" | "subject") {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      // Fallback for browsers/contexts without the async clipboard API.
      try {
        const area = document.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        ok = document.execCommand("copy");
        document.body.removeChild(area);
      } catch {
        ok = false;
      }
    }

    setFailed(!ok);
    setCopied(ok ? key : null);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setCopied(null);
      setFailed(false);
    }, 2000);
  }

  return (
    <dialog
      ref={dialogRef}
      className="review-email-dialog"
      aria-labelledby="rv-popup-title"
      onClick={(event) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <div className="review-email-dialog-inner">
        <button
          type="button"
          className="review-email-close"
          onClick={closeDialog}
          aria-label="Close"
        >
          ×
        </button>

        <div className="review-eyebrow">
          <span />
          {content.eyebrow}
        </div>

        <h2 id="rv-popup-title">{content.title}</h2>
        <p>{content.text}</p>

        <span className="rv-field-label">Email</span>
        <div className="review-email-copy-row">
          <span>{content.email}</span>
          <button
            type="button"
            className={`review-email-copy${copied === "email" ? " is-copied" : ""}`}
            onClick={() => copyText(content.email, "email")}
          >
            {copied === "email" ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <span className="rv-field-label">Subject</span>
        <div className="review-email-copy-row">
          <span>{content.subject}</span>
          <button
            type="button"
            className={`review-email-copy${copied === "subject" ? " is-copied" : ""}`}
            onClick={() => copyText(content.subject, "subject")}
          >
            {copied === "subject" ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <span className="rv-field-label">Include in your email</span>
        <ul className="rv-include">
          {content.include.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <a className="rv-mailto" href={mailto}>
          Open in email app
        </a>
        <p className="rv-hint">
          Use Gmail or Outlook in the browser? Copy the email and subject above.
        </p>

        <span className="rv-sr-only" role="status" aria-live="polite">
          {copied ? "Copied to clipboard" : failed ? "Copy failed" : ""}
        </span>
      </div>
    </dialog>
  );
}