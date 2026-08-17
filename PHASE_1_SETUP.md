# Phase One — Runtime Setup

Everything is committed on `feat/nine-topics-phase-one` and passes typecheck + build.
Three things must happen before the topic pages, Seán band, and seeded feeds are fully live.

## 1. Apply the Warriors migrations

The eight new migrations extend the existing schema. They assume the base schema
(`db/schema.sql` + `db/policies.sql`) and prior migrations are already applied (they are, in prod).

```
supabase db push          # applies supabase/migrations/20260817000001–08
```

New migrations:
- `20260817000001_strip_dms_and_parent.sql` — drops `direct_messages`, removes `dm_cross_community`
- `20260817000002_identity_realname_18plus.sql` — real-name + 18+ trigger
- `20260817000003_topics.sql` — `topics` (nine seeded), `topic_follows`, `topic_visits`
- `20260817000004_posts_topic_scope.sql` — `posts.visibility`/`topic_id`, threaded comments, RLS
- `20260817000005_communities_gate_and_topics.sql` — purpose, status gate, `community_topics`, sweeps
- `20260817000006_events_address_gate.sql` — `general_location`/`exact_address` + reveal RPC
- `20260817000007_asks.sql` — Ask & Offer board + coordination thread
- `20260817000008_moderation_flag_dial.sql` — flag threshold auto-hide + reversible hide

## 2. Apply the corpus topic-tagging + backfill (Seán band)

The per-topic teaching band answers only from a topic's slice of the corpus. That slicing
does not exist until the corpus is tagged. This step touches the **external Seán corpus
Supabase** (spiritsinspacesuits.com's project) — NOT Warriors, and NOT the spirits-vercel
git repo. Both artifacts live in THIS repo:

```
# 1. Apply the SQL to the corpus DB (Supabase SQL editor, or psql against that project):
db/sean-corpus/topic_tagging.sql        # adds sean_chunks.topics + match_chunks_by_topic RPC

# 2. Backfill tags (env points at the CORPUS project, not Warriors):
SUPABASE_URL=<corpus url> SUPABASE_SERVICE_KEY=<corpus key> GEMINI_API_KEY=<key> \
  node scripts/tag_topics.mjs           # AI-tags ~700 transcripts + 4 books into the nine
```

## 3. Env for the Warriors Seán-band route + seeding

Add to Warriors `.env.local` (and Vercel project env):
```
SEAN_SUPABASE_URL=<spirits project url>
SEAN_SUPABASE_SERVICE_KEY=<spirits service key>
GEMINI_API_KEY=<gemini key>
SEED_USER_ID=<an existing Warriors user id to author seed posts>
```

Then seed topic feeds so none are empty on first view:
```
node scripts/seed_topic_feeds.mjs --per-topic=8
```

## Notes / corrections to the brief
- The RAG is **Gemini** (`gemini-embedding-2` 768-dim + `gemini-2.5-flash`), not Claude. Any
  product copy that says "Claude" is inaccurate.
- Without `SEAN_*` env, `/api/sean/ask` returns a graceful 503 and the band shows an error line —
  the rest of the app is unaffected.
- The dormancy sweep runs inside the existing daily cron (`/api/cron/event-reminders`); Hobby plan
  allows daily crons only, so it is piggybacked rather than a second cron.

## Deferred to phase two (shells shipped now)
- Resources tab (route/tab present, hidden)
- Inactivity sweep going live (`last_meaningful_action_at` column already populated)
- Trusted-member topic review queue
