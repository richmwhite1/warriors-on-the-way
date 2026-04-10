import Link from "next/link";
import { AudioPlayer } from "@/components/ui/audio-player";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

const MISSION_POINTS = [
  "Take education away from the child molesters",
  "Take economics away from the banksters",
  "Take healing away from Big Pharma",
  "Take storytelling away from the mass media",
  "Take entertainment away from Hollywood",
  "Take food production away from agribusiness",
  "Take fire away from the military-industrial complex",
  "Take democracy away from the politicians",
  "Take spirituality away from Mecca and from Rome",
];

const SHIFTS = [
  { domain: "Education",     from: "Indoctrination",                              to: "Exploration" },
  { domain: "Entertainment", from: "Sensual arousal",                             to: "Mystical stimulation" },
  { domain: "Economics",     from: "Dominion by the elite",                       to: "Distribution to all" },
  { domain: "Religion",      from: "Dogmatic sectarianism",                       to: "Unity identity" },
  { domain: "Politics",      from: "Party-affiliated blindness",                  to: "Issue-identified solutions" },
  { domain: "Agriculture",   from: "Gaia-destructive profiteering",               to: "Gaia-enhancing gratitude" },
  { domain: "Medicine",      from: "Pharmaceutically controlled disease management", to: "People-centered, hands-on healthcare" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-heading font-semibold text-lg tracking-tight">
          Warriors on the Way
        </span>
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
        >
          Sign in
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 py-20 sm:py-28 gap-8">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">
            Another name for lightworkers
          </p>
          <h1 className="text-5xl sm:text-6xl font-heading font-semibold leading-tight">
            Warriors on the Way
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            A gathering of lightbringers committed to transforming consciousness,
            reclaiming institutions, and walking the spiritual path together —
            in small, intimate communities built for the long journey.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
          >
            Join the path
          </Link>
          <a
            href="#mission"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8")}
          >
            Read the manifesto ↓
          </a>
        </div>
      </section>

      {/* ── Seán ─────────────────────────────────────────────────────────────── */}
      <section className="border-y bg-muted/20 px-6 py-14">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-8 items-center sm:items-start">
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sean-olaoire.webp"
              alt="Seán Ó Laoire"
              className="size-28 rounded-full object-cover object-top shadow"
            />
          </div>
          <div className="space-y-4 text-center sm:text-left">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                Spiritual Director
              </p>
              <h2 className="text-2xl font-heading font-semibold">Seán Ó Laoire</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              Irish-born priest, scientist, and mystic — holding advanced degrees in philosophy,
              mathematics, theology, and clinical psychology. Author of <em>Souls on Safari</em>.
              As Spiritual Director of Warriors on the Way, Seán provides the philosophical
              foundation and the Lightworkers Manifesto that animates everything we do.
            </p>
            <AudioPlayer
              src="/audio/sean-healdsburg.m4a"
              label="Seán on the purpose of Warriors on the Way"
            />
          </div>
        </div>
      </section>

      {/* ── Manifesto ─────────────────────────────────────────────────────────── */}
      <section id="mission" className="px-6 py-20 max-w-3xl mx-auto w-full space-y-16">

        <div className="text-center space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">
            The Lightworkers Manifesto
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold">Seán Ó Laoire</h2>
        </div>

        {/* Mission */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0">
              Mission
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-base text-muted-foreground leading-relaxed">
            We are in a battle for the soul of the planet, and so God is sending in the warriors
            and lightbringers whose mission is:
          </p>

          <ul className="space-y-3">
            {MISSION_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-[6px] size-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-base font-medium text-foreground leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0">
              Why
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-base text-muted-foreground leading-relaxed">
            As a human species, we need a transformation of both our consciousness and our mission.
            As we move from <em className="text-foreground">Homo sapiens sapiens</em> to{" "}
            <em className="text-foreground font-semibold">Homo spiritualis</em>,
            avoiding <em className="text-foreground">Homo sociopathicus</em> and{" "}
            <em className="text-foreground">Homo artificialis</em>, we must:
          </p>

          <div className="space-y-3">
            {SHIFTS.map(({ domain, from, to }) => (
              <div key={domain} className="flex items-start gap-4 rounded-xl border bg-card px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary w-24 shrink-0 pt-0.5">
                  {domain}
                </span>
                <div className="text-sm leading-snug">
                  <span className="text-muted-foreground line-through opacity-60">{from}</span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="font-semibold text-foreground">{to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0">
              How
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                title: "Small by design",
                body: "Each community is capped at 150 people — the size at which genuine relationship and trust are still possible.",
              },
              {
                title: "Local and embodied",
                body: "Hikes, retreats, sound baths, shared meals — because transformation happens in person, not just online.",
              },
              {
                title: "Connected upward",
                body: "Every local community is part of the broader Warriors on the Way network, anchored by the Spiritual Director.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-2xl border bg-card p-5 space-y-2">
                <h3 className="font-heading font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="border-t px-6 py-20 flex flex-col items-center text-center gap-6">
        <div className="space-y-3 max-w-lg">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
            Are you a warrior on the way?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            If you feel the call to reclaim what has been captured — and to walk
            that path in community with others — this is your home.
          </p>
        </div>
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ size: "lg" }), "rounded-full px-10")}
        >
          Join the path
        </Link>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t py-6 px-6 text-center text-xs text-muted-foreground">
        <p>
          Warriors on the Way &middot;{" "}
          <Link href="/terms" className="underline-offset-2 hover:underline">Terms</Link>
          {" "}&middot;{" "}
          <Link href="/privacy" className="underline-offset-2 hover:underline">Privacy</Link>
        </p>
      </footer>

    </main>
  );
}
