import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/stores/auth";
import { AuthShell } from "./AuthShell";
import { AuthForm } from "./AuthForm";
import type { AuthField } from "./AuthForm";

const fields: AuthField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    autoComplete: "name",
    placeholder: "Your name",
  },
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
    autoComplete: "new-password",
  },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const signUp = useAuth((s) => s.signUp);

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a moment, and it's free."
    >
      <AuthForm
        fields={fields}
        submitLabel="Create account"
        pendingLabel="Creating account…"
        onSubmit={async (values) => {
          if (!values.name) return "Please enter your name.";
          if (!values.email.includes("@")) {
            return "Enter a valid email address.";
          }
          if (values.password.length < 6) {
            return "Choose a password of at least 6 characters.";
          }
          signUp(values.name, values.email);
          toast.success("Account created.");
          navigate("/dashboard", { replace: true });
          return null;
        }}
        footer={
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-text underline">
              Log in
            </Link>
          </>
        }
      />
    </AuthShell>
  );
}
