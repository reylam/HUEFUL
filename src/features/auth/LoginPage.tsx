import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth";
import { AuthShell } from "./AuthShell";
import { AuthForm } from "./AuthForm";
import type { AuthField } from "./AuthForm";

const fields: AuthField[] = [
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    placeholder: "you@example.com",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "current-password",
  },
];

interface FromState {
  from?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuth((s) => s.signIn);
  const from = (location.state as FromState | null)?.from ?? "/dashboard";

  return (
    <AuthShell title="Welcome back" subtitle="Log in to open your tools.">
      <AuthForm
        fields={fields}
        submitLabel="Log in"
        pendingLabel="Logging in…"
        onSubmit={async (values) => {
          if (!values.email.includes("@")) {
            return "Enter a valid email address.";
          }
          if (values.password.length < 6) {
            return "Password should be at least 6 characters.";
          }
          signIn(values.email);
          toast.success("Logged in.");
          navigate(from, { replace: true });
          return null;
        }}
        footer={
          <>
            New here?{" "}
            <Link to="/register" className="font-semibold text-text underline">
              Create an account
            </Link>
          </>
        }
      />
    </AuthShell>
  );
}
