import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Moon,
  Sun,
  Monitor,
  Zap,
  Type,
  Contrast,
  Check,
} from "lucide-react";
import { useAuth } from "@/stores/auth";
import { useVisionProfile, CVD_PROFILES } from "@/stores/vision-profile";
import type { VisionProfileId } from "@/stores/vision-profile";
import { usePreferences } from "@/stores/preferences";
import { Button } from "@/shared/ui/Button";
import { BrandMark } from "@/shared/ui/BrandMark";

/*
  Settings, kept simple and honest. Appearance shows the theme options but is
  clear that only Dark ships today (no fake light mode). Accessibility toggles
  are real: they persist and apply app-wide via the preferences store. Vision
  profile changes how tools phrase explanations. Account shows the local stub
  session.
*/
export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const profile = useVisionProfile((s) => s.profile);
  const setProfile = useVisionProfile((s) => s.setProfile);

  const prefs = usePreferences();

  function handleSignOut() {
    signOut();
    toast.success("Signed out.");
    navigate("/");
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Appearance. */}
      <Section title="Appearance" description="How HUEFUL looks.">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Theme">
          <ThemeChip Icon={Moon} label="Dark" active />
          <ThemeChip Icon={Sun} label="Light" disabled />
          <ThemeChip Icon={Monitor} label="System" disabled />
        </div>
        <p className="mt-2 text-sm text-text-muted">
          HUEFUL is tuned for a dark interface today. Light and system themes are
          on the way.
        </p>
      </Section>

      {/* Accessibility, real working toggles. */}
      <Section
        title="Accessibility"
        description="Adjust motion, text size, and contrast to suit you."
      >
        <div className="flex flex-col gap-2">
          <ToggleRow
            Icon={Zap}
            tone="primary"
            label="Reduced motion"
            hint="Turn off animation and transitions."
            checked={prefs.reducedMotion}
            onChange={() => prefs.toggle("reducedMotion")}
          />
          <ToggleRow
            Icon={Type}
            tone="accent"
            label="Larger text"
            hint="Increase the base text size across the app."
            checked={prefs.largerText}
            onChange={() => prefs.toggle("largerText")}
          />
          <ToggleRow
            Icon={Contrast}
            tone="navy"
            label="Higher contrast"
            hint="Strengthen borders and muted text."
            checked={prefs.higherContrast}
            onChange={() => prefs.toggle("higherContrast")}
          />
        </div>
      </Section>

      {/* Vision profile. */}
      <Section
        title="Vision profile"
        description="Tell us how you see color so tools can tailor their explanations."
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Choose your vision profile</legend>
          {CVD_PROFILES.map((option) => {
            const selected = option.id === profile;
            return (
              <label
                key={option.id}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                  selected
                    ? "border-primary bg-surface"
                    : "border-border bg-surface-raised hover:bg-surface",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="vision-profile"
                  value={option.id}
                  checked={selected}
                  onChange={() => setProfile(option.id as VisionProfileId)}
                  className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                />
                <span>
                  <span className="block font-medium text-text">
                    {option.label}
                  </span>
                  <span className="block text-sm text-text-muted">
                    {option.note}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      </Section>

      {/* Account. */}
      <Section title="Account" description="Your local session.">
        <div className="rounded-2xl border border-border bg-surface-raised p-4">
          <p className="text-sm text-text-muted">Signed in as</p>
          <p className="font-medium text-text">
            {user?.name ?? "Guest"}
            {user?.email ? (
              <span className="font-normal text-text-muted">
                {" "}
                · {user.email}
              </span>
            ) : null}
          </p>
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="mt-3 self-start">
          Sign out
        </Button>
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="text-lg font-semibold text-text">
          {title}
        </h2>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ThemeChip({
  Icon,
  label,
  active = false,
  disabled = false,
}: {
  Icon: typeof Moon;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-text-muted",
        disabled ? "opacity-50" : "",
      ].join(" ")}
      aria-current={active ? "true" : undefined}
    >
      <Icon size={16} aria-hidden />
      {label}
      {active && <Check size={15} aria-hidden />}
      {disabled && <span className="text-xs">(soon)</span>}
    </span>
  );
}

function ToggleRow({
  Icon,
  tone,
  label,
  hint,
  checked,
  onChange,
}: {
  Icon: typeof Zap;
  tone: "primary" | "accent" | "navy";
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-4 text-left transition-colors hover:bg-surface"
    >
      <BrandMark tone={tone} icon={<Icon size={18} aria-hidden />} />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-text">{label}</span>
        <span className="block text-sm text-text-muted">{hint}</span>
      </span>
      {/* The switch track. State is conveyed by the knob position AND the
          on/off word, never by color alone. */}
      <span
        aria-hidden
        className={[
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none",
          checked ? "bg-primary" : "bg-border",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform motion-reduce:transition-none",
            checked ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
      <span className="w-7 shrink-0 text-right text-xs font-semibold text-text-muted">
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
