"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

const CONTACT_EMAIL = "contact@alloypress.com";

const TOPICS = [
  {
    id: "review",
    label: "Review",
    subject: "Review request: [Your tool name]",
    include: [
      "Tool name and website",
      "Category and your main competitors",
      "Test access you can share (plan or credits)",
      "Whether you'd also like a list inclusion",
    ],
  },
  {
    id: "list",
    label: "List inclusion",
    subject: "Feature request: [Your tool name]",
    include: [
      "Tool name and website",
      "The list or category you'd like to be in",
      "What sets it apart from the tools already listed",
      "Test access or demo details",
    ],
  },
  {
    id: "partnership",
    label: "Testing partnership",
    subject: "Testing partnership: [Your product]",
    include: [
      "What you're building and your website",
      "What you'd like tested",
      "One round or a regular cadence",
      "The budget you have in mind",
    ],
  },
  {
    id: "other",
    label: "Other",
    subject: "Enquiry: [Topic]",
    include: [] as string[],
  },
];

function buildMailto(subject: string, include: string[]) {
  const body = include.length
    ? "&body=" + include.map((line) => encodeURIComponent(line + ":\n")).join("")
    : "";
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}${body}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(field);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className="contact-email-copy-button"
      onClick={async () => {
        setState((await copyText(text)) ? "done" : "failed");
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setState("idle"), 2000);
      }}
    >
      {state === "done" ? "✓ Copied" : state === "failed" ? "Copy failed" : "Copy"}
      <span className="ct-sr" aria-live="polite">
        {state === "done" ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}

export function ContactPopup() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [topicId, setTopicId] = useState("review");

  const topic = TOPICS.find((item) => item.id === topicId) ?? TOPICS[0];

  // Any element with data-ct-open="<topic>" opens the popup.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-ct-open]");
      if (!trigger) return;
      event.preventDefault();
      openerRef.current = trigger;
      setTopicId(trigger.getAttribute("data-ct-open") || "review");
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Keep the native dialog in sync with React state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    openerRef.current?.focus();
    openerRef.current = null;
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="contact-email-dialog"
      aria-labelledby="ct-popup-title"
      onClose={handleClose}
      onClick={(event: ReactMouseEvent<HTMLDialogElement>) => {
        if (event.target === dialogRef.current) setOpen(false);
      }}
    >
      <div className="contact-email-dialog-inner">
        <button
          type="button"
          className="contact-email-dialog-close"
          aria-label="Close"
          onClick={() => setOpen(false)}
        >
          ×
        </button>

        <div className="contact-eyebrow">
          <span />
          CONTACT
        </div>

        <h2 id="ct-popup-title">Contact AlloyPress</h2>
        <p>
          Pick what it&apos;s about and we&apos;ll suggest the right subject
          line. A real person replies within 1 to 3 business days.
        </p>

        <span className="ct-field-label" id="ct-topic-label">
          What&apos;s this about?
        </span>
        <div className="ct-topics" role="radiogroup" aria-labelledby="ct-topic-label">
          {TOPICS.map((item) => (
            <button
              type="button"
              role="radio"
              aria-checked={item.id === topic.id}
              className={`ct-topic${item.id === topic.id ? " is-active" : ""}`}
              onClick={() => setTopicId(item.id)}
              key={item.id}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="ct-field-label">Email</span>
        <div className="contact-email-copy-row">
          <span>{CONTACT_EMAIL}</span>
          <CopyButton text={CONTACT_EMAIL} />
        </div>

        <span className="ct-field-label">Subject</span>
        <div className="contact-email-copy-row">
          <span>{topic.subject}</span>
          <CopyButton key={topic.id} text={topic.subject} />
        </div>

        <a className="ct-mailto" href={buildMailto(topic.subject, topic.include)}>
          Open in email app
        </a>
        <p className="ct-hint">
          Use Gmail or Outlook in the browser? Copy the email and subject above.
        </p>
      </div>
    </dialog>
  );
}