#!/usr/bin/env node
/**
 * Demo content for the design/prototype phase.
 *
 * Every list surface in the app currently renders empty, which means /needs/[slug] is
 * effectively only ever an empty state — well-written, but it tells you nothing about
 * what "I Want Community" looks like at thirty circles. That's where the real design
 * problems live: hierarchy, scan density, what a card drops first when it's crowded.
 *
 * So this is not fixtures baked into components (which rot, and which you then have to
 * remember to rip out before launch). It's real rows in a real database, written through
 * the service role, all tagged `demo-` so a single teardown removes every trace.
 *
 * The dataset deliberately includes the ugly cases, because those are what break
 * layouts: a 90-character title, an offering with no description and no facilitator,
 * a next session in the past, one thing tagged with all six doorways, a circle at 148
 * of 150 members and one with two.
 *
 *   node scripts/seed_demo.mjs           # write
 *   node scripts/seed_demo.mjs --clean   # remove every demo- row
 *
 * Guarded: refuses to run against the production URL unless --force is passed, because
 * the service role bypasses RLS and this writes dozens of rows.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// ─── Env (read .env.local directly; this runs outside Next) ─────────────────
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const CLEAN = args.includes("--clean");
const FORCE = args.includes("--force");

// The one guard that matters. Demo content on the real menu would send someone to a
// grief group that does not exist — the exact failure this app cannot have.
const PROD_URL = "https://fxngcfjkcyrcljsghtpy.supabase.co";
if (URL_.startsWith(PROD_URL) && !FORCE) {
  console.error(
    `\nRefusing to seed demo data into production (${URL_}).\n` +
      `Demo circles on the live menu would send a real person to a gathering that doesn't exist.\n` +
      `Point .env.local at a local or branch database, or pass --force if you truly mean it.\n`,
  );
  process.exit(1);
}

const db = createClient(URL_, KEY, { auth: { persistSession: false } });

// ─── Teardown ───────────────────────────────────────────────────────────────
// Order matters: children before parents, since some FKs are restrict-by-default.
async function clean() {
  const { data: communities } = await db.from("communities").select("id").like("slug", "demo-%");
  const ids = (communities ?? []).map((c) => c.id);

  if (ids.length) {
    const { data: offerings } = await db.from("offerings").select("id").in("community_id", ids);
    const offeringIds = (offerings ?? []).map((o) => o.id);
    if (offeringIds.length) {
      await db.from("offering_needs").delete().in("offering_id", offeringIds);
      await db.from("offering_interest").delete().in("offering_id", offeringIds);
      await db.from("offerings").delete().in("id", offeringIds);
    }

    const { data: events } = await db.from("events").select("id").in("community_id", ids);
    const eventIds = (events ?? []).map((e) => e.id);
    if (eventIds.length) {
      await db.from("event_needs").delete().in("event_id", eventIds);
      await db.from("rsvps").delete().in("event_id", eventIds);
      await db.from("events").delete().in("id", eventIds);
    }

    await db.from("community_needs").delete().in("community_id", ids);
    await db.from("community_topics").delete().in("community_id", ids);
    await db.from("community_members").delete().in("community_id", ids);
    await db.from("communities").delete().in("id", ids);
  }

  console.log(`Removed ${ids.length} demo communities and everything under them.`);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const day = 86_400_000;
const inDays = (n, hour = 18) => {
  const d = new Date(Date.now() + n * day);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

async function lookup(table, col = "slug") {
  const { data, error } = await db.from(table).select(`id, ${col}`);
  if (error) throw new Error(`${table}: ${error.message}`);
  return Object.fromEntries(data.map((r) => [r[col], r.id]));
}

// ─── The dataset ────────────────────────────────────────────────────────────
// Written to stress the layouts, not to look good in a screenshot.
const COMMUNITIES = [
  { slug: "demo-sugarhouse-sit", name: "Sugarhouse Morning Sit", purpose: "Twenty minutes of silence before the day starts.", location: "Sugar House, SLC", format: "in_person", members: 34, needs: ["curious", "community"], topic: "spirituality" },
  { slug: "demo-grief-circle", name: "Thursday Grief Circle", purpose: "A room where you don't have to be okay.", location: "Millcreek", format: "in_person", members: 11, needs: ["support", "guidance"], topic: "healing" },
  { slug: "demo-park-city-womens", name: "Park City Women's Circle", purpose: "New moon gatherings for women in the Wasatch Back.", location: "Park City", format: "in_person", members: 148, needs: ["community", "support"], topic: "spirituality" },
  { slug: "demo-forming-fathers", name: "Fathers' Fire", purpose: "Just getting started — men with young kids, meeting monthly.", location: "Holladay", format: "in_person", members: 2, needs: ["community", "serve"], topic: "fire", status: "forming" },
  { slug: "demo-online-inquiry", name: "The Long Question", purpose: "A reading group for people who'd rather ask than answer.", location: "Online", format: "online", members: 61, needs: ["curious"], topic: "education" },
  { slug: "demo-somatics", name: "Wasatch Somatics", purpose: "Movement as a way back into the body.", location: "Salt Lake City", format: "hybrid", members: 44, needs: ["wellness", "support"], topic: "healing" },
  { slug: "demo-garden", name: "Jordan River Garden Collective", purpose: "Growing food and giving it away.", location: "Rose Park", format: "in_person", members: 78, needs: ["serve", "community"], topic: "food" },
  // Deliberately awkward: a purpose long enough to wrap three times on a phone.
  { slug: "demo-long-name", name: "The Wednesday Evening Gathering for Contemplative Practice, Shared Silence and Occasional Song", purpose: "We meet, we sit, we sometimes sing, and we leave a little more ourselves than when we came in — everyone is welcome regardless of tradition, background, belief, or how long it has been since you last tried something like this.", location: "Avenues, SLC", format: "in_person", members: 19, needs: ["curious", "spirituality", "community"], topic: "spirituality" },
];

const OFFERINGS = [
  { community: "demo-sugarhouse-sit", title: "Morning Sit", cadence: "Weekdays 6:30am", facilitator: "Nadia R.", location: "Fairmont Park pavilion", format: "in_person", next: inDays(1, 6), needs: ["curious", "community"], interest: 9 },
  { community: "demo-grief-circle", title: "Thursday Grief Circle", cadence: "Thursdays 7pm", facilitator: "Marcus Bell", location: "Millcreek Commons, back room", format: "in_person", next: inDays(3, 19), needs: ["support"], cost: "Bring $5 for tea if you can", interest: 6 },
  { community: "demo-park-city-womens", title: "New Moon Circle", cadence: "First Friday monthly", facilitator: "Shannon", location: "Park City", format: "in_person", next: inDays(9, 19), needs: ["community", "support", "spirituality"], interest: 22 },
  { community: "demo-somatics", title: "Slow Flow", cadence: "Tuesdays 6pm", facilitator: "Jess Ortiz", location: "9th & 9th studio", format: "hybrid", next: inDays(2, 18), needs: ["wellness"], cost: "Mats provided", interest: 14 },
  { community: "demo-somatics", title: "Nervous System Basics", description: "A four-week series on what your body is doing when it won't calm down.", cadence: "Sundays, 4 weeks from Jan 12", facilitator: "Jess Ortiz", format: "online", next: inDays(5, 16), needs: ["wellness", "support", "curious"], interest: 31 },
  { community: "demo-online-inquiry", title: "The Long Question", cadence: "Alternate Wednesdays 8pm", facilitator: null, location: null, format: "online", next: inDays(4, 20), needs: ["curious"], interest: 12 },
  { community: "demo-garden", title: "Saturday Work Party", cadence: "Saturdays 9am–noon", facilitator: "Dee", location: "Jordan River parkway, 800 N", format: "in_person", next: inDays(6, 9), needs: ["serve", "community"], interest: 18 },
  { community: "demo-garden", title: "Seed Library", description: null, cadence: "Open whenever the shed is", facilitator: null, location: null, format: "in_person", next: null, needs: ["serve"], interest: 0 },
  // No description, no facilitator, no next session — the barest possible card.
  { community: "demo-forming-fathers", title: "Fathers' Fire", cadence: "Last Sunday monthly", facilitator: null, location: "Backyard, Holladay", format: "in_person", next: null, needs: ["community", "serve"], interest: 2 },
  // A stale next_starts_at: the card must not advertise a session that already happened.
  { community: "demo-sugarhouse-sit", title: "Winter Retreat Day", cadence: "Once a season", facilitator: "Nadia R.", location: "Big Cottonwood", format: "in_person", next: inDays(-6, 9), needs: ["curious", "spirituality"], interest: 4 },
  // Every doorway at once — checks that a six-badge card doesn't blow up the layout.
  { community: "demo-long-name", title: "Wednesday Evening Gathering", description: "Sitting, silence, and sometimes song.", cadence: "Wednesdays 7pm", facilitator: "Rotating", location: "Avenues", format: "hybrid", next: inDays(2, 19), needs: ["curious", "support", "guidance", "community", "wellness", "serve"], interest: 27 },
];

const EVENTS = [
  { community: "demo-garden", title: "Harvest potluck", days: 5, format: "in_person", needs: ["community", "serve"] },
  { community: "demo-park-city-womens", title: "Solstice fire on the ridge", days: 12, format: "in_person", needs: ["community", "spirituality"] },
  { community: "demo-online-inquiry", title: "Guest reading: on attention", days: 3, format: "online", needs: ["curious"] },
  { community: "demo-somatics", title: "Free intro class", days: 1, format: "hybrid", needs: ["wellness", "curious"] },
  { community: "demo-sugarhouse-sit", title: "Dawn hike + sit", days: 8, format: "in_person", needs: ["curious", "wellness"] },
  { community: "demo-grief-circle", title: "Remembrance walk", days: 20, format: "in_person", needs: ["support"] },
  { community: "demo-forming-fathers", title: "First gathering — anyone welcome", days: 15, format: "in_person", needs: ["community"] },
];

async function seed() {
  const needs = await lookup("needs");
  const topics = await lookup("topics");

  // Everything is owned by the first real user in the database — demo rows still have
  // to satisfy the created_by foreign key, and inventing an auth user would be worse.
  const { data: owner } = await db.from("users").select("id, display_name").limit(1).single();
  if (!owner) {
    console.error("No users yet — sign in once, then run this again.");
    process.exit(1);
  }
  console.log(`Seeding as ${owner.display_name ?? owner.id}\n`);

  const communityIds = {};

  for (const c of COMMUNITIES) {
    const { data, error } = await db
      .from("communities")
      .upsert(
        {
          slug: c.slug,
          name: c.name,
          purpose: c.purpose,
          description: c.purpose,
          location: c.location,
          format: c.format,
          is_private: false,
          is_parent: false,
          status: c.status ?? "listed",
          created_by: owner.id,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw new Error(`community ${c.slug}: ${error.message}`);
    communityIds[c.slug] = data.id;

    // public_member_count is what the cards read; there are no real member rows behind
    // these, and fabricating memberships would put demo people in real rosters.
    await db.from("communities").update({ public_member_count: c.members }).eq("id", data.id);

    await db.from("community_needs").delete().eq("community_id", data.id);
    await db.from("community_needs").insert(
      c.needs.filter((n) => needs[n]).map((n) => ({ community_id: data.id, need_id: needs[n] })),
    );

    if (topics[c.topic]) {
      await db
        .from("community_topics")
        .upsert({ community_id: data.id, topic_id: topics[c.topic] }, { onConflict: "community_id,topic_id" });
    }
  }
  console.log(`✓ ${COMMUNITIES.length} circles`);

  for (const o of OFFERINGS) {
    const community_id = communityIds[o.community];
    const { data: existing } = await db
      .from("offerings")
      .select("id")
      .eq("community_id", community_id)
      .eq("title", o.title)
      .maybeSingle();

    const row = {
      community_id,
      created_by: owner.id,
      title: o.title,
      description: o.description === undefined ? `${o.title} — a standing offering.` : o.description,
      facilitator_name: o.facilitator ?? null,
      cadence_text: o.cadence,
      next_starts_at: o.next,
      location: o.location ?? null,
      cost_note: o.cost ?? null,
      format: o.format,
      status: "active",
      interest_count: o.interest,
      topic_id: topics[COMMUNITIES.find((c) => c.slug === o.community).topic] ?? null,
    };

    const { data, error } = existing
      ? await db.from("offerings").update(row).eq("id", existing.id).select("id").single()
      : await db.from("offerings").insert(row).select("id").single();
    if (error) throw new Error(`offering ${o.title}: ${error.message}`);

    await db.from("offering_needs").delete().eq("offering_id", data.id);
    await db.from("offering_needs").insert(
      o.needs.filter((n) => needs[n]).map((n) => ({ offering_id: data.id, need_id: needs[n] })),
    );
  }
  console.log(`✓ ${OFFERINGS.length} offerings`);

  for (const e of EVENTS) {
    const community_id = communityIds[e.community];
    const { data: existing } = await db
      .from("events")
      .select("id")
      .eq("community_id", community_id)
      .eq("title", e.title)
      .maybeSingle();

    const row = {
      community_id,
      created_by: owner.id,
      title: e.title,
      description: `${e.title} — everyone welcome.`,
      starts_at: inDays(e.days, 18),
      timezone: "America/Denver",
      status: "confirmed",
      format: e.format,
      topic_id: topics[COMMUNITIES.find((c) => c.slug === e.community).topic] ?? null,
    };

    const { data, error } = existing
      ? await db.from("events").update(row).eq("id", existing.id).select("id").single()
      : await db.from("events").insert(row).select("id").single();
    if (error) throw new Error(`event ${e.title}: ${error.message}`);

    await db.from("event_needs").delete().eq("event_id", data.id);
    await db.from("event_needs").insert(
      e.needs.filter((n) => needs[n]).map((n) => ({ event_id: data.id, need_id: needs[n] })),
    );
  }
  console.log(`✓ ${EVENTS.length} gatherings`);

  console.log(`\nDone. Remove it all with: node scripts/seed_demo.mjs --clean`);
}

await (CLEAN ? clean() : seed());
