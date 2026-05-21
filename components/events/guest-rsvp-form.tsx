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
  goingNames?: string[];
  maybeNames?: string[];
};

const STATUS_OPTIONS: { value: Status; label: string; icon: string; color: string }[] = [
  { value: "yes",   label: "I'm going!",    icon: "✓", color: "bg-green-600 text-white border-green-600" },
  { value: "maybe", label: "Maybe",          icon: "?", color: "bg-amber-500 text-white border-amber-500" },
  { value: "no",    label: "Can't make it",  icon: "✗", color: "bg-muted text-muted-foreground border-border" },
];

export function GuestRsvpForm({ eventId, eventTitle, communitySlug, shareUrl, goingNames = [], maybeNames = [] }: Props) {
  const storageKey = `guest_rsvp_${eventId}`;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [status, setStatus] = useState<Status>("yes");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

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

        if (email.trim()) {
          try {
            await signInWithMagicLink(email.trim(), `/community/${communitySlug}/events/${eventId}`);
            toast.success("RSVP confirmed! Check your email for a link to access your account.");
          } catch {
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

  // ── Post-RSVP confirmation with social proof ──────────────────────────────
  if (done && saved) {
    const opted = STATUS_OPTIONS.find((o) => o.value === saved.status)!;

    // Build social proof string
    const allGoing = saved.status === "yes"
      ? [saved.name, ...goingNames.filter((n) => n !== saved.name)]
      : goingNames;

    return (
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        {/* Confirmation header */}
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
            saved.status === "yes" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            saved.status === "maybe" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-muted text-muted-foreground"
          }`}>
            {opted.icon}
          </div>
          <div>
            <p className="font-semibold text-lg">
              {saved.status === "yes" ? "You're going!" :
               saved.status === "maybe" ? "Marked as maybe" :
               "Can't make it"}
            </p>
            <p className="text-sm text-muted-foreground">
              {saved.status === "yes" ? `See you there, ${saved.name}!` : `Thanks, ${saved.name}.`}
            </p>
          </div>
        </div>

        {/* Social proof — who else is going */}
        {saved.status === "yes" && allGoing.length > 1 && (
          <div className="rounded-xl bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {allGoing.slice(0, 4).map((n, i) => (
                  <div
                    key={i}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary/15 text-[9px] font-bold text-primary uppercase"
                  >
                    {n.charAt(0)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {allGoing.length === 2
                  ? `You and ${allGoing[1]} are going`
                  : `You, ${allGoing[1]}, and ${allGoing.length - 2} ${allGoing.length - 2 === 1 ? "other" : "others"} are going`}
              </p>
            </div>
          </div>
        )}

        {saved.status === "maybe" && maybeNames.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {maybeNames.filter((n) => n !== saved.name).length > 0
              ? `${maybeNames.filter((n) => n !== saved.name).slice(0, 2).join(" and ")} ${maybeNames.filter((n) => n !== saved.name).length === 1 ? "is" : "are"} also considering it`
              : null}
          </p>
        )}

        {/* Actions */}
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

  // ── RSVP form ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-5 space-y-5">
      <p className="text-lg font-semibold">Will you be there?</p>

      {/* Status selection — large, tappable pills */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={[
              "flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium border transition-all",
              status === opt.value
                ? opt.color
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            ].join(" ")}
          >
            <span className="text-base">{opt.icon}</span>
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
            className="h-11"
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
            className="h-11"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending || !name.trim()} size="lg" className="w-full">
        {isPending ? "Saving..." : "Confirm RSVP"}
      </Button>
    </form>
  );
}
