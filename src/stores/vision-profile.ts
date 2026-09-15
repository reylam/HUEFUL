import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  The user's vision profile. This is a product-level preference, not a cosmetic
  toggle: lenses read it to tailor explanations (for example, flagging a
  red/green pair as a likely confusion for a deuteranope). Kept in its own store
  so any feature can read it without importing auth.
*/

export type VisionProfileId =
  | "unknown"
  | "deuteranopia"
  | "protanopia"
  | "tritanopia"
  | "typical";

interface ProfileOption {
  id: VisionProfileId;
  label: string;
  note: string;
}

export const CVD_PROFILES: ProfileOption[] = [
  {
    id: "unknown",
    label: "I'm not sure",
    note: "We'll keep explanations general and safe for every type.",
  },
  {
    id: "deuteranopia",
    label: "Deuteranopia",
    note: "Green-weak. The most common type of color blindness.",
  },
  { id: "protanopia", label: "Protanopia", note: "Red-weak." },
  { id: "tritanopia", label: "Tritanopia", note: "Blue-weak. Rare." },
  {
    id: "typical",
    label: "Typical color vision",
    note: "I'm using this to help someone else, or just exploring.",
  },
];

interface VisionProfileState {
  profile: VisionProfileId;
  setProfile: (profile: VisionProfileId) => void;
}

export const useVisionProfile = create<VisionProfileState>()(
  persist(
    (set) => ({
      profile: "unknown",
      setProfile: (profile) => set({ profile }),
    }),
    { name: "all_eyes.vision-profile" },
  ),
);
