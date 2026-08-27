# UX/UI Audit — Warriors on the Way

**Date:** 2026-08-26
**Scope:** UX/UI improvement of the existing app. Not a rewrite.
**Codebase at audit:** `master` @ `86d58b9`, Next.js 16.2.2 (App Router)

## The core loop

Everything in this audit is judged against the three jobs a real user comes here to do:

1. Find and join a local community ("circle").
2. Show up to in-person events.
3. Post and connect inside a community.

The Nine, the Map of Consciousness, and Seán's portal are supporting philosophy/content —
not the core loop.

## Design principles

- A stranger should understand what this is within 10 seconds of landing.
- No page should feel dead — every empty space is an invitation with one obvious action.
- Plain words first; poetic words second, always defined on first meeting.
- One primary action per screen. Make it unmistakable.
- Actions are buttons; places are tabs/nav. Never mix them.

---

## Status note: what the review caught vs. what the code now does

The written review was performed against a deploy that predates the 2026-08-25 commit run
(`606679d` … `86d58b9`). Several findings were already addressed in that run. Recording this
so the team doesn't re-fix solved problems:

| Review finding | Actual state in `master` |
| --- | --- |
| #2 No first-run onboarding | **Already built.** `components/welcome-overlay.tsx` — 4-step, skippable, plain language, `localStorage`-gated. Renders on `/menu` only. |
| #6 `/communities` is a broken link | **Not broken.** `next.config.ts` redirects `/communities` → `/community` (permanent), incl. sub-paths. `/map` → `/consciousness-map` also exists. |
| #9 Unexplained 150 cap | **Partly built.** `app/why-150/page.tsx` exists — but is linked only from the create-community form, not from the "N spots left" progress bar where the question actually arises. |
| #4 Nav mixes "do" and "read" | **Partly built.** `components/nav-config.tsx` is already a single source of truth with an explicit `PRIMARY_NAV` / `SECONDARY_NAV` split. The remaining problem is presentational, not structural. |
| #1 Events empty state is a dead end | **Partly built.** `345b2ee` gave it a role-aware CTA. A new contradiction was introduced — see E2 below. |

Findings below are re-stated against the code as it actually is.

---

## 🔴 Critical — the app reads as abandoned

### C1. Discover visibility gate is the root cause of the ghost town

`lib/queries/communities.ts:54` `listPublicCommunities()` filters to
`.or("status.eq.listed,is_parent.eq.true")` — a community is only browsable once it passes
the 5-member threshold. Forming communities (1–4 members) are invisible to everyone.

**Why it matters:** This is the actual engine behind "No communities to discover yet." It is
not a copy problem. A founder starts a circle, sees the network still report itself as empty,
and has no evidence their community exists to anyone. Meanwhile the newcomer sees an empty
network and leaves. Neither side can bootstrap the other — the threshold that was meant to
protect quality is what keeps anything from reaching it.

**Direction:** Surface forming communities in Discover as a distinct, honest state
("Forming — 3 of 5 members. Be the one who tips it live.") rather than hiding them. Keep the
listed/forming distinction visible; drop the invisibility.

### C2. Stacked empty states double the deadness

`app/community/page.tsx` renders two dashed boxes in sequence for a signed-in user with no
memberships: "You're not in any communities yet" (:50) and "No communities to discover yet"
(:103) — both resolving to the same "Create a community" action. Two negations and one
duplicated CTA where one invitation would do.

**Direction:** Collapse to a single invitation when both are empty. Never show two adjacent
empty states that ask for the same thing.

### C3. "No communities to discover yet" is often false

`discover` is `publicCommunities` minus the ones you're already in. A member of every listed
community sees an absence notice describing full participation.

**Direction:** Distinguish "nothing exists" from "you're in all of them." The second is a
success state and should read like one.

### E1. Doorway status advertises absence before the tap

`app/(me)/menu/page.tsx:21` — cards with no activity render "Nobody's opened this door yet"
as their status line. Five of six doorways carry it, so the front door reports emptiness six
times before a user opens anything.

Note the destination page (`app/needs/[slug]/page.tsx:101`) already handles the empty case
well — primary CTA plus a lower-commitment waitlist. The problem is the *card*, not the page.

**Direction:** Reframe the card line as what the door leads to and what it costs to open it
("Be the first to open this →"), not a report of absence.

### E2. Events page contradicts itself

`app/(me)/events/page.tsx` renders the "Nothing on the calendar yet" dashed box whenever
`events.length === 0` — and then renders a populated "Discover events" section directly
beneath it (:139). A user with zero personal events but a live public calendar is told
nothing is happening, immediately above a list of things happening.

**Direction:** When discovery has content, the page is not empty. Suppress or demote the
empty box and let the real events be the page.

### E3. Guest branch on `/community` is unreachable

`proxy.ts` gates the `/community` prefix; `isGuestViewable` only matches `/community/<slug>`
and its OG image, not the index. The `user ? … : …` guest block at
`app/community/page.tsx:88` can never render.

**Direction:** Either open the index to guests (it is the best possible landing page for a
shared "come join us" link) or delete the dead branch. Opening it is the stronger move and is
consistent with the existing guest-viewable event-link policy.

---

## 🟠 High — navigation & information architecture

### N1. `/the-nine` 404s

No `app/the-nine` route and no redirect. `/communities` and `/map` both have aliases; this one
was missed.

**Direction:** Add `/the-nine` → `/topics` to `next.config.ts` redirects.

### N2. Label/slug mismatches

Nav "Communities" → `/community` (singular). Nav "The Nine" → `/topics`. Labels and URLs
disagree, which shows in the address bar, in shared links, and in search results.

**Direction (structural — needs sign-off):** Pick canonical slugs that match the labels and
redirect the old ones. Cheap alternative: leave routes alone, since aliases already resolve.

### N3. "Menu" is the wrong label for the entry page

`PRIMARY_NAV[0]` is labelled "Menu" → `/menu`, which is the doorway home ("What are you
looking for?"). "Menu" reads as a hamburger or a list of links, and its icon reinforces that.

**Direction:** Rename to "Home" or "Start". Keep the `/menu` route; change the label and icon.

### N4. Secondary nav shows at every width

`components/top-nav-links.tsx` hides primary links below `sm` (mobile uses the bottom bar) but
renders The Nine / Seán / Map at all widths. On mobile the only visible top-level links are
the three content pages — the supporting philosophy outranks the core loop.

**Direction:** Group the secondary three behind one "Discover"/"About" affordance.

### N5. Duplicate "What are you looking for?"

Appears as the doorway home and again as a preferences section in Profile, with overlapping
but non-identical options and no shared state.

**Direction:** One source of truth. If Profile stores the preference, the home doorways should
reflect and edit that same state.

---

## 🟡 Medium — screen-level polish

### P1. Community detail mixes views with actions
Tabs: Members · Events · Ask & Offer · **+ New event** · Related · Moderation · Settings.
"+ New event" is an action in a row of places. Moderation/Settings show without role clarity.
**Direction:** Actions become buttons. Role-gate Moderation/Settings. Cut the member-facing
tab count to what people actually browse.

### P2. The 150 cap is unexplained where it's felt
`why-150` exists but is linked only from `create-community-form.tsx:177`. The "147 spots left"
progress bar — where the question actually occurs — has no link.
**Direction:** Link "Why 150?" from the cap UI itself, or drop the countdown framing, which
reads as artificial scarcity on a free peer network.

### P3. Two clashing visual themes
Core pages (Home, Events, Communities) are light; Map and Seán's portal are dark. The swap is
abrupt and makes the app feel like two products.
**Direction:** Unify, or make dark a deliberate, consistently-signposted treatment for
contemplative content.

### P4. The Nine and the Map are inert exhibits
Both look like navigation but lead nowhere actionable.
**Direction:** Give each a clear next action (follow a domain, find communities working on it,
discuss it) — or accept them as philosophy content and move them out of the primary path.

### P5. Thin trust & safety signals
18+, real names, and real addresses are stated — good. There is no visible answer to "how are
organizers vetted?" or "how do I report a problem?" for in-person spiritual gatherings with
strangers.
**Direction:** A short trust/safety note near join and event flows: vetting, reporting, and
what real names/addresses protect against.

---

## ✅ Working — keep it

- The doorway concept ("What are you looking for?") is a warm, human entry point. The problem
  is emptiness and unclear payoff, not the idea.
- Profile is clean and well-scoped; Venmo-for-expense-splits is a thoughtful touch.
- "Free forever, nobody charges" is clear and well repeated.
- Copy voice is distinctive and caring.
- `nav-config.tsx` as a single nav source of truth is the right structure — both bars derive
  from it and cannot drift.
- The `/needs/[slug]` empty state is the model the rest of the app should follow: highest-
  intent moment, one primary ask, one smaller ask beside it.

---

## Roadmap

**Phase 1 — Stop the bleeding.** C1, C2, C3, E1, E2, E3, N1. — **shipped**
**Phase 2 — Make it understandable.** Welcome overlay reach, term glossing, N3. — **shipped**
**Phase 3 — Simplify navigation.** N2, N4, N5. — **shipped** (N2 declined, see below)
**Phase 4 — Screen polish & consistency.** P1–P5. — **shipped**

---

## Shipped

### Phase 1 — `c6d8e29`

Root cause first: the empty states were a symptom. Three of the seven changes were bugs
that hid real activity rather than copy that described it badly.

- **C1** `listPublicCommunities` no longer hides forming circles. They surface with a
  Forming badge and "N more to open". Dormant stays hidden.
- **Discover member counts** — `DiscoverSearch` read `member_count` as `[{count}]` while
  the query flattens it to a number, so *every card in Discover showed 0 members* and a
  wide-open cap. `countOf()` now accepts both shapes. Not in the original review; only
  visible from the code.
- **C2/C3** `/community` shows at most one empty state, and "you're in every circle here"
  replaced an absence notice that fired on full participation.
- **E2** `/events` demotes its empty panel to one line when there are events to discover,
  instead of announcing emptiness above a populated list.
- **E3** `/community` index is guest-viewable. **N1** `/the-nine` redirects to `/topics`.
- **E1** Doorway cards invite instead of reporting absence.

### Phase 2 — make it understandable

- **N3** Nav "Menu" → **"Home"**, with a house icon replacing the list icon that
  reinforced the hamburger reading. Route `/menu` unchanged; the `← Menu` back-link on
  doorway pages follows.
- **Welcome overlay reach** — was mounted on `/menu` only, so anyone arriving by a shared
  link never met it. Now mounted in `AppNav` and gated to front doors (`/menu`,
  `/community`, `/events`). Deliberately *not* shown on deep-linked circle or event
  pages: a shared link is a specific promise, and a modal in front of it is a toll gate.
  Same reasoning that already keeps shared event links public.
- **Term glossing on first use** — `doorway`, `circle`, `The Nine`, `offerings`, and
  `North Star` are now defined where they are first met, in plain words, with the
  community's own word kept alongside rather than replaced. The overlay is skippable and
  one-time, so the glosses live on the pages too and do not depend on it.

### Phase 3 — simplify navigation

- **N4** The Nine / Seán / Map collapsed into one **Discover** menu in the top bar. They
  had been three loose links at every width, and since the primary links hide behind the
  bottom bar on mobile, they were the *only* top-bar links a phone user saw — the
  supporting material outranking the core loop. Each now carries a blurb, because none of
  the three names tells you what is behind it.
- **`/topics` opened to guests.** The Nine sat in the nav on every page, guests included,
  and pointed at a sign-in wall — the nav advertised a locked door. The index is nine
  names and nine one-line statements, so it opens. Per-topic pages stay gated: they
  render a members' feed and thread the viewer's id through posting. That is a product
  boundary, not an oversight.
- **`/topics` got `AppNav`.** It had rendered without navigation — a room with no door.
- **N5** The two "What are you looking for?" surfaces are now one thing. They were never
  duplicate state — both write `user_needs`; one is per-doorway signup, the other the bulk
  editor — but the identical heading made Profile read as a rival copy of the doorway
  navigation. Profile is now "Tell me when something opens", and the front door shows a
  **Following** badge on the doorways you follow with a link to manage them, so the state
  is visible where it is used rather than stranded in settings.
- **N2 declined** — normalising `/community` → `/communities` to match the label. Aliases
  already resolve both ways in both directions, so this is churn with no user benefit and
  a fresh set of redirects to maintain. Revisit only if the URL shows up somewhere it
  reads badly.

### Phase 4 — screen polish & consistency

- **P1** Community detail split into three kinds of thing. It had been one flat row of
  eight identically-styled pills where "Members" (a place), "+ New event" (an action) and
  "Settings" (a steward's tool) were the same shape. Places are now a plain nav row,
  actions are buttons, and the admin three sit under an "Organizer tools" label. Note the
  review's claim that Moderation/Settings show regardless of role was already false —
  they were `isAdmin`-gated; the problem was that they *looked* identical to everything
  else.
- **P2** "Why 150?" now links from the member count on community detail, where the
  question occurs. The card's "N spots left" carries the explanation as a title (the whole
  card is a link, so it cannot nest another).
- **P3** Seán's portal and the Map now share one `ContemplativeNav`. Each had hand-rolled
  its own header with a slightly different background, and both linked back to `/` — the
  public landing page — so the way out of a contemplative page was out of the app. The
  dark palette is kept deliberately: it is the voice those pages are written in. The seam
  was the missing shared chrome, not the colour.
- **P4** The Nine and the Map each end with a way into the core loop instead of stopping
  dead — "Find a circle near you" / "Start from what you need".
- **P5** A `SafetyNote` sits at both points of commitment: joining a circle and RSVPing to
  an event. It states only what is verifiably true in the schema — real names, 18+, exact
  addresses gated behind RSVP, reporting on every post and profile — and says plainly that
  **organizers are not vetted**, because they are not. Answering "how are organizers
  vetted?" with a comfortable half-truth would have been worse than the silence.

### Known gaps left open

- `/topics` is light-themed while Seán's portal and the Map are dark — the two-product
  seam (P3). Its missing `AppNav` is fixed.
- Per-topic pages (`/topics/[slug]`) remain sign-in gated, so a guest who reads The Nine
  and taps a domain still meets a wall. Opening them read-only means making the viewer
  nullable through the feed, posting and commenting — a real change, not a config flag.
- The "147 spots left" cap on listed circles is still unexplained at the point it is
  felt; `why-150` exists but is linked only from the create form (P2).
- Existing visitors who dismissed the old overlay will not see the rewritten one — the
  `wow_welcome_seen_v1` key is intentionally unchanged, so nobody gets re-nagged.
