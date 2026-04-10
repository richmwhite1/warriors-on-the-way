"use client";

import { useState } from "react";
import Link from "next/link";

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
  { domain: "Education",     from: "Indoctrination",                    to: "Exploration" },
  { domain: "Entertainment", from: "Sensual arousal",                   to: "Mystical stimulation" },
  { domain: "Economics",     from: "Dominion by the elite",             to: "Distribution to all" },
  { domain: "Religion",      from: "Dogmatic sectarianism",             to: "Unity identity" },
  { domain: "Politics",      from: "Party-affiliated blindness",        to: "Issue-identified solutions" },
  { domain: "Agriculture",   from: "Gaia-destructive profiteering",     to: "Gaia-enhancing gratitude" },
  { domain: "Medicine",      from: "Pharmaceutically controlled disease management", to: "People-centered, hands-on healthcare" },
];

function Row({
  label,
  open,
  onToggle,
  children,
  last,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "border-b border-border/60"}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-0 py-3.5 text-left group"
      >
        <span className="text-sm font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors">
          {label}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function MissionPanel() {
  const [missionOpen, setMissionOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sean-olaoire.webp"
          alt="Seán Ó Laoire"
          className="size-8 rounded-full object-cover object-top shrink-0 opacity-90"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-none mb-0.5">
            Seán Ó Laoire · Lightworkers Manifesto
          </p>
        </div>
        <Link
          href="/"
          className="text-xs text-primary hover:underline shrink-0"
        >
          Full text →
        </Link>
      </div>

      {/* Accordion rows */}
      <div className="border-t border-border/60">
        <Row label="The Mission" open={missionOpen} onToggle={() => setMissionOpen(v => !v)}>
          <ul className="space-y-2">
            {MISSION_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="mt-[3px] size-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-sm text-foreground leading-snug font-medium">{point}</span>
              </li>
            ))}
          </ul>
        </Row>

        <Row label="The Why" open={whyOpen} onToggle={() => setWhyOpen(v => !v)}>
          <div className="space-y-2.5">
            {SHIFTS.map(({ domain, from, to }) => (
              <div key={domain} className="flex items-start gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary w-20 shrink-0 pt-0.5">
                  {domain}
                </span>
                <div className="text-sm leading-snug">
                  <span className="text-muted-foreground line-through opacity-60">{from}</span>
                  <span className="text-muted-foreground mx-1.5">→</span>
                  <span className="font-semibold text-foreground">{to}</span>
                </div>
              </div>
            ))}
          </div>
        </Row>

        <Row label="The How" open={howOpen} onToggle={() => setHowOpen(v => !v)} last>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Communities challenge and support one another to raise collective consciousness.
            Create a community · invite members to gatherings · post discussions · share music &amp; video.
          </p>
        </Row>
      </div>
    </section>
  );
}
