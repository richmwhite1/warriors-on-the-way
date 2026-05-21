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

type Saved = { status: Status; name: string };

type Props = {
  eventId: string;
  eventTitle: string;
  communitySlug: string;
  shareUrl: string;
  goingNames?: string[];
  maybeNames?: string[];
};

const STATUS_OPTIONS: { value: Status; label: string; icon: string; color: string; activeGlow: string }[] = [
  { value: "yes",   label: "I'm going!",    icon: "\u2713", color: "bg-green-600 text-white border-green-600", activeGlow: "shadow-green-200" },
  { value: "maybe", label: "Maybe",          icon: "?", color: "bg-amber-500 text-white border-amber-500", activeGlow: "shadow-amber-200" },
  { value: "no",    label: "Can't make it",  icon: "\u2717", color: "bg-muted text-muted-foreground border-border", activeGlow: "" },
];

/** Lightweight confetti burst using CSS-only particles */
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

export function GuestRsvpForm({ eventId, eventTitle, communitySlug, shareUrl, goingNames = [], maybeNames = [] }: Props) {
  const storageKey = `guest_rsvp_${eventId}`;
  const [saved, setSaved] = useState<Saved | null>(null);
  const [status, setStatus] = useState<Status>("yes");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

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

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);
  }, []);

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

        // Fire confetti for "yes" responses
        if (status === "yes") triggerConfetti();

        if (email.trim()) {
          try {
            await signInWithMagicLink(email.trim(), `/community/${communitySlug}/events/${eventId}`);
            toast.success("RSVP confirmed! Check your email for a link to access your account.");
          } catch {
            toast.success(
              status === "yes" ? "You're in! See you there." :
              status === "maybe" ? "Got it \u2014 hope you can make it!" :
              "Thanks for letting us know."
            );
          }
        } else {
          toast.success(
            status === "yes" ? "You're in! See you there." :
            status === "maybe" ? "Got it \u2014 hope you can make it!" :
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

  // ── Post-RSVP confirmation — celebration + share CTA ──────────────────────
  if (done && saved) {
    const opted = STATUS_OPTIONS.find((o) => o.value === saved.status)!;

    // Build social proof string
    const allGoing = saved.status === "yes"
      ? [saved.name, ...goingNames.filter((n) => n !== saved.name)]
      : goingNames;

    return (
      <div className="relative rounded-2xl border bg-card p-5 space-y-5 overflow-hidden">
        {/* Confetti burst */}
        {showConfetti && <ConfettiBurst />}

        {/* Confirmation header — larger, more celebratory */}
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 transition-transform duration-500 ${
            saved.status === "yes" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 scale-110" :
            saved.status === "maybe" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
            "bg-muted text-muted-foreground"
          }`}>
            {opted.icon}
          </div>
          <div>
            <p className="font-bold text-xl">
              {saved.status === "yes" ? "You\u2019re going!" :
               saved.status === "maybe" ? "Marked as maybe" :
               "Can\u2019t make it"}
            </p>
            <p className="text-sm text-muted-foreground">
              {saved.status === "yes" ? `See you there, ${saved.name}!` : `Thanks, ${saved.name}.`}
            </p>
          </div>
        </div>

        {/* Social proof — who else is going */}
        {saved.status === "yes" && allGoing.length > 1 && (
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {allGoing.slice(0, 4).map((n, i) => (
                  <div
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-green-50 bg-green-100 text-[10px] font-bold text-green-700 uppercase"
                  >
                    {n.charAt(0)}
                  </div>
                ))}
              </div>
              <p className="text-sm text-green-800 font-medium">
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

        {/* Share CTA — big and prominent for "yes" */}
        {saved.status === "yes" ? (
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Spread the word — invite a friend!
            </p>
            <ShareButton
              title={`Join me at ${eventTitle}`}
              text={`I\u2019m going to ${eventTitle} \u2014 come join!`}
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

        {/* Change RSVP link */}
        <button
          type="button"
          onClick={handleChange}
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
                ? `${opt.color} shadow-md ${opt.activeGlow}`
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
            <span className="text-muted-foreground font-normal text-xs">\u2014 optional, creates your free account</span>
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
