"use client";

import React, { useEffect, useState } from "react";
import { useField } from "@payloadcms/ui";

type Props = {
  path: string;
  label?: string;
  required?: boolean;
};

const fieldLabels: Record<string, string> = {
  backgroundColor: "Background Color",
  textColor: "Text Color",
  hoverBackgroundColor: "Hover Background Color",
  hoverTextColor: "Hover Text Color",
  borderColor: "Border Color",
};

export const CTAColorField: React.FC<Props> = ({
  path,
  label,
  required,
}) => {
  const { value, setValue } = useField<string>({ path });

  const fieldName = path.split(".").pop() || "";

  const displayLabel =
    fieldLabels[fieldName] || label || fieldName || "Color";

  const [inputValue, setInputValue] = useState(
    typeof value === "string" && value.trim()
      ? value
      : "#16a34a",
  );

  useEffect(() => {
    if (typeof value === "string") {
      setInputValue(value);
    }
  }, [value]);

  const pickerValue = /^#[0-9a-f]{6}$/i.test(inputValue)
    ? inputValue
    : "#16a34a";

  return (
    <div style={{ marginBottom: 18, flex: 1, minWidth: 0 }}>
      <label
        style={{
          display: "block",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {displayLabel}
        {required ? " *" : ""}
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Color Picker */}
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => {
            const next = event.target.value;

            setInputValue(next);
            setValue(next);
          }}
          aria-label={displayLabel}
          style={{
            width: 44,
            height: 40,
            padding: 3,
            cursor: "pointer",
          }}
        />

        {/* Color Code */}
        <input
          type="text"
          value={inputValue}
          onChange={(event) => {
            const next = event.target.value;

            setInputValue(next);
            setValue(next);
          }}
          placeholder="#16a34a"
          spellCheck={false}
          style={{
            flex: 1,
            minWidth: 0,
            height: 40,
            padding: "0 10px",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: 4,
            fontFamily: "var(--font-mono, monospace)",
          }}
        />

        {/* Preview */}
        <span
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: 4,
            background: inputValue || "#16a34a",
            border: "1px solid var(--theme-elevation-150)",
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 6,
          color: "var(--theme-elevation-500)",
          fontSize: 12,
        }}
      >
        Pick a color or enter any CSS color value.
      </div>
    </div>
  );
};

export default CTAColorField;