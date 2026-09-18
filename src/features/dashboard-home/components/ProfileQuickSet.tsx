import { Check } from "lucide-react";
import { useVisionProfile, CVD_PROFILES } from "@/stores/vision-profile";

/*
  A one-tap way to set the vision profile from the home screen. The profile
  drives how lenses phrase explanations, so surfacing it here lets a new visitor
  personalize immediately instead of digging into settings. The active choice is
  marked with a check and text weight, not color alone, and each chip is a real
  button with an aria-pressed state.
*/
export function ProfileQuickSet() {
  const profile = useVisionProfile((s) => s.profile);
  const setProfile = useVisionProfile((s) => s.setProfile);

  const active = CVD_PROFILES.find((p) => p.id === profile);

  return (
    <section
      aria-labelledby="profile-heading"
      className="rounded-card border border-border bg-surface-raised p-5"
    >
      <h2 id="profile-heading" className="text-lg font-semibold text-text">
        How do you see color?
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        {active
          ? active.note
          : "Set this once and explanations adapt to you."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CVD_PROFILES.map((option) => {
          const selected = option.id === profile;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setProfile(option.id)}
              className={[
                "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-text-muted hover:text-text",
              ].join(" ")}
            >
              {selected && <Check size={15} aria-hidden />}
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
