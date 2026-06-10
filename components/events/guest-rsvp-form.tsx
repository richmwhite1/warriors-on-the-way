"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitGuestRsvp } from "@/lib/actions/rsvp";
import { signInWithMagicLink } from "@/lib/actions/auth";
import { ShareButton } from "@/components/events/share-button";
import { toast } from "sonner";

type Status = "yes" | "maybe" | "no";
type Saved = { status: Status; name: string; token?: string };

type Props = {
  eventId: string;
  eventTitle: string;
  communitySlug: string;
  shareUrl: string;
  goingNames?: string[];
  maybeNames?: string[];
  /** Server-determined: only show phone/SMS fields when Twilio is configured */
  smsEnabled?: boolean;
};

const STATUS_OPTIONS: { value: Status; label: string; emoji: string; selectedCls: string }[] = [
  { value: "yes",   label: "I'm going!",   emoji: "✓", selectedCls: "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "maybe", label: "Maybe",         emoji: "?", selectedCls: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "no",    label: "Can't make it", emoji: "✗", selectedCls: "border-foreground bg-muted text-foreground" },
];

function ConfettiBurst() {
  const [particles] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      y: -(Math.random() * 120 + 40),
      rotate: Math.random() * 360,
      scale: Math.random() * 0.6 + 0.4,
      color: ["#e07040", "#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"][i % 6],
      delay: Math.random() * 200,
    }))
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full animate-confetti-burst"
          style={{
            backgroundColor: p.color,
            // @ts-expect-error -- CSS custom properties for the keyframe
            "--confetti-x": `${p.x}px`,
            "--confetti-y": `${p.y}px`,
            "--confetti-rotate": `${p.rotate}deg`,
            "--confetti-scale": p.scale,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function GuestRsvpForm({
  eventId, eventTitle, communitySlug, shareUrl,
  goingNames = [], maybeNames = [], smsEnabled = false,
}: Props) {
  const storageKey = `guest_rsvp_${eventId}`;

  const [status, setStatus] = useState<Status | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifySms, setNotifySms] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [done, setDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: Saved = JSON.parse(raw);
        setSaved(parsed);
        setStatus(parsed.status);
        setName(parsed.name);
        setToken(parsed.token ?? crypto.randomUUID());
        setDone(true);
      } else {
        // Stable per-browser token so changing the RSVP updates the same row
        setToken(crypto.randomUUID());
      }
    } catch {
      setToken(crypto.randomUUID());
    }
  }, [storageKey]);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!status || !name.trim()) return;
    const resolvedStatus = status;

    startTransition(async () => {
      try {
        await submitGuestRsvp(eventId, name.trim(), email.trim() || null, resolvedStatus, communitySlug, phone.trim() || null, phone.trim() ? notifySms : false, token);
        const s: Saved = { status: resolvedStatus, name: name.trim(), token: token ?? undefined };
        localStorage.setItem(storageKey, JSON.stringify(s));
        setSaved(s);
        setDone(true);
        if (resolvedStatus === "yes") triggerConfetti();

        if (email.trim()) {
          try {
            await signInWithMagicLink(email.trim(), `/community/${communitySlug}/events/${eventId}`);
            toast.success("RSVP confirmed! Check your email to access your account.");
          } catch {
            toast.success("You're in! Check your email for a sign-in link.");
          }
        } else {
          toast.success(
            resolvedStatus === "yes" ? "You're in! See you there." :
            resolvedStatus === "maybe" ? "Got it — hope you can make it!" :
            "Thanks for letting us know."
          );
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  // ── Post-RSVP confirmation ────────────────────────────────────────────────
  if (done && saved) {
    const opted = STATUS_OPTIONS.find((o) => o.value === saved.status)!;
    const allGoing = saved.status === "yes"
      ? [saved.name, ...goingNames.filter((n) => n !== saved.name)]
      : goingNames;

    return (
      <div className="relative rounded-2xl border bg-card p-5 space-y-5 overflow-hidden">
        {showConfetti && <ConfettiBurst />}

        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ${
            saved.status === "yes" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            saved.status === "maybe" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-muted text-muted-foreground"
          }`}>
            {opted.emoji}
          </div>
          <div>
            <p className="font-bold text-xl">
              {saved.status === "yes" ? "You're going!" :
               saved.status === "maybe" ? "Marked as maybe" :
               "Can't make it"}
            </p>
            <p className="text-sm text-muted-foreground">
              {saved.status === "yes" ? `See you there, ${saved.name}!` : `Thanks, ${saved.name}.`}
            </p>
          </div>
        </div>

        {saved.status === "yes" && allGoing.length > 1 && (
          <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {allGoing.slice(0, 4).map((n, i) => (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-green-50 dark:border-green-950 bg-green-100 dark:bg-green-900/50 text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">
                    {n.charAt(0)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                {allGoing.length === 2
                  ? `You and ${allGoing[1]} are going`
                  : `You, ${allGoing[1]}, and ${allGoing.length - 2} others are going`}
              </p>
            </div>
          </div>
        )}

        {saved.status === "yes" ? (
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-3">
            <p className="text-sm font-medium">Spread the word — invite a friend!</p>
            <ShareButton
              title={`Join me at ${eventTitle}`}
              text={`I'm going to ${eventTitle} — come join!`}
              url={shareUrl}
              variant="default"
              size="default"
            />
          </div>
        ) : (
          <ShareButton
            title={eventTitle}
            text={`Check out ${eventTitle}`}
            url={shareUrl}
            variant="outline"
            size="sm"
          />
        )}

        <button
          type="button"
          onClick={() => { setDone(false); setStatus(saved.status); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Change my RSVP
        </button>
      </div>
    );
  }

  // ── RSVP form ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-5 space-y-5">
      <p className="text-lg font-semibold">Will you be there?</p>

      {/* Status — full-width buttons, touch-action:manipulation eliminates iOS 300ms delay */}
      <div className="flex flex-col gap-2" role="group" aria-label="RSVP status">
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setStatus(opt.value);
              }}
              style={{ touchAction: "manipulation" }}
              className={[
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left w-full select-none transition-colors",
                isSelected
                  ? opt.selectedCls
                  : "border-border bg-background text-muted-foreground",
              ].join(" ")}
            >
              <span className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                isSelected ? "border-current bg-current/10" : "border-border",
              ].join(" ")}>
                {opt.emoji}
              </span>
              <span className="font-medium text-sm">{opt.label}</span>
              {isSelected && (
                <span className="ml-auto shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="guest-name">Your name</Label>
        <Input
          id="guest-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name is fine"
          required
          maxLength={80}
          className="h-12 text-base"
        />
      </div>

      {/* Phone — optional, for SMS reminders. Hidden when Twilio isn't
          configured: never promise texts that won't be sent. */}
      {smsEnabled && (
      <div className="space-y-1.5">
        <Label htmlFor="guest-phone" className="flex items-center gap-1.5">
          Phone
          <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">optional</span>
        </Label>
        <Input
          id="guest-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          maxLength={20}
          className="h-12 text-base"
        />
        {phone.trim() && (
          <label className="flex items-start gap-2 mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifySms}
              onChange={(e) => setNotifySms(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-border"
            />
            <span className="text-xs text-muted-foreground">
              Text me event reminders. Msg &amp; data rates may apply. Reply STOP
              anytime to opt out.
            </span>
          </label>
        )}
        {!phone.trim() && (
          <p className="text-xs text-muted-foreground">
            Get a text reminder before the event.
          </p>
        )}
      </div>
      )}

      {/* Email — clearly optional */}
      <div className="space-y-1.5">
        <Label htmlFor="guest-email" className="flex items-center gap-1.5">
          Email
          <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">optional</span>
        </Label>
        <Input
          id="guest-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={200}
          className="h-12 text-base"
        />
        <p className="text-xs text-muted-foreground">
          Add your email to get a free account and manage your RSVP later.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending || !status || !name.trim()}
        size="lg"
        className="w-full h-12 text-base"
      >
        {isPending ? "Saving…" : "Confirm RSVP"}
      </Button>

      {!status && (
        <p className="text-xs text-center text-muted-foreground -mt-2">
          Select an option above to continue
        </p>
      )}
    </form>
  );
}
