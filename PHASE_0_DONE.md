# Phase 0 — Foundation ✓

**Completed:** 2026-04-05

## What's live

- Next.js 16.2 + TypeScript + Tailwind v4 + shadcn/ui (Base UI primitives)
- `proxy.ts` (Next.js 16's replacement for middleware.ts) — auth guard on protected routes, redirects
- Supabase clients wired: browser (`lib/supabase/client.ts`), server (`lib/supabase/server.ts`), admin (`lib/supabase/admin.ts`)
- Auth: Google OAuth + email magic link via Supabase Auth (`lib/actions/auth.ts`)
- Auth callback route at `/auth/callback`
- Design tokens: warm parchment palette, Fraunces heading font, generous radius
- PWA: `public/manifest.json` + `public/sw.js` (network-first nav, cache-first assets, web push stub)
- DB schema: all Phase 0–7 tables in `db/schema.sql` (users, communities, members, posts, events, rsvps, notifications, DMs)
- RLS policies: full security perimeter in `db/policies.sql`
- n8n webhook stub: `lib/integrations/n8n.ts` (silent no-op until Phase 4)
- `.env.local.example` with all required env vars

## Verification checklist (do this before calling Phase 0 done)

- [ ] Create Supabase project via Vercel Marketplace → env vars auto-provisioned
- [ ] Copy `.env.local.example` to `.env.local` and fill in values
- [ ] Run `db/schema.sql` then `db/policies.sql` in Supabase SQL editor
- [ ] Enable Google OAuth provider in Supabase Auth dashboard
- [ ] Set Site URL + Redirect URL in Supabase Auth settings → `http://localhost:3000/auth/callback`
- [ ] `npm run dev` → sign in via Google → lands on `/home`
- [ ] `npm run dev` → sign in via magic link → check email → lands on `/home`
- [ ] Install PWA from Chrome on phone → shows on home screen
- [ ] `vercel deploy` → confirm production URL works end-to-end

## Next: Phase 1 — Identity + Communities
