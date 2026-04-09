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
      <section className="flex flex-col items-center text-center px-6 py-20 sm:py-28 gap-8 bg-gradient-to-b from-[#c4704a]/8 to-transparent">
        <div className="space-y-5 max-w-2xl">
          <p className="text-xs font-medium text-primary uppercase tracking-widest">
            A devotional community
          </p>
          <h1 className="text-5xl sm:text-6xl font-heading font-semibold leading-tight">
            The path is walked<br className="hidden sm:block" /> together.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Warriors on the Way brings seekers into small, intimate communities
            where spiritual friendship deepens through shared experience —
            hikes, retreats, sound baths, dinners, and the ordinary moments in between.
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
            Our mission ↓
          </a>
        </div>
      </section>

      {/* ── What this is ────────────────────────────────────────────────────── */}
      <section id="mission" className="px-6 py-20 max-w-3xl mx-auto w-full space-y-14">

        <div className="space-y-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
            What we&apos;re building — and why
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Modern spiritual life is fragmented. We follow teachers online, attend
            workshops alone, and rarely encounter others walking the same interior road.
            Warriors on the Way exists to change that.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: "🔥",
              title: "Small by design",
              body: "Each community is capped at 150 people — the size at which genuine relationship is still possible. Within that, smaller circles of 10–15 gather regularly in person.",
            },
            {
              icon: "🧭",
              title: "Non-dual at the center",
              body: "We hold no single tradition as final. The understanding that Awareness itself is the ground of all being — that Self and Other are not ultimately separate — is our shared north star.",
            },
            {
              icon: "🤝",
              title: "Devotion in practice",
              body: "Philosophy without practice is incomplete. We gather for hikes, retreats, sound baths, shared meals, and contemplative events — because the path is embodied and communal.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 space-y-3">
              <div className="text-3xl">{icon}</div>
              <h3 className="font-heading font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 sm:p-8 space-y-4">
          <h3 className="font-heading font-semibold text-xl">How communities work</h3>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {[
              "A Warriors on the Way community is created by an organizer — someone who feels called to host and hold a local circle of seekers.",
              "Members join the community wall, share reflections, post resources, and coordinate gatherings. Everything lives in one place — not scattered across group chats.",
              "Events (hikes, retreats, dinners, meditations) are proposed, voted on, and confirmed inside the app. Guests can be invited to individual events without needing an account.",
              "The parent community — Warriors on the Way itself — provides guidance, broadcasts from the Spiritual Director, and holds the wider network together.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="shrink-0 mt-0.5 size-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Spiritual Director ───────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30 px-6 py-20">
        <div className="max-w-3xl mx-auto space-y-10">

          <div className="text-center space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-widest">
              Spiritual Director
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
              Seán Ó Laoire
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Avatar placeholder */}
            <div className="shrink-0 mx-auto sm:mx-0">
              <div className="size-28 rounded-full bg-primary/20 flex items-center justify-center text-5xl select-none">
                🌀
              </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Seán Ó Laoire</strong> is an Irish-born
                priest, scientist, and mystic who has spent five decades at the frontier of
                consciousness, psychology, and non-dual spirituality. Holding advanced degrees
                in philosophy, mathematics, theology, and clinical psychology, he approaches
                the great mysteries with equal parts rigour and wonder.
              </p>
              <p>
                Author of <em>Souls on Safari</em> and numerous other works, Seán draws from
                the wellspring of the world&apos;s contemplative traditions — while remaining
                bound to none — to articulate a vision of human life as a cosmic adventure
                of awakening. His teaching holds that we are, at root, boundless Awareness
                temporarily inhabiting form, and that genuine community is one of the most
                powerful arenas in which that recognition can ripen.
              </p>
              <p>
                As Spiritual Director of Warriors on the Way, Seán provides the philosophical
                foundation, inspires the community&apos;s mission, and remains a living
                example of the devotional non-dual path.
              </p>
            </div>
          </div>

          {/* Audio message */}
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-heading font-semibold text-lg">
                Seán on the purpose of Warriors on the Way
              </p>
              <p className="text-sm text-muted-foreground">
                Recorded in Healdsburg, CA — listen to Seán explain what this
                community is for and why it matters.
              </p>
            </div>
            <AudioPlayer
              src="/audio/sean-healdsburg.m4a"
              label="Audio message from the Spiritual Director"
            />
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 flex flex-col items-center text-center gap-6">
        <div className="space-y-3 max-w-lg">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold">
            Ready to find your circle?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Join an existing community near you, or start one. The path is here —
            it&apos;s just waiting for people who are ready to walk it together.
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
