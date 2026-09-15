import { useId, useState } from "react";
import { hexToRgb, rgbToHex, simulateCvd } from "@/shared/color-engine";
import type { CvdType } from "@/shared/color-engine";

/*
  Shows how a chosen color looks under each color vision deficiency, using the
  shared engine's simulateCvd. Educational, and a sanity check for our own
  color choices. Approximate, not clinical, and stated plainly to the user.
*/

const TYPES: { type: CvdType; label: string; note: string }[] = [
  { type: "deuteranopia", label: "Deuteranopia", note: "green-weak (most common)" },
  { type: "protanopia", label: "Protanopia", note: "red-weak" },
  { type: "tritanopia", label: "Tritanopia", note: "blue-weak (rare)" },
];

export function CvdSimulatorPage() {
  const inputId = useId();
  const [hex, setHex] = useState("#3ca046");
  const rgb = hexToRgb(hex);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-muted">
        See how a color shifts for each type of color vision deficiency. This is
        an approximation, not a medical assessment.
      </p>

      <label
        htmlFor={inputId}
        className="flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4"
      >
        <input
          id={inputId}
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <span className="font-medium">Choose a color</span>
      </label>

      {rgb ? (
        <ul className="flex flex-col gap-3">
          <li className="flex items-center gap-4 rounded-card border border-border bg-surface-raised p-4">
            <span
              aria-hidden
              className="h-12 w-12 rounded-xl border border-border"
              style={{ backgroundColor: hex }}
            />
            <div>
              <p className="font-semibold">Typical vision</p>
              <p className="text-sm text-text-muted">{hex}</p>
            </div>
          </li>
          {TYPES.map(({ type, label, note }) => {
            const seen = rgbToHex(simulateCvd(rgb, type));
            return (
              <li
                key={type}
                className="flex items-center gap-4 rounded-card border border-border bg-surface-raised p-4"
              >
                <span
                  aria-hidden
                  className="h-12 w-12 rounded-xl border border-border"
                  style={{ backgroundColor: seen }}
                />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-sm text-text-muted">{note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p role="alert" className="text-status-danger">
          That color isn&apos;t valid. Pick another.
        </p>
      )}
    </div>
  );
}
