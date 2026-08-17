#!/usr/bin/env node
// Topic-tagging backfill for the Warriors "Seán band".
// ⚠ TARGETS THE EXTERNAL SEÁN CORPUS DATABASE (spiritsinspacesuits.com's Supabase),
// not the Warriors DB. First apply db/sean-corpus/topic_tagging.sql to that corpus DB,
// then run this to classify each source into one or more of the nine mission topics
// and write the tags onto every chunk of that source (sean_chunks.topics).
//
// Usage (run from anywhere with the env below):
//   node scripts/tag_topics.mjs            # tag all untagged sources
//   node scripts/tag_topics.mjs --retag    # re-tag everything
//   node scripts/tag_topics.mjs --limit=20 # only the first N sources
//
// Runs LOCALLY. Requires, in .env.local, the CORPUS project's creds:
//   SUPABASE_URL / SUPABASE_SERVICE_KEY  → the Seán corpus Supabase (NOT Warriors)
//   GEMINI_API_KEY

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.local') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.slice(2).split('=');
    return [k, v ?? true];
  })
);

const TOPICS = [
  'education', 'economics', 'healing', 'storytelling', 'entertainment',
  'food', 'fire', 'democracy', 'spirituality',
];

const GEN_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM = `You classify passages from Fr. Seán Ó'Laoire's teaching into mission topics.
The nine topics are:
- education: learning, schooling, teaching children, exploration vs indoctrination
- economics: money, banking, wealth distribution, abundance
- healing: health, medicine, the body, wholeness, Big Pharma alternatives
- storytelling: narrative, myth, media, meaning-making
- entertainment: art, music, film, mystical vs sensual stimulation
- food: agriculture, growing, eating, the land, Gaia
- fire: energy, power, technology, conflict, the military-industrial complex
- democracy: governance, politics, community self-rule, freedom
- spirituality: God, consciousness, prayer, mysticism, non-duality, the sacred
Return ONLY a JSON array of the matching topic slugs (1-3 most relevant). Example: ["spirituality","healing"]. If none clearly fit, return ["spirituality"].`;

async function classify(title, sample) {
  const res = await fetch(`${GEN_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: `Title: ${title}\n\nExcerpt:\n${sample.slice(0, 3000)}` }] }],
      generationConfig: { maxOutputTokens: 60, temperature: 0 },
    }),
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
  try {
    const arr = JSON.parse(text.match(/\[.*\]/s)?.[0] ?? '[]');
    const valid = arr.filter(t => TOPICS.includes(t));
    return valid.length ? valid : ['spirituality'];
  } catch {
    return ['spirituality'];
  }
}

async function main() {
  const retag = !!args.retag;
  const limit = args.limit ? parseInt(args.limit) : null;

  // Distinct sources (title is the grouping key used across the corpus).
  const { data: sources, error } = await supabase.rpc('corpus_sources');
  if (error) { console.error('corpus_sources failed:', error.message); process.exit(1); }

  let targets = sources ?? [];
  if (limit) targets = targets.slice(0, limit);
  console.log(`Tagging ${targets.length} sources${retag ? ' (retag all)' : ''}…`);

  let tagged = 0;
  for (const src of targets) {
    // Skip already-tagged sources unless --retag.
    if (!retag) {
      const { data: existing } = await supabase
        .from('sean_chunks')
        .select('topics')
        .eq('source_title', src.source_title)
        .eq('source_type', src.source_type)
        .limit(1)
        .maybeSingle();
      if (existing && Array.isArray(existing.topics) && existing.topics.length > 0) continue;
    }

    // Pull a representative chunk to classify from.
    const { data: sample } = await supabase
      .from('sean_chunks')
      .select('content')
      .eq('source_title', src.source_title)
      .eq('source_type', src.source_type)
      .order('chunk_index', { ascending: true })
      .limit(1)
      .maybeSingle();

    const topics = await classify(src.source_title, sample?.content ?? '');

    const { error: upErr } = await supabase
      .from('sean_chunks')
      .update({ topics })
      .eq('source_title', src.source_title)
      .eq('source_type', src.source_type);

    if (upErr) { console.error(`  ✗ ${src.source_title}: ${upErr.message}`); continue; }
    tagged++;
    console.log(`  ✓ ${src.source_title} → ${topics.join(', ')}`);
    await new Promise(r => setTimeout(r, 250)); // gentle on the API
  }

  console.log(`\nDone. Tagged ${tagged} sources.`);
}

main().catch(e => { console.error(e); process.exit(1); });
