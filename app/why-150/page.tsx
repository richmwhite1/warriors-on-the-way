import { BackButton } from "@/components/ui/back-button";

export const metadata = {
  title: "Why 150?",
  description: "Why communities here are capped at 150 members.",
};

export default function Why150Page() {
  return (
    <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.25rem 1.25rem 4rem" }}>
        <BackButton />
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 30, fontWeight: 800, color: "var(--foreground)", marginTop: 12 }}>
          Why 150?
        </h1>

        <div style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "#2a2a30", lineHeight: 1.65, marginTop: 16 }}>
          <p>
            Every community here is capped at 150 members. That number isn&apos;t arbitrary.
          </p>
          <p style={{ marginTop: 16 }}>
            The anthropologist Robin Dunbar found that roughly 150 is the ceiling on the number of
            stable, meaningful relationships a person can actually hold — the number of people you can
            know as people rather than as a crowd. Beyond it, names blur into faces, faces into
            strangers, and a group stops being a community and becomes an audience.
          </p>
          <p style={{ marginTop: 16 }}>
            Seán names the loss of intimate connection as a precursor to hierarchy and corruption.
            When a group grows past the point where everyone can know everyone, someone has to manage
            it — and management, over time, becomes control. Scale invites the very captured
            institutions this project exists to walk away from.
          </p>
          <p style={{ marginTop: 16 }}>
            So we cap at 150 on purpose. When a community fills, it doesn&apos;t expand — it seeds
            another. Growth comes from communities birthing communities, each one small enough that
            the people in it remain real to one another.
          </p>
          <p style={{ marginTop: 16, color: "var(--muted-foreground)" }}>
            A person can belong to several communities. The cap protects the intimacy of each one.
          </p>
        </div>
      </div>
    </main>
  );
}
