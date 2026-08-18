import Link from "next/link";
import { getTopics } from "@/lib/queries/topics";
import { TopicIcon } from "@/components/topics/topic-icon";

export const metadata = {
  title: "Topics — Warriors on the Way",
  // Store-facing/solution framing lives here, never the manifesto.
  description: "Nine domains to reclaim. Learn one, then find real people nearby already doing it.",
};

export default async function TopicsPage() {
  const topics = await getTopics();

  return (
    <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 28, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
          The Nine
        </h1>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)", marginTop: 6, marginBottom: 24 }}>
          Choose a domain to reclaim.
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
      </div>
    </main>
  );
}
