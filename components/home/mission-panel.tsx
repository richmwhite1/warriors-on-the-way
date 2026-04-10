"use client";

import { useState } from "react";
import Link from "next/link";

const SHIFTS = [
  { from: "Indoctrination", to: "Exploration", domain: "Education" },
  { from: "Sensual arousal", to: "Mystical stimulation", domain: "Entertainment" },
  { from: "Dominion by the elite", to: "Distribution to all", domain: "Economics" },
  { from: "Dogmatic sectarianism", to: "Unity identity", domain: "Religion" },
  { from: "Party-affiliated blindness", to: "Issue-identified solutions", domain: "Politics" },
  { from: "Gaia-destructive profiteering", to: "Gaia-enhancing gratitude", domain: "Agriculture" },
  { from: "Disease management", to: "People-centered healthcare", domain: "Medicine" },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function MissionPanel() {
  const [missionOpen, setMissionOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  return (
    <section className="rounded-2xl border-2 border-primary/25 bg-primary/5 overflow-hidden">

      {/* Header row with Sean */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-primary/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sean-olaoire.webp"
          alt="Seán Ó Laoire"
          className="size-10 rounded-full object-cover object-top shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Why we&apos;re here
          </p>
          <p className="text-sm font-medium leading-snug">
            The Lightworkers Manifesto — Seán Ó Laoire
          </p>
        </div>
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          Read more →
        </Link>
      </div>

      {/* Community purpose blurb */}
      <div className="px-5 py-4 border-b border-primary/15">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Communities exist to{" "}
          <span className="text-foreground font-medium">challenge and support one another.</span>{" "}
          We raise collective consciousness by improving our own state of being in the world.
          WoW gives you the tools to make that easier —{" "}
          <span className="text-foreground">create a community, invite others to spiritual
          gatherings, spark questions and discussions, and share music or video</span>{" "}
          in the right context.
        </p>
      </div>

      {/* Part 1 — The Mission (collapsible) */}
      <div className="border-b border-primary/15">
        <button
          onClick={() => setMissionOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-primary/5 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Part one
            </p>
            <p className="text-sm font-medium text-foreground">The Mission</p>
          </div>
          <ChevronIcon open={missionOpen} />
        </button>

        {missionOpen && (
          <div className="px-5 pb-4">
            <p className="text-sm leading-relaxed text-foreground">
              We are in a battle for the soul of the planet. God is sending in the warriors
              and lightbringers to reclaim{" "}
              <span className="font-medium">education, economics, healing, storytelling,
              entertainment, food, fire, democracy, and spirituality</span>{" "}
              from those who have captured them.
            </p>
          </div>
        )}
      </div>

      {/* Part 2 — The How (collapsible) */}
      <div>
        <button
          onClick={() => setHowOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-primary/5 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Part two
            </p>
            <p className="text-sm font-medium text-foreground">The How</p>
          </div>
          <ChevronIcon open={howOpen} />
        </button>

        {howOpen && (
          <div className="px-5 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SHIFTS.map(({ domain, to }) => (
                <div key={domain} className="rounded-xl bg-background border px-3 py-2 space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{domain}</p>
                  <p className="text-xs text-foreground leading-snug">→ {to}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </section>
  );
}
