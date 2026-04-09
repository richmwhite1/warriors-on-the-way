import Link from "next/link";
import { AudioPlayer } from "@/components/ui/audio-player";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

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
      <section className="flex flex-col items-center text-center px-6 py-20 sm:py-28 gap-8 bg-gradient-to-b from-[#c4704a]/10 to-transparent">
        <div className="space-y-5 max-w-2xl">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">
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
            href="#manifesto"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8")}
          >
            Read the manifesto ↓
          </a>
        </div>
      </section>

      {/* ── Lightworkers Manifesto ───────────────────────────────────────────── */}
      <section id="manifesto" className="px-6 py-20 max-w-3xl mx-auto w-full space-y-16">

        <div className="text-center space-y-3">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">
            The Lightworkers Manifesto
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
            Seán Ó Laoire
          </h2>
        </div>

        {/* Part One */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
              Part One
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <blockquote className="text-base sm:text-lg leading-relaxed text-foreground space-y-4">
            <p>
              We are in a battle for the soul of the planet, and so God is sending
              in the warriors and lightbringers whose mission is:
            </p>
            <ul className="space-y-2 pl-2 border-l-2 border-primary/30 ml-2">
              {[
                "To take education away from the child molesters",
                "To take economics away from the banksters",
                "To take healing away from Big Pharma",
                "To take storytelling away from the mass media",
                "To take entertainment away from Hollywood",
                "To take food production away from agribusiness",
                "To take fire away from the military-industrial complex",
                "To take democracy away from the politicians",
                "And to take spirituality away from Mecca and from Rome",
              ].map((line) => (
                <li key={line} className="pl-4 text-muted-foreground">
                  {line}
                </li>
              ))}
            </ul>
          </blockquote>
        </div>

        {/* Part Two */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
              Part Two
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-6 text-base sm:text-lg leading-relaxed">
            <p className="text-foreground">
              As a human species, we need a transformation of both our consciousness
              and our mission. As we move from <em>Homo sapiens sapiens</em> to{" "}
              <em>Homo spiritualis</em>, avoiding <em>Homo sociopathicus</em> and{" "}
              <em>Homo artificialis</em>, we must:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  from: "Indoctrination",
                  to: "Exploration",
                  domain: "Education",
                },
                {
                  from: "Sensual arousal",
                  to: "Mystical stimulation",
                  domain: "Entertainment",
                },
                {
                  from: "Dominion by the elite",
                  to: "Distribution to all",
                  domain: "Economics",
                },
                {
                  from: "Dogmatic sectarianism",
                  to: "Unity identity",
                  domain: "Religion",
                },
                {
                  from: "Party-affiliated blindness",
                  to: "Issue-identified solutions",
                  domain: "Politics",
                },
                {
                  from: "Gaia-destructive profiteering",
                  to: "Gaia-enhancing gratitude",
                  domain: "Agriculture",
                },
                {
                  from: "Pharmaceutically controlled disease management",
                  to: "People-centered, hands-on healthcare",
                  domain: "Medicine",
                },
              ].map(({ from, to, domain }) => (
                <div
                  key={domain}
                  className="rounded-2xl border bg-card p-4 space-y-2"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {domain}
                  </p>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="space-y-1 flex-1">
                      <p className="text-muted-foreground line-through opacity-60">{from}</p>
                      <p className="font-medium text-foreground">→ {to}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Spiritual Director + Audio ───────────────────────────────────────── */}
      <section className="border-t bg-muted/30 px-6 py-20">
        <div className="max-w-3xl mx-auto space-y-10">

          <div className="text-center space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-widest">
              Spiritual Director · Warriors on the Way
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
              Seán Ó Laoire
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="shrink-0 mx-auto sm:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sean-olaoire.webp"
                alt="Seán Ó Laoire"
                className="size-36 rounded-full object-cover object-top shadow-md"
              />
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Seán Ó Laoire</strong> is an
                Irish-born priest, scientist, and mystic who has spent five decades
                at the frontier of consciousness, psychology, and non-dual
                spirituality. Holding advanced degrees in philosophy, mathematics,
                theology, and clinical psychology, he approaches the great mysteries
                with equal parts rigour and wonder.
              </p>
              <p>
                Author of <em>Souls on Safari</em> and numerous other works, Seán
                draws from the wellspring of the world&apos;s contemplative
                traditions — while remaining bound to none — to articulate a vision
                of human life as a cosmic adventure of awakening.
              </p>
              <p>
                As Spiritual Director of Warriors on the Way, Seán provides the
                philosophical foundation and the Lightworkers Manifesto that
                animates everything we do.
              </p>
            </div>
          </div>

          {/* Audio */}
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-heading font-semibold text-lg">
                Seán on the purpose of Warriors on the Way
              </p>
              <p className="text-sm text-muted-foreground">
                Recorded in Healdsburg, CA — hear Seán explain in his own words
                what this community is for and why it matters right now.
              </p>
            </div>
            <AudioPlayer
              src="/audio/sean-healdsburg.m4a"
              label="Audio message from the Spiritual Director"
            />
          </div>
        </div>
      </section>

      {/* ── How communities work ─────────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-3xl mx-auto w-full space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
            How it works
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Warriors on the Way organizes lightworkers into small, local circles
            where the mission becomes lived experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: "🔥",
              title: "Small by design",
              body: "Each community is capped at 150 people — the size at which genuine relationship and trust are still possible.",
            },
            {
              icon: "🌍",
              title: "Local and embodied",
              body: "Hikes, retreats, sound baths, shared meals — because transformation happens in person, not just online.",
            },
            {
              icon: "🤝",
              title: "Connected upward",
              body: "Every local community is part of the broader Warriors on the Way network, anchored by the Spiritual Director.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 space-y-3">
              <div className="text-3xl">{icon}</div>
              <h3 className="font-heading font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="border-t px-6 py-20 flex flex-col items-center text-center gap-6 bg-gradient-to-b from-[#c4704a]/5 to-transparent">
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
