// The Seán band — grounded, topic-scoped Q&A over Fr. Seán Ó'Laoire's corpus.
// Runs server-side so the spirits project keys + Gemini key never reach the client
// and the RAG's origin CORS lock is irrelevant. This is Gemini (gemini-2.5-flash +
// gemini-embedding-2), NOT Claude — the corpus was embedded with Gemini at 768 dims.
//
// Requires env: SEAN_SUPABASE_URL, SEAN_SUPABASE_SERVICE_KEY, GEMINI_API_KEY.

import { createClient } from "@supabase/supabase-js";

const EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent";
const GEN_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SEAN_SYSTEM = `You are an AI built on Fr. Seán Ó'Laoire's body of work — his books, recorded teachings, and transcribed homilies. You speak in his voice and answer ONLY from the material provided below.

RULES:
1. Answer only from the passages provided. Do not draw on outside knowledge.
2. If the passages don't address the question, say so honestly.
3. Quote his actual words where possible.
4. End with the sources you drew from: [Source: Title, Date].
TONE: Warm, direct, intellectually serious, Irish cadence without parody.`;

function seanClient() {
  const url = process.env.SEAN_SUPABASE_URL;
  const key = process.env.SEAN_SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function embed(text: string): Promise<number[] | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const res = await fetch(`${EMBED_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text: text.slice(0, 8000) }] },
      outputDimensionality: 768,
    }),
  });
  const data = await res.json();
  if (data.error) return null;
  return data.embedding?.values ?? null;
}

type Chunk = {
  content: string;
  source_type: string;
  source_title: string;
  source_id: string | null;
  source_date: string | null;
  similarity: number;
};

export async function POST(req: Request) {
  const supabase = seanClient();
  if (!supabase) {
    return Response.json(
      { error: "The teaching archive is not configured yet." },
      { status: 503 }
    );
  }

  let body: { question?: string; topic?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const question = (body.question ?? "").trim().slice(0, 500);
  const topic = body.topic ?? null; // topic slug → per-topic corpus slice
  if (!question) {
    return Response.json({ error: "A question is required" }, { status: 400 });
  }

  const queryEmbedding = await embed(question);
  if (!queryEmbedding) {
    return Response.json({ error: "Could not process the question" }, { status: 502 });
  }

  const { data: raw, error } = await supabase.rpc("match_chunks_by_topic", {
    query_embedding: queryEmbedding,
    p_topic: topic,
    match_count: 12,
  });
  if (error) {
    return Response.json({ error: "Archive search failed" }, { status: 502 });
  }

  const chunks = ((raw as Chunk[]) ?? [])
    .filter((c) => c.similarity > 0.35)
    .slice(0, 8);

  if (chunks.length === 0) {
    return Response.json({
      answer:
        "I don't find that addressed clearly in this part of the archive yet. You might explore a related topic, or ask Seán directly.",
      sources: [],
      relatedVideos: [],
    });
  }

  const context = chunks
    .map(
      (c, i) =>
        `[Passage ${i + 1}]\nSource: ${c.source_title}${c.source_date ? ` (${c.source_date})` : ""}\nType: ${c.source_type}\n---\n${c.content}`
    )
    .join("\n\n");

  const key = process.env.GEMINI_API_KEY!;
  const genRes = await fetch(`${GEN_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SEAN_SYSTEM }] },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Here are the most relevant passages from Seán's archive:\n\n${context}\n\n---\n\nQuestion: ${question}`,
            },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 1200, temperature: 0 },
    }),
  });
  const genData = await genRes.json();
  const answer =
    genData?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Something went wrong reaching the archive. Please try again.";

  const sources = chunks
    .filter((c) => c.similarity > 0.3)
    .slice(0, 4)
    .map((c) => ({
      title: c.source_title,
      date: c.source_date,
      type: c.source_type,
      videoId: c.source_id,
      similarity: Math.round(c.similarity * 100),
    }));

  const relatedVideos: { id: string; title: string }[] = [];
  const seen = new Set<string>();
  for (const c of chunks) {
    if (c.source_type === "transcript" && c.source_id && c.similarity > 0.3 && !seen.has(c.source_id)) {
      seen.add(c.source_id);
      relatedVideos.push({ id: c.source_id, title: c.source_title });
      if (relatedVideos.length >= 3) break;
    }
  }

  return Response.json({ answer, sources, relatedVideos });
}
