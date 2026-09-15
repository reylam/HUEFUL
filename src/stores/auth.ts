import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
  Client-only auth for the prototype. There is no backend yet, so this stores a
  local "session" (just an email + display name) and persists it to
  localStorage. It is deliberately honest about being a stub: no password is
  ever checked or stored, and the UI says as much on the auth screens.

  When a real API exists, swap the sign-in/sign-up bodies for network calls and
  keep the same store shape so nothing downstream changes.
*/

export interface SessionUser {
  email: string;
  name: string;
}

interface AuthState {
  user: SessionUser | null;
  signIn: (email: string) => void;
  signUp: (name: string, email: string) => void;
  signOut: () => void;
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (email) => set({ user: { email, name: nameFromEmail(email) } }),
      signUp: (name, email) => set({ user: { name, email } }),
      signOut: () => set({ user: null }),
    }),
    { name: "all_eyes.session" },
  ),
);
