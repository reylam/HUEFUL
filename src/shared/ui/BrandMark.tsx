import type { ReactNode } from "react";

type BrandTone = "primary" | "accent" | "navy";

const toneClass: Record<BrandTone, string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  navy: "bg-brand-navy text-brand-navy-foreground",
};

const sizeClass = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-16 w-16 rounded-2xl",
} as const;

interface BrandMarkProps {
  tone: BrandTone;
  icon: ReactNode;
  size?: keyof typeof sizeClass;
  className?: string;
}

/*
  A solid-fill mark in one of HUEFUL's own logo tones (cyan-blue primary,
  orange accent, navy), holding an icon in the matching foreground token.
  Stands in for the generic 15%-tint-circle-with-icon badge: a solid fill the
  way the logo itself uses color, and puts the brand-navy pair (defined in
  the token system, unused until now) to work. Always paired with adjacent
  text; purely decorative.
*/
export function BrandMark({ tone, icon, size = "md", className }: BrandMarkProps) {
  return (
    <span
      aria-hidden
      className={["grid shrink-0 place-items-center", sizeClass[size], toneClass[tone], className]
        .filter(Boolean)
        .join(" ")}
    >
      {icon}
    </span>
  );
}
