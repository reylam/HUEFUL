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
  CircleHelp,
} from "lucide-react";
import { useAuth } from "@/stores/auth";
import { WELCOME_TOUR, useOnboarding } from "@/stores/onboarding";
import { usePreferences } from "@/stores/preferences";
import type { ThemePreference } from "@/stores/preferences";
import { Button } from "@/shared/ui/Button";
import { BrandMark } from "@/shared/ui/BrandMark";
import { VisionProfilePicker } from "@/shared/ui/VisionProfilePicker";

/*
  Settings, kept simple and honest. Appearance picks the theme: Light is the
  default, Dark is the low-glare option, System follows the OS. Accessibility toggles
  are real: they persist and apply app-wide via the preferences store. Vision
  profile changes how tools phrase explanations. Help replays the welcome tour.
  Account shows the local stub session.
*/
export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const replayTour = useOnboarding((s) => s.replay);

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
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
          {THEMES.map(({ value, label, Icon }) => (
            <ThemeChip
              key={value}
              Icon={Icon}
              label={label}
              active={prefs.theme === value}
              onSelect={() => prefs.setTheme(value)}
            />
          ))}
        </div>
        <p className="text-sm text-text-muted">
          Dark can be easier on the eyes outdoors or at night. System follows your
          device.
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
        <VisionProfilePicker legend="Choose your vision profile" />
      </Section>

      {/* Help. */}
      <Section
        title="Help"
        description="See the short tour of Hueful again: how answers read, your color vision, and the tools."
      >
        <Button
          variant="ghost"
          onClick={() => replayTour(WELCOME_TOUR)}
          className="self-start"
        >
          <CircleHelp size={18} aria-hidden />
          Replay welcome tour
        </Button>
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

const THEMES: { value: ThemePreference; label: string; Icon: typeof Moon }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

function ThemeChip({
  Icon,
  label,
  active,
  onSelect,
}: {
  Icon: typeof Moon;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={[
        "inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface-raised text-text-muted hover:bg-surface-sunken hover:text-text",
      ].join(" ")}
    >
      <Icon size={16} aria-hidden />
      {label}
      {active && <Check size={15} aria-hidden />}
    </button>
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
          checked ? "bg-primary" : "bg-border-strong",
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
