import { useId } from "react";
import { CVD_PROFILES, useVisionProfile } from "@/stores/vision-profile";

/*
  The vision profile as a native radio group, shared by Settings and the tool
  tutorials so the choice looks and behaves the same everywhere. Real radios
  with visible labels mean arrow keys, screen readers, and focus rings work as
  expected. The chosen option is marked by the radio's filled dot plus a
  stronger outline, never by color alone. Changes apply immediately: this is a
  preference, not a form to submit.
*/
export function VisionProfilePicker({ legend }: { legend: string }) {
  const name = useId();
  const profile = useVisionProfile((s) => s.profile);
  const setProfile = useVisionProfile((s) => s.setProfile);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">{legend}</legend>
      {CVD_PROFILES.map((option) => {
        const selected = option.id === profile;
        return (
          <label
            key={option.id}
            className={[
              "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
              selected
                ? "border-primary bg-surface ring-1 ring-primary"
                : "border-border bg-surface-raised hover:bg-surface",
            ].join(" ")}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={selected}
              onChange={() => setProfile(option.id)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block font-medium text-text">{option.label}</span>
              <span className="block text-sm text-text-muted">{option.note}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
