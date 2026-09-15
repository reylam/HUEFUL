import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { lenses } from "@/app/lenses";
import type { LensState } from "@/app/lenses";
import { useAuth } from "@/stores/auth";

/*
  The dashboard home ("/dashboard"). It orients rather than overwhelms: a short
  greeting, then the tools as a grid. Each tool states its maturity honestly
  (ready / prototype / planned) so nobody expects a finished feature from a
  scaffold. The honesty is a product rule, not a disclaimer bolted on later.
*/

const stateCopy: Record<LensState, { label: string; hint: string }> = {
  ready: { label: "Ready", hint: "Works end to end." },
  prototype: { label: "Prototype", hint: "Works, with known gaps." },
  planned: { label: "Planned", hint: "Not built yet." },
};

function StateTag({ state }: { state: LensState }) {
  const { label, hint } = stateCopy[state];
  const ring =
    state === "ready"
      ? "border-status-unripe"
      : state === "prototype"
        ? "border-primary"
        : "border-border";
  return (
    <span
      className={`inline-flex items-center rounded-full border ${ring} bg-surface px-2.5 py-0.5 text-xs font-semibold text-text`}
      title={hint}
    >
      {label}
    </span>
  );
}

export function DashboardHome() {
  const user = useAuth((s) => s.user);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-text-muted">
        {user ? `Hi ${user.name}. ` : ""}Pick a tool to get started.
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {lenses.map((lens) => (
          <li key={lens.path}>
            <Link
              to={`/dashboard/${lens.path}`}
              className="group flex h-full flex-col gap-2 rounded-card border border-border bg-surface-raised p-4 transition-colors hover:border-primary hover:bg-surface"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-text">
                  {lens.label}
                </span>
                <StateTag state={lens.state} />
              </span>
              <span className="text-sm text-text-muted">{lens.summary}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-text">
                Open
                <ArrowRight
                  size={16}
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
