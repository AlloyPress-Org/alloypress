"use client";

import { useEffect } from "react";

export default function HtmlWidgetRuntime() {
  useEffect(() => {
    // =========================================================
    // TAB SWITCH
    // =========================================================

    const showTab = (
      name: string,
      button: HTMLElement
    ) => {
      const widget = button.closest(".apx-bike-widget");

      if (!widget) return;

      const panels = widget.querySelectorAll(
        ".apx-bike-panel"
      );

      const buttons = widget.querySelectorAll(
        ".apx-bike-tab-btn"
      );

      panels.forEach((panel) => {
        panel.classList.remove("active");
      });

      buttons.forEach((btn) => {
        btn.classList.remove("active");
      });

      const panel = widget.querySelector(
        `[data-apx-bike-panel="${name}"]`
      );

      if (!panel) return;

      panel.classList.add("active");
      button.classList.add("active");
    };

    // =========================================================
    // COPY PROMPT
    // =========================================================

    const copyPrompt = async (
      button: HTMLButtonElement
    ) => {
      const widget = button.closest(".apx-bike-widget");

      if (!widget) return;

      const promptBox = widget.querySelector(
        ".apx-bike-prompt-box"
      ) as HTMLElement | null;

      if (!promptBox) {
        console.error(
          "AlloyPress: .apx-bike-prompt-box not found"
        );
        return;
      }

      const text = promptBox.innerText.trim();

      if (!text) {
        console.error(
          "AlloyPress: Prompt text is empty"
        );
        return;
      }

      try {
        if (
          navigator.clipboard &&
          window.isSecureContext
        ) {
          await navigator.clipboard.writeText(text);
        } else {
          fallbackCopy(text);
        }

        button.innerHTML = "✓ Copied!";
        button.classList.add("copied");

        window.setTimeout(() => {
          button.innerHTML = "📋 Copy Prompt";
          button.classList.remove("copied");
        }, 1800);
      } catch (error) {
        console.error(
          "AlloyPress: Copy failed",
          error
        );

        try {
          fallbackCopy(text);

          button.innerHTML = "✓ Copied!";
          button.classList.add("copied");

          window.setTimeout(() => {
            button.innerHTML = "📋 Copy Prompt";
            button.classList.remove("copied");
          }, 1800);
        } catch {
          button.innerHTML = "⚠️ Copy Failed";

          window.setTimeout(() => {
            button.innerHTML = "📋 Copy Prompt";
          }, 1800);
        }
      }
    };

    // =========================================================
    // FALLBACK COPY
    // =========================================================

    const fallbackCopy = (text: string) => {
      const textarea = document.createElement("textarea");

      textarea.value = text;

      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      const success =
        document.execCommand("copy");

      textarea.remove();

      if (!success) {
        throw new Error("document.execCommand failed");
      }
    };

    // =========================================================
    // IMPORTANT:
    // Expose functions globally.
    //
    // Your existing Payload HTML already contains:
    //
    // onclick="apxBikeShowTab('prompt', this)"
    //
    // onclick="apxBikeCopyPrompt(this)"
    //
    // We are NOT changing those 100+ HTML blocks.
    // =========================================================

    (
      window as typeof window & {
        apxBikeShowTab?: (
          name: string,
          button: HTMLElement
        ) => void;

        apxBikeCopyPrompt?: (
          button: HTMLButtonElement
        ) => void;
      }
    ).apxBikeShowTab = showTab;

    (
      window as typeof window & {
        apxBikeShowTab?: (
          name: string,
          button: HTMLElement
        ) => void;

        apxBikeCopyPrompt?: (
          button: HTMLButtonElement
        ) => void;
      }
    ).apxBikeCopyPrompt = copyPrompt;

    // =========================================================
    // CLEANUP
    // =========================================================

    return () => {
      delete (
        window as typeof window & {
          apxBikeShowTab?: unknown;
        }
      ).apxBikeShowTab;

      delete (
        window as typeof window & {
          apxBikeCopyPrompt?: unknown;
        }
      ).apxBikeCopyPrompt;
    };
  }, []);

  return null;
}