interface ComingSoonProps {
  /** What this lens will do, in one plain sentence. */
  summary: string;
  /** What still needs building. Honest about the prototype state. */
  next: string;
}

/*
  An explicit placeholder for lenses that are scaffolded but not built yet.
  Being upfront ("not built") beats a fake UI that pretends to work. Honesty
  under uncertainty is a product rule, not just a dev convenience.
*/
export function ComingSoon({ summary, next }: ComingSoonProps) {
  return (
    <section
      aria-label="Not built yet"
      className="rounded-card border border-dashed border-border bg-surface-raised p-5"
    >
      <p className="text-text">{summary}</p>
      <p className="mt-3 text-sm text-text-muted">
        <span className="font-semibold text-text">Next:</span> {next}
      </p>
    </section>
  );
}
