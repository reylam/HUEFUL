import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 " +
  "text-base font-semibold transition-colors disabled:opacity-50 " +
  "disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-110",
  accent: "bg-accent text-accent-foreground hover:brightness-110",
  ghost: "border border-border bg-surface-raised text-text hover:bg-surface-sunken",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
