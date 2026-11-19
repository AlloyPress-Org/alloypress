"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const TIP_WIDTH = 220;
const GAP = 10; // label <-> tooltip gap
const EDGE = 8; // viewport edge padding
const SIDE_OFFSET = 4; // tooltip starts just right of the label
const ARROW_MIN = 12;

type Pos = {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
  arrowLeft: number;
};

export default function SlotAdBadge() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  const tipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const pointerTypeRef = useRef("mouse");

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const r = trigger.getBoundingClientRect();
    const tipH = tipRef.current?.offsetHeight ?? 64;
    const width = Math.min(TIP_WIDTH, window.innerWidth - EDGE * 2);

    // Start at the label's right edge, keep fully inside the viewport
    const left = Math.min(
      Math.max(EDGE, r.left),
      window.innerWidth - width - EDGE,
    );

    // Prefer ABOVE the label. Flip below only if there is no room.
    const fitsAbove = r.top - GAP - tipH >= EDGE;

    // Arrow points at the label's centre, clamped inside the tooltip
    const arrowLeft = Math.min(
      Math.max(ARROW_MIN, r.left + r.width / 2 - left - 5),
      width - ARROW_MIN - 10,
    );

    setPos({
      placement: fitsAbove ? "top" : "bottom",
      top: fitsAbove ? r.top - GAP - tipH : r.bottom + GAP,
      left,
      width,
      arrowLeft,
    });
  }, []);

  // Runs after the tooltip is in the DOM, so we know its real height
  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

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
      <button
        ref={triggerRef}
        type="button"
        className="post-image-slot-badge-trigger"
        aria-label="Partner advertisement disclosure"
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onPointerDown={(e) => {
          pointerTypeRef.current = e.pointerType;
        }}
        onClick={() => {
          if (pointerTypeRef.current === "mouse") setOpen(true);
          else setOpen((v) => !v);
        }}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
      >
        Partner
      </button>

      {open && mounted
        ? createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            id={tipId}
            className={`post-image-slot-badge-tip is-portal is-${pos?.placement ?? "top"
              }`}
            style={{
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: pos?.width ?? TIP_WIDTH,
              visibility: pos ? "visible" : "hidden",
              ["--arrow-left" as string]: `${pos?.arrowLeft ?? ARROW_MIN}px`,
            }}
          >
            We may earn a commission if you purchase through this link, at no
            extra cost to you.
          </span>,
          document.body,
        )
        : null}
    </span>
  );
}