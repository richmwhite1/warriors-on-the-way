#!/usr/bin/env node
// Seeds each topic's Info feed with real content so no feed is ever empty on first
// view (a phase-one deliverable, not an afterthought). Pulls topic-tagged sources
// from the Seán corpus (spirits-vercel Supabase) and inserts them as topic posts
// (YouTube embeds) authored by a seed account.
//
// Usage:
//   node scripts/seed_topic_feeds.mjs --per-topic=8
//
// Env (.env.local):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (Warriors)
//   SEAN_SUPABASE_URL, SEAN_SUPABASE_SERVICE_KEY          (corpus)
//   SEED_USER_ID                                          (existing Warriors user id to author seeds)

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.local') });

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.slice(2).split('=');
    return [k, v ?? true];
  })
);
const PER_TOPIC = args['per-topic'] ? parseInt(args['per-topic']) : 8;

const wow = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sean = createClient(process.env.SEAN_SUPABASE_URL, process.env.SEAN_SUPABASE_SERVICE_KEY);
const SEED_USER_ID = process.env.SEED_USER_ID;

function ytPreview(videoId, title) {
  return {
    provider: 'youtube',
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    title,
    description: null,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

async function main() {
  if (!SEED_USER_ID) { console.error('SEED_USER_ID is required'); process.exit(1); }

  const { data: topics, error: tErr } = await wow.from('topics').select('id, slug, name');
  if (tErr) { console.error(tErr.message); process.exit(1); }

  for (const topic of topics) {
    // Distinct video sources tagged to this topic, from the corpus.
    const { data: chunks, error } = await sean
      .from('sean_chunks')
      .select('source_id, source_title, source_type')
      .eq('source_type', 'transcript')
      .contains('topics', [topic.slug])
      .not('source_id', 'is', null)
      .limit(400);
    if (error) { console.error(`${topic.slug}: ${error.message}`); continue; }

    // De-dupe by video id.
    const seen = new Set();
    const videos = [];
    for (const c of chunks ?? []) {
      if (c.source_id && !seen.has(c.source_id)) {
        seen.add(c.source_id);
        videos.push(c);
        if (videos.length >= PER_TOPIC) break;
      }
    }

    if (videos.length === 0) { console.log(`~ ${topic.name}: no tagged videos yet`); continue; }

    // Skip any already seeded (same topic + link_url) to keep the script idempotent.
    const rows = [];
    for (const v of videos) {
      const url = `https://www.youtube.com/watch?v=${v.source_id}`;
      const { data: exists } = await wow
        .from('posts')
        .select('id')
        .eq('topic_id', topic.id)
        .eq('link_url', url)
        .limit(1)
        .maybeSingle();
      if (exists) continue;
      rows.push({
        topic_id: topic.id,
        community_id: null,
        visibility: 'topic',
        author_id: SEED_USER_ID,
        post_type: 'video',
        body: v.source_title,
        link_url: url,
        link_preview: ytPreview(v.source_id, v.source_title),
        embed_provider: 'youtube',
      });
    }

    if (rows.length === 0) { console.log(`= ${topic.name}: already seeded`); continue; }
    const { error: insErr } = await wow.from('posts').insert(rows);
    if (insErr) { console.error(`${topic.slug}: ${insErr.message}`); continue; }
    console.log(`✓ ${topic.name}: seeded ${rows.length} videos`);
  }
  console.log('\nSeeding complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
