import { useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/shared/ui/Button";

export interface AuthField {
  name: string;
  label: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  placeholder?: string;
}

interface AuthFormProps {
  fields: AuthField[];
  submitLabel: string;
  pendingLabel: string;
  /** Return an error message string to show it; return null on success. */
  onSubmit: (values: Record<string, string>) => Promise<string | null>;
  footer: ReactNode;
}

/*
  Shared form for login and register. It owns the four UX states a form needs:
  idle, submitting (button shows pending + is disabled), error (a single
  role="alert" region, focusable), and success (handled by the caller, which
  navigates away). Inputs use real labels tied by id and native validation, so
  it stays light and keyboard/screen-reader friendly without a form library.
*/
export function AuthForm({
  fields,
  submitLabel,
  pendingLabel,
  onSubmit,
  footer,
}: AuthFormProps) {
  const errorId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      fields.map((f) => [f.name, String(formData.get(f.name) ?? "").trim()]),
    );

    try {
      const message = await onSubmit(values);
      if (message) setError(message);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {fields.map((field) => (
        <Field key={field.name} field={field} disabled={pending} />
      ))}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="rounded-xl border border-status-danger px-3 py-2 text-sm text-text"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>

      <p className="text-center text-sm text-text-muted">{footer}</p>
    </form>
  );
}

function Field({ field, disabled }: { field: AuthField; disabled: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text">
        {field.label}
      </label>
      <input
        id={id}
        name={field.name}
        type={field.type}
        autoComplete={field.autoComplete}
        placeholder={field.placeholder}
        required
        disabled={disabled}
        className="min-h-11 rounded-2xl border border-border bg-surface-raised px-4 text-base text-text placeholder:text-text-muted disabled:opacity-60"
      />
    </div>
  );
}
