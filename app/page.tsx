import Link from "next/link";
import { AudioPlayer } from "@/components/ui/audio-player";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getNextParentEvent } from "@/lib/queries/events";
import { getLatestParentPost } from "@/lib/queries/posts";

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
  { domain: "Medicine",      from: "Pharmaceutical disease management",           to: "People-centered healthcare" },
];

function formatEventDate(startsAt: string, timezone: string): string {
  try {
    const date = new Date(startsAt);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
      timeZoneName: "short",
    }).format(date);
  } catch {
    return new Date(startsAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
}

export default async function LandingPage() {
  const nextEvent = await getNextParentEvent();
  const latestPost = nextEvent ? null : await getLatestParentPost();

  return (
    <main style={{ background: "#ffffff", overflowX: "hidden" }}>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "1.2rem 3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.96)",
          borderBottom: "1px solid #ede9e1",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 12,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#1a1610",
            fontWeight: 700,
          }}
        >
          Warriors on the Way
        </span>
        <ul
          className="hidden sm:flex"
          style={{ gap: "2.5rem", listStyle: "none", margin: 0, padding: 0 }}
        >
          {[
            { href: "#mission", label: "The Mission" },
            { href: "#director", label: "Spiritual Director" },
            { href: "#path", label: "The Path" },
          ].map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#6b6456",
                  textDecoration: "none",
                }}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <Link
          href="/sign-in"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#ffffff",
            background: "#1a1610",
            padding: "0.6rem 1.5rem",
            textDecoration: "none",
            border: "1px solid #1a1610",
          }}
        >
          Join the Path
        </Link>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "9rem 2rem 7rem",
          position: "relative",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial bloom */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 600,
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(200,194,180,0.18) 0%, rgba(232,228,220,0.08) 40%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* SVG Orb */}
        <div style={{ width: 96, height: 96, margin: "0 auto 2.5rem", position: "relative", zIndex: 1 }}>
          <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" width="96" height="96">
            <circle cx="48" cy="48" r="46" stroke="#c8c2b4" strokeWidth="0.5" strokeDasharray="3 5"/>
            <circle cx="48" cy="48" r="34" stroke="#c8c2b4" strokeWidth="0.5"/>
            <circle cx="48" cy="48" r="22" stroke="#a07828" strokeWidth="0.5" opacity="0.4"/>
            <circle cx="48" cy="48" r="10" fill="rgba(160,120,40,0.08)" stroke="#a07828" strokeWidth="0.75" opacity="0.6"/>
            <circle cx="48" cy="48" r="4" fill="#a07828" opacity="0.5"/>
            <circle cx="48" cy="48" r="1.5" fill="#1a1610"/>
            <line x1="48" y1="2" x2="48" y2="12" stroke="#c8c2b4" strokeWidth="0.75" opacity="0.5"/>
            <line x1="48" y1="84" x2="48" y2="94" stroke="#c8c2b4" strokeWidth="0.75" opacity="0.5"/>
            <line x1="2" y1="48" x2="12" y2="48" stroke="#c8c2b4" strokeWidth="0.75" opacity="0.5"/>
            <line x1="84" y1="48" x2="94" y2="48" stroke="#c8c2b4" strokeWidth="0.75" opacity="0.5"/>
            <line x1="16" y1="16" x2="22" y2="22" stroke="#c8c2b4" strokeWidth="0.5" opacity="0.35"/>
            <line x1="74" y1="16" x2="68" y2="22" stroke="#c8c2b4" strokeWidth="0.5" opacity="0.35"/>
            <line x1="16" y1="80" x2="22" y2="74" stroke="#c8c2b4" strokeWidth="0.5" opacity="0.35"/>
            <line x1="80" y1="80" x2="74" y2="74" stroke="#c8c2b4" strokeWidth="0.5" opacity="0.35"/>
          </svg>
        </div>

        {/* Ornament line */}
        <div
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            color: "#c8c2b4",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span style={{ display: "block", width: 56, height: 1, background: "linear-gradient(to left, #c8c2b4, transparent)", opacity: 0.6 }} />
          Another name for lightworkers
          <span style={{ display: "block", width: 56, height: 1, background: "linear-gradient(to right, #c8c2b4, transparent)", opacity: 0.6 }} />
        </div>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "var(--font-brand)",
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: "0.05em",
            color: "#1a1610",
            textTransform: "uppercase",
            position: "relative",
            zIndex: 1,
            marginBottom: "0.5rem",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-brand)",
              fontSize: "clamp(0.9rem, 2vw, 1.5rem)",
              fontWeight: 400,
              letterSpacing: "0.45em",
              color: "#6b6456",
              marginBottom: "0.5rem",
            }}
          >
            Warriors on
          </span>
          <span style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}>The Way</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(1rem, 1.6vw, 1.15rem)",
            fontStyle: "italic",
            color: "#6b6456",
            maxWidth: 520,
            margin: "2rem auto 3rem",
            lineHeight: 1.75,
            position: "relative",
            zIndex: 1,
          }}
        >
          A gathering of lightbringers committed to reclaiming sovereignty from
          institutional control and supporting the evolution of consciousness.
          Walking the spiritual path together in small, intimate communities
          built for the long journey.
        </p>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1.25rem",
            flexWrap: "wrap",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Link
            href="/sign-in"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#ffffff",
              background: "#1a1610",
              padding: "1rem 2.5rem",
              textDecoration: "none",
              border: "1px solid #1a1610",
            }}
          >
            Join the Path
          </Link>
          <a
            href="#mission"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#4a4438",
              background: "transparent",
              padding: "1rem 2.5rem",
              textDecoration: "none",
              border: "1px solid #c8c2b4",
            }}
          >
            Read the Manifesto
          </a>
        </div>
      </section>

      <OrnamentalDivider />

      {/* ── Next Event / Latest Post (if any) ──────────────────────────────── */}
      {(nextEvent || latestPost) && (
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 2rem 3rem" }}>
          {nextEvent ? (
            <div
              style={{
                border: "1px solid #ede9e1",
                borderTop: "2px solid #a07828",
                padding: "1.5rem",
                background: "#ffffff",
              }}
            >
              <SectionLabel>Next Live Session</SectionLabel>
              <p
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#1a1610",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.25rem",
                }}
              >
                {nextEvent.title}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#c8c2b4", marginBottom: "0.75rem" }}>
                {formatEventDate(nextEvent.starts_at!, nextEvent.timezone)}
                {nextEvent.location && ` · ${nextEvent.location}`}
              </p>
              {nextEvent.description && (
                <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "#6b6456", fontSize: "1rem", marginBottom: "1rem" }}>
                  {nextEvent.description}
                </p>
              )}
              <Link
                href={`/community/${nextEvent.community_slug}/events/${nextEvent.id}`}
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#a07828",
                  textDecoration: "none",
                }}
              >
                Register →
              </Link>
            </div>
          ) : latestPost ? (
            <div
              style={{
                border: "1px solid #ede9e1",
                borderTop: "2px solid #a07828",
                padding: "1.5rem",
                background: "#ffffff",
              }}
            >
              <SectionLabel>Latest Transmission</SectionLabel>
              {latestPost.title && (
                <p
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#1a1610",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: "0.25rem",
                  }}
                >
                  {latestPost.title}
                </p>
              )}
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#c8c2b4", marginBottom: "0.75rem" }}>
                {latestPost.author.display_name} ·{" "}
                {new Date(latestPost.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {latestPost.body && (
                <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "#6b6456", marginBottom: "1rem" }}>
                  {latestPost.body.slice(0, 200)}{latestPost.body.length > 200 ? "…" : ""}
                </p>
              )}
              <Link
                href="/sign-in"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#a07828",
                  textDecoration: "none",
                }}
              >
                Join to read →
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Spiritual Director ──────────────────────────────────────────────── */}
      <div id="director" style={{ maxWidth: 880, margin: "0 auto", padding: "2rem 2rem 5rem" }}>
        <div
          className="director-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Portrait */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: -7,
                border: "1px solid #ede9e1",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: -14,
                border: "1px solid rgba(200,194,180,0.4)",
                pointerEvents: "none",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sean-olaoire.webp"
              alt="Seán Ó Laoire"
              style={{
                width: "100%",
                display: "block",
                filter: "grayscale(20%) contrast(1.05) brightness(0.97)",
              }}
            />
          </div>

          {/* Content */}
          <div>
            <SectionLabel>Spiritual Director</SectionLabel>
            <h2
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                fontWeight: 900,
                color: "#1a1610",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "0.3rem",
                lineHeight: 1.1,
              }}
            >
              Seán<br />Ó Laoire
            </h2>
            <span
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: 9,
                letterSpacing: "0.26em",
                textTransform: "uppercase",
                color: "#a07828",
                display: "block",
                marginBottom: "1.25rem",
                fontWeight: 600,
              }}
            >
              Priest · Scientist · Mystic
            </span>
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "#6b6456",
                fontSize: "1rem",
                lineHeight: 1.85,
                fontStyle: "italic",
                marginBottom: "1.5rem",
              }}
            >
              Irish-born priest, scientist, and mystic — holding advanced degrees in
              philosophy, mathematics, theology, and clinical psychology. Author of{" "}
              <em style={{ fontStyle: "normal", color: "#4a4438" }}>Souls on Safari</em>.
              As Spiritual Director, Seán provides the philosophical foundation and the
              Lightworkers Manifesto that animates everything we do.
            </p>
            <AudioPlayer
              src="/audio/sean-healdsburg.m4a"
              label="Seán on the purpose of Warriors on the Way"
            />
            <div style={{ marginTop: "1rem" }}>
              <Link
                href="/sean"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#4a4438",
                  background: "transparent",
                  padding: "0.7rem 1.6rem",
                  textDecoration: "none",
                  border: "1px solid #c8c2b4",
                  display: "inline-block",
                }}
              >
                Explore Seán&apos;s Portal
              </Link>
            </div>
          </div>
        </div>
      </div>

      <OrnamentalDivider />

      {/* ── Manifesto (DARK BAND) ───────────────────────────────────────────── */}
      <div id="mission" style={{ background: "#1a1610", padding: "5rem 0" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 2rem" }}>
          <SectionLabel>The Lightworkers Manifesto</SectionLabel>
          <SectionTitle light>
            A battle for the<br />soul of the planet
          </SectionTitle>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "rgba(255,255,255,0.45)",
              fontStyle: "italic",
              fontSize: "1.05rem",
              maxWidth: 560,
              marginBottom: "0.5rem",
            }}
          >
            God is sending in the warriors and lightbringers whose mission is to reclaim what has been captured:
          </p>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "1.5rem" }}>
            {MISSION_POINTS.map((point) => (
              <li
                key={point}
                style={{
                  padding: "0.7rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "1rem",
                  fontFamily: "var(--font-body)",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "1rem",
                }}
              >
                <span
                  style={{
                    color: "#c4a050",
                    fontSize: "0.55rem",
                    flexShrink: 0,
                    opacity: 0.8,
                    position: "relative",
                    top: -2,
                  }}
                >
                  ✦
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── The Great Turning (PAPER BAND) ─────────────────────────────────── */}
      <div style={{ background: "#f8f7f4", padding: "5rem 0" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 2rem" }}>
          <SectionLabel>The Great Turning</SectionLabel>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "#6b6456",
              fontStyle: "italic",
              fontSize: "1rem",
              maxWidth: 560,
              marginBottom: "1rem",
            }}
          >
            From <em style={{ fontStyle: "normal", color: "#4a4438" }}>Homo sapiens sapiens</em> to{" "}
            <em style={{ fontStyle: "normal", color: "#4a4438" }}>Homo spiritualis</em>:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 1,
              background: "#ede9e1",
              border: "1px solid #ede9e1",
              marginTop: "2rem",
            }}
          >
            {SHIFTS.map(({ domain, from, to }) => (
              <div
                key={domain}
                style={{
                  background: "#ffffff",
                  padding: "1.5rem 1.4rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: 9,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "#a07828",
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  {domain}
                </span>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    color: "#6b6456",
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ color: "#4a4438", fontWeight: 500 }}>{from}</strong>
                  {" → "}
                  {to}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── The Structure (DARK BAND) ──────────────────────────────────────── */}
      <div id="path" style={{ background: "#1a1610", padding: "5rem 0" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 2rem" }}>
          <SectionLabel>The Structure</SectionLabel>
          <SectionTitle light>
            How the path<br />is walked
          </SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
              marginTop: "2.5rem",
            }}
            className="sm:grid-cols-3 grid-cols-1"
          >
            {[
              {
                numeral: "I",
                title: "Small by design",
                body: "Each community is capped at 150 — the size at which genuine relationship and trust are still possible.",
              },
              {
                numeral: "II",
                title: "Local and embodied",
                body: "Hikes, retreats, sound baths, shared meals — transformation happens in person, not just online.",
              },
              {
                numeral: "III",
                title: "Connected upward",
                body: "Every local community is part of the broader network, anchored by the Spiritual Director.",
              },
            ].map(({ numeral, title, body }) => (
              <div
                key={numeral}
                style={{
                  padding: "2rem 1.5rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderTop: "2px solid rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "2.2rem",
                    color: "rgba(255,255,255,0.08)",
                    fontWeight: 900,
                    lineHeight: 1,
                    marginBottom: "1rem",
                  }}
                >
                  {numeral}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: "0.8rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.9)",
                    marginBottom: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {title}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.7,
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          padding: "7rem 2rem",
          maxWidth: 680,
          margin: "0 auto",
        }}
      >
        {/* Eyebrow with flanking lines */}
        <div
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: "#a07828",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <span style={{ display: "block", width: 40, height: 1, background: "#a07828", opacity: 0.35 }} />
          The call
          <span style={{ display: "block", width: 40, height: 1, background: "#a07828", opacity: 0.35 }} />
        </div>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(1.2rem, 2.5vw, 1.65rem)",
            fontStyle: "italic",
            color: "#4a4438",
            lineHeight: 1.6,
            marginBottom: "2.75rem",
          }}
        >
          &ldquo;If you feel the call to reclaim what has been captured — and to walk that
          path in community with others —{" "}
          <em style={{ fontStyle: "normal", color: "#1a1610", fontWeight: 500 }}>
            this is your home.
          </em>
          &rdquo;
        </p>
        <Link
          href="/sign-in"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#ffffff",
            background: "#1a1610",
            padding: "1rem 2.5rem",
            textDecoration: "none",
            border: "1px solid #1a1610",
          }}
        >
          Answer the Call
        </Link>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: "#ede9e1", maxWidth: 880, margin: "0 auto" }} />
      <footer
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "2rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#c8c2b4",
            fontWeight: 600,
          }}
        >
          Warriors on the Way
        </span>
        <ul style={{ display: "flex", gap: "2rem", listStyle: "none", margin: 0, padding: 0 }}>
          {[
            { href: "/community", label: "Communities" },
            { href: "/terms", label: "Terms" },
            { href: "/privacy", label: "Privacy" },
            { href: "/resources", label: "Resources" },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#c8c2b4",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </footer>

    </main>
  );
}
