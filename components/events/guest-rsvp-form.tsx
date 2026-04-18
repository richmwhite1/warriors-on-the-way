"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitGuestRsvp } from "@/lib/actions/rsvp";
import { signInWithMagicLink } from "@/lib/actions/auth";
import { ShareButton } from "@/components/events/share-button";
import { toast } from "sonner";

type Status = "yes" | "maybe" | "no";

type Saved = { status: Status; name: string };

type Props = {
  eventId: string;
  eventTitle: string;
  communitySlug: string;
  shareUrl: string;
};

const STATUS_OPTIONS: { value: Status; label: string; icon: string }[] = [
  { value: "yes",   label: "I'm going!",    icon: "✓" },
  { value: "maybe", label: "Maybe",          icon: "?" },
  { value: "no",    label: "Can't make it",  icon: "✗" },
];

export function GuestRsvpForm({ eventId, eventTitle, communitySlug, shareUrl }: Props) {
  const storageKey = `guest_rsvp_${eventId}`;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [status, setStatus] = useState<Status>("yes");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: Saved = JSON.parse(raw);
        setSaved(parsed);
        setDone(true);
        setStatus(parsed.status);
        setName(parsed.name);
      }
    } catch {
      // ignore parse errors
    }
  }, [storageKey]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        await submitGuestRsvp(eventId, name, email || null, status, communitySlug);
        const s: Saved = { status, name: name.trim() };
        localStorage.setItem(storageKey, JSON.stringify(s));
        setSaved(s);
        setDone(true);

        // Auto-create account via magic link if email was provided
        if (email.trim()) {
          try {
            await signInWithMagicLink(email.trim(), `/community/${communitySlug}/events/${eventId}`);
            toast.success("RSVP confirmed! Check your email for a link to access your account.");
          } catch {
            // RSVP succeeded, magic link failed — still show success
            toast.success(
              status === "yes" ? "You're in! See you there." :
              status === "maybe" ? "Got it — hope you can make it!" :
              "Thanks for letting us know."
            );
          }
        } else {
          toast.success(
            status === "yes" ? "You're in! See you there." :
            status === "maybe" ? "Got it — hope you can make it!" :
            "Thanks for letting us know."
          );
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleChange() {
    setDone(false);
  }

  if (done && saved) {
    const opted = STATUS_OPTIONS.find((o) => o.value === saved.status)!;
    return (
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
            {opted.icon}
          </div>
          <div>
            <p className="font-medium">{opted.label}</p>
            <p className="text-sm text-muted-foreground">
              {saved.status === "yes" ? `See you there, ${saved.name}!` : `Thanks, ${saved.name}.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ShareButton
            title={`Join me at ${eventTitle}`}
            text={`I'm going to ${eventTitle} — come join!`}
            url={shareUrl}
            variant="default"
            size="sm"
          />
          <button
            type="button"
            onClick={handleChange}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Change my RSVP
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-5 space-y-4">
      <p className="font-medium">Will you be there?</p>

      {/* Status selection */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={[
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
              status === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            ].join(" ")}
          >
            <span>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Name + email */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="guest-name">Your name</Label>
          <Input
            id="guest-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First name is fine"
            required
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guest-email">
            Email{" "}
            <span className="text-muted-foreground font-normal text-xs">— optional, creates your free account</span>
          </Label>
          <Input
            id="guest-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={200}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending || !name.trim()} className="w-full sm:w-auto">
        {isPending ? "Saving…" : "Confirm RSVP"}
      </Button>
    </form>
  );
}
