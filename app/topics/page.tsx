import Link from "next/link";
import { getTopics } from "@/lib/queries/topics";
import { TopicIcon } from "@/components/topics/topic-icon";
import { AppNav } from "@/components/app-nav";

export const metadata = {
  title: "Topics — Warriors on the Way",
  // Store-facing/solution framing lives here, never the manifesto.
  description: "Nine domains to reclaim. Learn one, then find real people nearby already doing it.",
};

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    // Rendered without the nav until now, so this page was a room with no door: no way
    // back to the app except the browser button. It matters more now that guests can
    // reach it — the nav is how they find the circles and events this page is about.
    <>
      <AppNav />
      <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 28, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
          The Nine
        </h1>
        {/* "Choose a domain to reclaim" is three insider words in five. This page is
            where most people meet The Nine for the first time, so it says what they are
            before asking anyone to pick one. */}
        <p style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)", marginTop: 6, marginBottom: 24, lineHeight: 1.55 }}>
          Nine things this community is working to take back — in health, land, learning and
          six more. Every gathering carries one as a badge. Open any of them to read what it
          stands for, and to find groups already working on it.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {topics.map((t) => (
            <Link
              key={t.id}
              href={`/topics/${t.slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "18px 16px",
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: "#faf8f5",
                textDecoration: "none",
                color: "var(--foreground)",
                transition: "border-color .15s ease, transform .15s ease",
              }}
            >
              <TopicIcon icon={t.icon} />
              <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 16 }}>{t.name}</span>
              {t.solution_statement && (
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                  {t.solution_statement}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* The Nine read as an exhibit: nine beautiful cards and nothing to do with them.
            The doing happens in circles, so say so and point at them. */}
        <div style={{ marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted-foreground)", margin: 0 }}>
            These are the why. The doing happens in circles — small groups meeting in person
            around Salt Lake City and Park City.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            <Link
              href="/community"
              style={{
                fontFamily: "var(--font-brand)", fontSize: 14, fontWeight: 700,
                color: "#ffffff", background: "var(--primary)", borderRadius: 9999,
                padding: "10px 20px", textDecoration: "none",
              }}
            >
              Find a circle near you
            </Link>
            <Link
              href="/menu"
              style={{
                fontFamily: "var(--font-brand)", fontSize: 14, fontWeight: 700,
                color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: 9999,
                padding: "10px 20px", textDecoration: "none",
              }}
            >
              Start from what you need
            </Link>
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
