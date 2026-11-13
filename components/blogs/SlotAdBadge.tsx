"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function SlotAdBadge() {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const pointerTypeRef = useRef("mouse");

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className="post-image-slot-badge"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <span className="post-image-slot-badge-label">Ad</span>

      <button
        type="button"
        className="post-image-slot-badge-info"
        aria-label="Advertisement disclosure"
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onPointerDown={(e) => {
          pointerTypeRef.current = e.pointerType;
        }}
        onClick={() => {
          if (pointerTypeRef.current === "mouse") setOpen(true);
          else setOpen((value) => !value);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      >
        i
      </button>

      {open ? (
        <span role="tooltip" id={tipId} className="post-image-slot-badge-tip">
          We may earn a commission if you purchase through this link, at no extra cost to you.
        </span>
      ) : null}
    </span>
  );
}