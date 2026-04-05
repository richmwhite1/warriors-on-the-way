# Phase 1 — Identity + Communities ✓

**Completed:** 2026-04-05

## What's live

### Database
- `db/migrations/001_auth_trigger.sql` — auto-creates `public.users` row on every Supabase Auth signup (Google or magic link), seeding display_name from OAuth metadata
- `db/seed.sql` — seeds Supabase Storage buckets (`avatars`, `community-banners`) + commented parent community seed block

### Queries (lib/queries/)
- `users.ts` — `getAuthUser`, `getUserProfile`, `requireUserProfile`
- `communities.ts` — `getCommunityBySlug`, `listPublicCommunities`, `listUserCommunities`, `slugExists`
- `members.ts` — `getMembership`, `listActiveMembers`, `listWaitlistedMembers`, `getActiveMemberCount`

### Actions (lib/actions/)
- `profile.ts` — `updateProfile`, `updateAvatarUrl`
- `communities.ts` — `createCommunity` (auto-slug, unique slug), `updateCommunitySettings`
- `members.ts` — `joinCommunity` (handles cap → waitlist, private → pending), `leaveCommunity`, `approveMember`, `denyMember`, `promoteMember`, `removeMember`, `promoteFromWaitlist`

### Pages
- `/home` — user's communities grid + discover section
- `/profile` — edit display name, bio, timezone + avatar upload
- `/community/new` — create community form (name, description, slug, private, events toggle)
- `/community/[slug]` — community page with join/leave/waitlist/pending states
- `/community/[slug]/members` — member list with admin actions (approve, deny, promote, demote, remove)

### Components
- `AppNav` — sticky top nav with logo, "New community" link, user avatar + sign out
- `CommunityCard` — shows name, description, member count bar (x/150)
- `JoinButton` — handles all 5 membership states
- `CreateCommunityForm` — client form component
- `ProfileForm` — edit profile form
- `AvatarUpload` — client-side upload to Supabase Storage avatars bucket
- `MemberList` — active members + pending approval queue with admin actions

## Verification checklist (do before calling Phase 1 done)

- [ ] Run `db/migrations/001_auth_trigger.sql` in Supabase SQL editor
- [ ] Run `db/seed.sql` (Storage buckets section) in Supabase SQL editor
- [ ] Sign in → profile auto-created → `/home` loads with greeting
- [ ] Edit profile: change display name, bio, timezone, upload avatar → saves
- [ ] Create a community → redirects to `/community/[slug]`
- [ ] Open incognito → sign in as User B → discover + join the community → appears as member
- [ ] Test waitlist: seed 150 members (or lower `member_cap` temporarily) → join puts User B on waitlist → remove a member → User B auto-promoted
- [ ] Test private community: User B join → shows "Request pending" → admin approves → User B active
- [ ] Admin: promote member to admin, demote back, remove member
- [ ] Run the parent community seed block (fill in YOUR_USER_ID) → promote yourself to organizer
- [ ] `vercel deploy` → confirm production URL works

## To seed the parent community
1. Find your UUID: Supabase dashboard → Authentication → Users → copy your UUID
2. Edit the seed block in `db/seed.sql`, replace `YOUR_USER_ID`
3. Uncomment the `do $$ ... $$;` block and run it

## Next: Phase 2 — Feed + Posts + YouTube embeds
