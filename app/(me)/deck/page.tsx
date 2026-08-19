import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserProfile } from "@/lib/queries/users";
import {
  getTopics,
  listTopicPosts,
  getCommentsForPosts,
  getListedCommunitiesForTopic,
  getFollowedTopicIds,
} from "@/lib/queries/topics";
import { listOpenAsksForTopic } from "@/lib/queries/asks";
import { listUpcomingEventsForTopic } from "@/lib/queries/events";
import { AppNav } from "@/components/app-nav";
import { ObjectivePills } from "@/components/deck/objective-pills";
import { DeckShell } from "@/components/deck/deck-shell";
import { DeckBody } from "@/components/deck/deck-body";
import { FollowButton } from "@/components/deck/follow-button";
import { type DeckMeta } from "@/components/deck/meta-card";
import { WelcomeOverlay } from "@/components/welcome-overlay";

type Props = { searchParams: Promise<{ mode?: string }> };

const INITIAL = 30;

function eventDate(iso: string | null): string {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function DeckPage({ searchParams }: Props) {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const { mode } = await searchParams;
  const [topics, followedIds] = await Promise.all([getTopics(), getFollowedTopicIds(user.id)]);
  if (topics.length === 0) redirect("/topics");

  // Land on the requested objective, else the first one the user follows, else the first overall.
  const active =
    topics.find((t) => t.slug === mode) ??
    topics.find((t) => followedIds.includes(t.id)) ??
    topics[0];
  const isFollowingActive = followedIds.includes(active.id);
  // First run: a signed-in user who follows no objectives yet. The Deck falls back to
  // showing the first objective, so nudge them to make it their own.
  const firstRun = followedIds.length === 0;

  const [posts, events, asks, communities] = await Promise.all([
    listTopicPosts(active.id, INITIAL),
    listUpcomingEventsForTopic(active.id, 3),
    listOpenAsksForTopic(active.id, 3),
    getListedCommunitiesForTopic(active.id),
  ]);
  const comments = posts.length > 0 ? await getCommentsForPosts(posts.map((p) => p.id)) : [];

  const subtitle = active.solution_statement ?? active.manifesto_objective;

  // Time-sensitive coordination surfaces first, then discussion, then places to join.
  const topMeta: DeckMeta[] = [
    ...events.map((e): DeckMeta => ({
      kind: "event",
      href: `/community/${e.community_slug}/events/${e.id}`,
      eyebrow: "Gathering",
      headline: e.title,
      meta: `${eventDate(e.starts_at)} · ${e.community_name}`,
    })),
    ...asks.map((a): DeckMeta => ({
      kind: "ask",
      href: a.community ? `/community/${a.community.slug}/asks` : "/community",
      eyebrow: a.kind === "ask" ? "Looking for help" : "Offering",
      headline: a.title,
      meta: a.community?.name ?? "",
    })),
  ];

  const communityMeta: DeckMeta[] = communities.slice(0, 4).map((c): DeckMeta => ({
    kind: "community",
    href: `/community/${c.slug}`,
    eyebrow: "Community",
    headline: c.name,
    meta: `${c.public_member_count} member${c.public_member_count === 1 ? "" : "s"}`,
  }));

  const empty = posts.length === 0 && topMeta.length === 0 && communityMeta.length === 0;
  const lastCursor = posts.length > 0 ? posts[posts.length - 1].created_at : "";

  return (
    <>
      <AppNav />
      <WelcomeOverlay />

      <main className="animate-page-enter" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: "5rem" }}>
        {/* ── Title ────────────────────────────────────────────────────────── */}
        <h1
          style={{
            fontFamily: "var(--font-brand)",
            fontWeight: 800,
            fontSize: "1.75rem",
            letterSpacing: "-0.02em",
            color: "var(--foreground)",
            margin: 0,
            padding: "1rem 1rem 0.75rem",
          }}
        >
          Deck
        </h1>

        {/* ── First-run nudge: make the Deck personal by following objectives ── */}
        {firstRun && (
          <div
            style={{
              margin: "0 1rem 0.75rem",
              background: "linear-gradient(135deg, #f8f4ec 0%, #fdf9f0 100%)",
              border: "1px solid #e8dcc8",
              borderRadius: 12,
              padding: "0.85rem 1rem",
            }}
          >
            <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14, color: "var(--foreground)", margin: 0 }}>
              Make this your own
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5, margin: "4px 0 0" }}>
              Tap an objective below, then <strong style={{ color: "#4a4438", fontWeight: 600 }}>Follow</strong> the ones that call you — your Deck opens to what you follow.
            </p>
          </div>
        )}

        {/* ── Objective toggle pills ─────────────────────────────────────────── */}
        <ObjectivePills
          topics={topics.map((t) => ({ slug: t.slug, name: t.name, icon: t.icon }))}
          activeSlug={active.slug}
        />

        {/* ── Objective subtitle + follow + full-objective link ──────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "0.5rem 1rem 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {subtitle && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.5, margin: 0 }}>
                {subtitle}
              </p>
            )}
            <Link
              href={`/topics/${active.slug}`}
              style={{ display: "inline-block", marginTop: 6, fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
            >
              About {active.name} →
            </Link>
          </div>
          <FollowButton topicId={active.id} topicSlug={active.slug} initialFollowing={isFollowingActive} />
        </div>

        {/* ── Feed / Stack for the active objective (swipe left/right to change) ── */}
        <DeckShell slugs={topics.map((t) => t.slug)} activeSlug={active.slug}>
          <DeckBody
            posts={posts}
            comments={comments}
            topMeta={topMeta}
            communityMeta={communityMeta}
            objectiveName={active.name}
            topicId={active.id}
            topicSlug={active.slug}
            currentUserId={user.id}
            lastCursor={lastCursor}
            initialHasMore={posts.length === INITIAL}
            empty={empty}
          />
        </DeckShell>
      </main>
    </>
  );
}
