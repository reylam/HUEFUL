import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { rgbToHsl } from "@/shared/color-engine";
import type { NamedColor } from "@/shared/color-engine";

/*
  The technical breakdown of a named color: HEX, RGB, and HSL, each copyable.
  The name and plain description lead elsewhere; this is the detail panel for
  people who want the exact values. Values are text (never color alone), and
  each copy control confirms with a checkmark and an aria-live announcement.
*/
export function ColorReadout({ color }: { color: NamedColor }) {
  const { r, g, b } = color.rgb;
  const hsl = rgbToHsl(color.rgb);

  const rows: { label: string; value: string }[] = [
    { label: "HEX", value: color.hex.toUpperCase() },
    { label: "RGB", value: `${r}, ${g}, ${b}` },
    { label: "HSL", value: `${hsl.h}, ${hsl.s}%, ${hsl.l}%` },
  ];

  return (
    <dl className="grid gap-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5"
        >
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {row.label}
          </dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono text-sm text-text">{row.value}</span>
            <CopyButton label={row.label} value={row.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard can be blocked; fail quietly, the value is visible anyway.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
    >
      {copied ? (
        <Check size={15} aria-hidden className="text-status-unripe" />
      ) : (
        <Copy size={15} aria-hidden />
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? `${label} copied` : ""}
      </span>
    </button>
  );
}
