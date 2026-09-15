import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { PublicLayout } from "./layouts/PublicLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { lenses } from "./lenses";

/*
  Two zones, one router:
  - Public zone (PublicLayout): "/" is the landing page, plus /login and
    /register. "/" is never redirected to the dashboard.
  - App zone (DashboardLayout): "/dashboard" is the app home; each lens is a
    lazy route under it. The layout guards the zone (redirects to /login).

  Route element components are lazy-loaded so the landing page ships without the
  dashboard, and each lens's heavy code loads only when opened.
*/

const LandingPage = lazy(() =>
  import("@/features/landing").then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(() =>
  import("@/features/auth").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth").then((m) => ({ default: m.RegisterPage })),
);
const DashboardHome = lazy(() =>
  import("@/features/dashboard-home").then((m) => ({
    default: m.DashboardHome,
  })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings").then((m) => ({ default: m.SettingsPage })),
);
const NotFoundPage = lazy(() =>
  import("@/features/not-found").then((m) => ({ default: m.NotFoundPage })),
);

export function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          {lenses.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster
        position="bottom-center"
        toastOptions={{
          className:
            "rounded-xl border border-border bg-surface-raised text-text",
        }}
      />
    </>
  );
}
