import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth";
import { useVisionProfile, CVD_PROFILES } from "@/stores/vision-profile";
import type { VisionProfileId } from "@/stores/vision-profile";
import { Button } from "@/shared/ui/Button";

/*
  Settings holds the Vision Profile, the one preference that changes how the
  whole app reads for a user. Picking a profile isn't cosmetic: lenses can use
  it to tailor explanations (e.g. warn when two colors are a known confusion
  pair for that type). Stored locally, applied everywhere via the store.
*/
export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const profile = useVisionProfile((s) => s.profile);
  const setProfile = useVisionProfile((s) => s.setProfile);

  function handleSignOut() {
    signOut();
    toast.success("Signed out.");
    navigate("/");
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="profile-heading" className="flex flex-col gap-3">
        <div>
          <h2
            id="profile-heading"
            className="text-lg font-semibold text-text"
          >
            Vision profile
          </h2>
          <p className="text-sm text-text-muted">
            Tell us how you see color so the app can tailor its explanations.
            You can change this any time.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Choose your vision profile</legend>
          {CVD_PROFILES.map((option) => {
            const selected = option.id === profile;
            return (
              <label
                key={option.id}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4",
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
      </section>

      <section aria-labelledby="account-heading" className="flex flex-col gap-3">
        <h2 id="account-heading" className="text-lg font-semibold text-text">
          Account
        </h2>
        <div className="rounded-2xl border border-border bg-surface-raised p-4">
          <p className="text-sm text-text-muted">Signed in as</p>
          <p className="font-medium text-text">
            {user?.name ?? "Guest"}
            {user?.email ? (
              <span className="font-normal text-text-muted"> · {user.email}</span>
            ) : null}
          </p>
        </div>
        <Button variant="ghost" onClick={handleSignOut} className="self-start">
          Sign out
        </Button>
      </section>
    </div>
  );
}
