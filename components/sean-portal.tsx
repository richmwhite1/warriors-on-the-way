"use client";

import { useState, useEffect } from "react";
import { Play, Pause, ChevronRight, Clock } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type Chronicle = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
};

// ── Mock data — replace with real CMS/DB data ──────────────────────────────
// For the video, set youtubeId to a real YouTube video ID, or set videoSrc to
// a direct MP4/WebM URL. If both are null, the placeholder renders.
const TRANSMISSION = {
  title: "The Mirror and the Veil",
  subtitle: "On the nature of projection and the return to source",
  period: "April 2026",
  duration: "42 min",
  youtubeId: null as string | null,    // e.g. "dQw4w9WgXcQ"
  videoSrc: null as string | null,     // e.g. "/videos/mirror-veil.mp4"
};

// Next session date — update to real date/time
const NEXT_SESSION = new Date("2026-05-01T19:00:00");

const CHRONICLES: Chronicle[] = [
  {
    id: "1",
    title: "The Nature of Consciousness",
    excerpt:
      "In the stillness between thoughts, we find the nature of what we truly are — not the dreamer, but the dream itself awakening into its own light.",
    date: "April 12, 2026",
    readTime: "8 min",
  },
  {
    id: "2",
    title: "Sovereignty and the Sacred",
    excerpt:
      "To reclaim sovereignty is not an act of rebellion but of remembrance — a return to the self that was never colonized by any empire.",
    date: "April 8, 2026",
    readTime: "5 min",
  },
  {
    id: "3",
    title: "The Warrior's Path",
    excerpt:
      "Every lightworker is a warrior — not of violence, but of vision. We fight for what the world could become, not what it has been told it must remain.",
    date: "March 30, 2026",
    readTime: "6 min",
  },
  {
    id: "4",
    title: "Devotional Non-Duality",
    excerpt:
      "The paradox at the heart of the path: to know there is no separation, and yet to love as if everything depends on it.",
    date: "March 22, 2026",
    readTime: "10 min",
  },
  {
    id: "5",
    title: "Mission of the Lightbringer",
    excerpt:
      "We are not here to escape the world. We are here to transfigure it — soul by soul, community by community, one luminous act at a time.",
    date: "March 15, 2026",
    readTime: "7 min",
  },
  {
    id: "6",
    title: "The Homo Spiritualis",
    excerpt:
      "As we evolve past Homo sapiens sapiens, we must resist Homo artificialis — and choose instead the path of the sacred human.",
    date: "March 5, 2026",
    readTime: "9 min",
  },
];

// ── Countdown hook ─────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, target.getTime() - Date.now());
      setT({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return t;
}

// ── Gold constant ──────────────────────────────────────────────────────────
const GOLD = "#D4AF37";

// ── Component ──────────────────────────────────────────────────────────────
export function SeanPortal() {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const { days, hours, minutes, seconds } = useCountdown(NEXT_SESSION);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #080604 0%, #0d0a08 40%, #090706 100%)",
        color: "#e8ddd0",
        fontFamily: "var(--font-sans)",
      }}
    >

      {/* ══════════════════════════════════════════════════════════ HERO ══ */}
      <section className="relative overflow-hidden">
        {/* Ambient glow behind portrait */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${GOLD}18 0%, transparent 65%)`,
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 flex flex-col lg:flex-row gap-12 items-center lg:items-end">

          {/* Portrait */}
          <div className="relative shrink-0">
            {/* Outer pulse ring */}
            <div
              className="absolute inset-[-8px] rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${GOLD}00, ${GOLD}30, ${GOLD}00, ${GOLD}15, ${GOLD}00)`,
              }}
            />
            {/* Gold rim */}
            <div
              className="relative size-48 lg:size-60 rounded-full overflow-hidden"
              style={{
                boxShadow: `0 0 0 1.5px ${GOLD}50, 0 0 80px ${GOLD}18, 0 8px 60px rgba(0,0,0,0.8)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sean-olaoire.webp"
                alt="Seán Ó'Laoire"
                className="w-full h-full object-cover object-top"
                style={{ filter: "contrast(1.08) brightness(0.9) saturate(0.85)" }}
              />
              {/* Inner vignette */}
              <div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.55)" }}
              />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-5 text-center lg:text-left">
            <div className="space-y-1">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.35em]"
                style={{ color: GOLD }}
              >
                Spiritual Director · Warriors on the Way
              </p>
              <h1
                className="text-5xl lg:text-[5.5rem] font-bold leading-[0.9] tracking-tight"
                style={{
                  fontFamily: "var(--font-display, var(--font-heading))",
                  textShadow: "0 2px 40px rgba(0,0,0,0.8)",
                }}
              >
                Seán<br />
                <span style={{ color: "#c8b88a" }}>Ó'Laoire</span>
              </h1>
            </div>

            <p className="text-stone-400 max-w-sm leading-relaxed text-sm">
              Irish-born priest, scientist, and mystic. Holding advanced degrees in
              philosophy, mathematics, theology, and clinical psychology. Author of{" "}
              <em className="text-stone-300">Souls on Safari</em>. Providing the
              philosophical foundation and the Lightworkers Manifesto for Warriors on the Way.
            </p>

            {/* Divider accent */}
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div
                className="h-px w-12"
                style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }}
              />
              <span className="text-[10px] uppercase tracking-[0.3em] text-stone-600">
                Devotional Non-Duality
              </span>
              <div
                className="h-px w-12"
                style={{ background: `linear-gradient(to left, ${GOLD}, transparent)` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ CURRENT TRANSMISSION ══ */}
      <section className="max-w-5xl mx-auto px-6 py-10 space-y-5">
        <SectionLabel>Current Transmission</SectionLabel>

        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: "#0f0b09",
            boxShadow: "0 8px 80px rgba(0,0,0,0.7)",
            border: `1px solid ${GOLD}14`,
          }}
        >
          {TRANSMISSION.youtubeId ? (
            /* ── YouTube embed ── */
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${TRANSMISSION.youtubeId}?rel=0&modestbranding=1`}
                title={TRANSMISSION.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : TRANSMISSION.videoSrc ? (
            /* ── Direct video ── */
            <div className="aspect-video relative group">
              <video
                src={TRANSMISSION.videoSrc}
                className="w-full h-full object-cover"
                onClick={(e) => {
                  const v = e.currentTarget;
                  if (v.paused) { v.play(); setVideoPlaying(true); }
                  else { v.pause(); setVideoPlaying(false); }
                }}
              />
              {!videoPlaying && (
                <button
                  className="absolute inset-0 flex items-center justify-center"
                  onClick={() => {}}
                >
                  <div
                    className="size-16 rounded-full border flex items-center justify-center"
                    style={{ borderColor: `${GOLD}60`, background: `${GOLD}14` }}
                  >
                    <Play size={22} fill={GOLD} style={{ color: GOLD, marginLeft: 3 }} />
                  </div>
                </button>
              )}
            </div>
          ) : (
            /* ── Placeholder ── */
            <div className="aspect-video flex flex-col items-center justify-center gap-5 relative">
              {/* Film-grain texture */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
                  backgroundSize: "256px 256px",
                }}
              />

              {/* Placeholder play button */}
              <div
                className="size-20 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                style={{ borderColor: `${GOLD}50`, background: `${GOLD}10` }}
              >
                <Play size={28} fill={GOLD} style={{ color: GOLD, marginLeft: 4 }} />
              </div>

              <div className="text-center space-y-1 z-10">
                <p
                  className="font-semibold text-xl"
                  style={{ fontFamily: "var(--font-display, var(--font-heading))" }}
                >
                  {TRANSMISSION.title}
                </p>
                <p className="text-sm text-stone-500">{TRANSMISSION.subtitle}</p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="text-xs text-stone-600">{TRANSMISSION.period}</span>
                  <span className="text-stone-700">·</span>
                  <Clock size={10} className="text-stone-600" />
                  <span className="text-xs text-stone-600">{TRANSMISSION.duration}</span>
                </div>
              </div>

              {/* Replace-video notice */}
              <p className="absolute bottom-3 right-4 text-[10px] text-stone-700 tracking-wide">
                Set <code className="text-stone-600">youtubeId</code> or{" "}
                <code className="text-stone-600">videoSrc</code> in{" "}
                <code className="text-stone-600">components/sean-portal.tsx</code>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ CHRONICLES ══ */}
      <section className="max-w-5xl mx-auto px-6 py-10 space-y-5">
        <SectionLabel>Chronicles</SectionLabel>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
          {CHRONICLES.map((c) => (
            <div
              key={c.id}
              className="break-inside-avoid mb-4 group cursor-pointer rounded-xl p-5 space-y-3 transition-all hover:-translate-y-0.5"
              style={{
                background: "#0f0b09",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 2px 30px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3
                  className="font-semibold text-sm leading-snug transition-colors group-hover:text-[#D4AF37]"
                  style={{ fontFamily: "var(--font-display, var(--font-heading))" }}
                >
                  {c.title}
                </h3>
                <ChevronRight
                  size={12}
                  className="shrink-0 mt-0.5 text-stone-700 transition-colors group-hover:text-[#D4AF37]"
                />
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">{c.excerpt}</p>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] uppercase tracking-widest text-stone-700">
                  {c.date}
                </span>
                <span className="text-stone-800">·</span>
                <span className="text-[10px] uppercase tracking-widest text-stone-700">
                  {c.readTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ THRESHOLD ══ */}
      <section className="max-w-5xl mx-auto px-6 py-10 pb-28 space-y-5">
        <SectionLabel>The Threshold</SectionLabel>

        <div
          className="relative rounded-2xl overflow-hidden p-8 lg:p-12"
          style={{
            background: "linear-gradient(145deg, #100d09 0%, #1a1208 100%)",
            border: `1px solid ${GOLD}20`,
            boxShadow: `inset 0 1px 0 ${GOLD}12, 0 8px 60px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Top-right glow */}
          <div
            className="absolute -top-16 -right-16 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${GOLD}10 0%, transparent 65%)` }}
          />
          {/* Bottom-left shadow */}
          <div
            className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(0,0,0,0.4) 0%, transparent 70%)" }}
          />

          <div className="relative flex flex-col lg:flex-row gap-10 items-center lg:items-start">

            {/* Description */}
            <div className="space-y-4 flex-1">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.35em] mb-2"
                  style={{ color: GOLD }}
                >
                  Live Q&amp;A · Intimate Gathering
                </p>
                <h2
                  className="text-3xl lg:text-4xl font-bold leading-[1.1]"
                  style={{ fontFamily: "var(--font-display, var(--font-heading))" }}
                >
                  A Threshold<br />
                  <span className="text-stone-400">Conversation</span>
                </h2>
              </div>
              <p className="text-sm text-stone-500 leading-relaxed max-w-sm">
                An intimate live gathering where Seán answers questions from Warriors
                directly — no intermediary, no institutional filter. Just the
                transmission, in real time.
              </p>
              <div
                className="flex items-center gap-2 text-xs text-stone-600"
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: GOLD }}
                />
                May 1, 2026 &nbsp;·&nbsp; 7:00 PM
              </div>
            </div>

            {/* Countdown + CTA */}
            <div className="space-y-7 text-center lg:text-right">
              {/* Timer */}
              <div className="flex items-end gap-1 justify-center lg:justify-end">
                {[
                  { value: days, label: "Days" },
                  { value: hours, label: "Hrs" },
                  { value: minutes, label: "Min" },
                  { value: seconds, label: "Sec" },
                ].map(({ value, label }, i) => (
                  <div key={label} className="flex items-end gap-1">
                    {i > 0 && (
                      <span className="text-2xl text-stone-700 mb-3 mx-0.5 font-light">:</span>
                    )}
                    <div className="space-y-1">
                      <div
                        className="text-4xl sm:text-5xl font-mono font-bold tabular-nums leading-none"
                        style={{ color: GOLD }}
                      >
                        {String(value).padStart(2, "0")}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-stone-600">
                        {label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                className="px-8 py-3 rounded-full text-sm font-semibold tracking-wide transition-all hover:brightness-110 hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, #b8932e 100%)`,
                  color: "#0f0b09",
                  boxShadow: `0 4px 24px ${GOLD}28`,
                }}
              >
                Reserve a place
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Section label helper ───────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.3em] shrink-0"
        style={{ color: GOLD }}
      >
        {children}
      </span>
      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}
