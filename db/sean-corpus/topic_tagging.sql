-- ⚠ TARGETS THE EXTERNAL SEÁN CORPUS DATABASE (spiritsinspacesuits.com's Supabase),
-- NOT the Warriors database. This file lives in the Warriors repo because it is a
-- Warriors deliverable (the per-topic teaching band depends on it), but it is applied
-- by the corpus owner against the corpus DB. It is intentionally NOT in
-- supabase/migrations/ so it never runs against Warriors.
--
-- Adds topic tags to sean_chunks and a topic-filtered vector-search RPC so each of
-- the nine mission topics can answer "only from that topic's slice" with citations.
-- Topic slugs match the Warriors `topics` table:
--   education, economics, healing, storytelling, entertainment, food, fire,
--   democracy, spirituality
-- Backfill is done by scripts/tag_topics.mjs (AI-assisted, from title + content).

alter table public.sean_chunks
  add column if not exists topics text[] not null default '{}';

-- GIN index for fast array-contains filtering.
create index if not exists sean_chunks_topics_idx
  on public.sean_chunks using gin (topics);

-- Topic-filtered semantic search. When p_topic is null it behaves like the global
-- match_chunks, so topic-sliced retrieval stays available to corpus-side tooling.
create or replace function public.match_chunks_by_topic(
  query_embedding vector(768),
  p_topic text default null,
  match_count int default 8
)
returns table (
  id bigint,
  content text,
  source_type text,
  source_title text,
  source_id text,
  source_date text,
  topics text[],
  similarity float
)
language sql stable as $$
  select
    id, content, source_type, source_title, source_id, source_date, topics,
    1 - (embedding <=> query_embedding) as similarity
  from public.sean_chunks
  where p_topic is null or topics @> array[p_topic]
  order by embedding <=> query_embedding
  limit match_count;
$$;
