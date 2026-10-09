
"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

type BackToTopProps = {
  variant?: "floating" | "toolbar";
};

export default function BackToTop({
  variant = "floating",
}: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;

      const scrollProgress =
        documentHeight > 0
          ? (scrollTop / documentHeight) * 100
          : 0;

      setVisible(scrollTop > 500);
      setProgress(
        Math.min(100, Math.max(0, scrollProgress))
      );
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  if (variant === "toolbar") {
    return (
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className="back-to-top--toolbar"
      >
        <ArrowUp aria-hidden="true" size={18} />
        <span>Back to Top</span>
      </button>
    );
  }

  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (progress / 100) * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`back-to-top ${visible ? "visible" : ""}`}
    >
      <svg
        className="back-to-top-ring"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <circle
          className="back-to-top-ring-track"
          cx="24"
          cy="24"
          r={radius}
        />
        <circle
          className="back-to-top-ring-progress"
          cx="24"
          cy="24"
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>

      <ArrowUp
        className="back-to-top-icon"
        size={19}
        strokeWidth={2.2}
      />
    </button>
  );
}
