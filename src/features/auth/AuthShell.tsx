import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/*
  Centered column for the auth pages. Narrow measure so the form is the focus on
  any screen, comfortable vertical rhythm, and a short honest note that this is
  a local prototype account (no real password check yet).
*/
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-12 md:py-16">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        <p className="mt-1 text-text-muted">{subtitle}</p>
      </div>

      {children}

      <p className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-text-muted">
        This is a prototype. Accounts are stored on this device only and no
        password is checked yet.
      </p>
    </div>
  );
}
