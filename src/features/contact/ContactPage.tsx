import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Mail, MessageSquare, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/Button";
import { Reveal } from "@/shared/ui/Reveal";
import { TiltCard } from "@/shared/ui/TiltCard";
import { WavyBackground } from "@/shared/ui/WavyBackground";

/*
  Public "Contact" page. A short, honest form plus a couple of direct channels.
  The form is client-only (no backend yet), so it validates in the browser,
  shows idle / submitting / success states, and confirms with a toast. It is
  upfront that messages are not sent anywhere yet, so nobody expects a reply
  from a prototype.
*/

const channels = [
  {
    Icon: Mail,
    label: "Email",
    value: "hello@hueful.app",
    href: "mailto:hello@hueful.app",
  },
  {
    Icon: ExternalLink,
    label: "Project",
    value: "Report an issue",
    href: "https://github.com",
  },
];

export function ContactPage() {
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const errorId = useId();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setError("Please fill in your name, email, and a short message.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email address doesn't look right. Please check it.");
      return;
    }

    setPending(true);
    // No backend yet: simulate a short send so the states are real, then confirm.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setPending(false);
    setSent(true);
    toast.success("Thanks. Your message is noted (this is a prototype).");
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 md:px-6">
      <WavyBackground />

      <section className="py-16 text-center md:py-24">
        <Reveal
          as="p"
          className="text-sm font-semibold uppercase tracking-wide text-accent"
        >
          Contact
        </Reveal>
        <Reveal
          as="h1"
          delay={0.05}
          className="mx-auto mt-3 max-w-2xl text-4xl font-bold leading-tight text-text sm:text-5xl"
        >
          Say hello or send feedback.
        </Reveal>
        <Reveal
          as="p"
          delay={0.1}
          className="mx-auto mt-5 max-w-xl text-lg text-text-muted"
        >
          We'd love to hear how you'd use HUEFUL. This form is a prototype, so
          messages aren't delivered yet, but the channels below reach us.
        </Reveal>
      </section>

      <section className="grid gap-6 border-t border-border py-10 md:grid-cols-5 md:py-14">
        {/* Direct channels. */}
        <div className="flex flex-col gap-4 md:col-span-2">
          {channels.map(({ Icon, label, value, href }) => (
            <Reveal key={label}>
              <TiltCard className="rounded-card border border-border bg-surface-raised p-4">
                <a
                  href={href}
                  className="flex items-center gap-3 text-text"
                  {...(href.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm text-text-muted">{label}</span>
                    <span className="block font-semibold">{value}</span>
                  </span>
                </a>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        {/* Form. */}
        <div className="md:col-span-3">
          <Reveal>
            {sent ? (
              <div
                role="status"
                className="flex flex-col items-start gap-3 rounded-card border border-status-unripe bg-surface-raised p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
                  <MessageSquare size={20} aria-hidden />
                </span>
                <h2 className="text-lg font-semibold text-text">
                  Message noted
                </h2>
                <p className="text-text-muted">
                  Thanks for reaching out. When the backend is live this will
                  actually send. For now, use the email link if you need a reply.
                </p>
                <Button variant="ghost" onClick={() => setSent(false)}>
                  Send another
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-4 rounded-card border border-border bg-surface-raised p-6"
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={nameId} className="text-sm font-medium text-text">
                    Name
                  </label>
                  <input
                    id={nameId}
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={pending}
                    className="min-h-11 rounded-2xl border border-border bg-surface px-4 text-base text-text placeholder:text-text-muted disabled:opacity-60"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={emailId} className="text-sm font-medium text-text">
                    Email
                  </label>
                  <input
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={pending}
                    className="min-h-11 rounded-2xl border border-border bg-surface px-4 text-base text-text placeholder:text-text-muted disabled:opacity-60"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={messageId}
                    className="text-sm font-medium text-text"
                  >
                    Message
                  </label>
                  <textarea
                    id={messageId}
                    name="message"
                    rows={4}
                    required
                    disabled={pending}
                    className="rounded-2xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted disabled:opacity-60"
                  />
                </div>

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
                  {pending ? "Sending..." : "Send message"}
                </Button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
