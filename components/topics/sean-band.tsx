"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

type Source = { title: string; date: string | null; type: string; videoId: string | null; similarity: number };
type Answer = { answer: string; sources: Source[]; relatedVideos: { id: string; title: string }[] };

// The Seán band — a persistent teaching band on every topic page. Grounded Q&A
// answered ONLY from this topic's slice of Fr. Seán Ó'Laoire's corpus, with
// citations back to source. Core to the product, not a widget.
export function SeanBand({ topicSlug, topicName }: { topicSlug: string; topicName: string }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/sean/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), topic: topicSlug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        marginTop: 8,
        borderRadius: 18,
        padding: "18px 18px 20px",
        background: "linear-gradient(160deg, #1a1610 0%, #2a2018 100%)",
        color: "#e8ddd0",
        border: "1px solid rgba(212,175,55,0.25)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Sparkles size={16} color="#D4AF37" />
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#D4AF37" }}>
          Ask Seán · {topicName}
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#b8a98f", margin: "0 0 12px", lineHeight: 1.4 }}>
        Fifty years of Fr. Seán Ó&apos;Laoire&apos;s teaching on {topicName.toLowerCase()}, answered from his own words.
      </p>

      <form onSubmit={ask} style={{ display: "flex", gap: 8 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Ask about ${topicName.toLowerCase()}…`}
          maxLength={500}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 999,
            border: "1px solid rgba(212,175,55,0.35)", background: "rgba(0,0,0,0.25)",
            color: "#f5ede4", fontFamily: "var(--font-body)", fontSize: 14, outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          style={{
            padding: "10px 18px", borderRadius: 999, border: 0, cursor: loading ? "default" : "pointer",
            background: "#D4AF37", color: "#1a1610", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14,
            opacity: loading || !question.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "…" : "Ask"}
        </button>
      </form>

      {error && <p style={{ color: "#e0a0a0", fontSize: 13, marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, lineHeight: 1.6, color: "#f0e6d8", whiteSpace: "pre-wrap" }}>
            {result.answer}
          </p>
          {result.sources.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid rgba(212,175,55,0.2)", paddingTop: 10 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a7c62", marginBottom: 6 }}>
                Sources
              </div>
              {result.sources.map((s, i) => (
                <div key={i} style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "#c9b998", marginBottom: 3 }}>
                  {s.videoId ? (
                    <a href={`https://youtube.com/watch?v=${s.videoId}`} target="_blank" rel="noopener noreferrer" style={{ color: "#D4AF37" }}>
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                  {s.date ? ` (${s.date})` : ""} · {s.similarity}% match
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
