import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/queries/users";
import {
  getTopics,
  listTopicPosts,
  getCommentsForPosts,
  getListedCommunitiesForTopic,
} from "@/lib/queries/topics";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";
import { listOpenAsksForTopic } from "@/lib/queries/asks";
import { listUpcomingEventsForTopic } from "@/lib/queries/events";
import { ObjectivePills } from "@/components/deck/objective-pills";
import { DeckShell } from "@/components/deck/deck-shell";
import { DeckBody } from "@/components/deck/deck-body";
import { type DeckMeta } from "@/components/deck/meta-card";
import { NotificationBell } from "@/components/notification-bell";

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
  const topics = await getTopics();
  if (topics.length === 0) redirect("/topics");

  const active = topics.find((t) => t.slug === mode) ?? topics[0];

  const [posts, unreadCount, events, asks, communities] = await Promise.all([
    listTopicPosts(active.id, INITIAL),
    getUnreadNotificationCount(user.id),
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
    <main className="animate-page-enter" style={{ maxWidth: 480, margin: "0 auto", paddingBottom: "5rem" }}>
      {/* ── Slim header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1rem 0.75rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-brand)",
            fontWeight: 800,
            fontSize: "1.75rem",
            letterSpacing: "-0.02em",
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          Discover
        </h1>
        <NotificationBell initialCount={unreadCount} userId={user.id} />
      </header>

      {/* ── Objective toggle pills ──────────────────────────────────────────── */}
      <ObjectivePills
        topics={topics.map((t) => ({ slug: t.slug, name: t.name, icon: t.icon }))}
        activeSlug={active.slug}
      />

      {/* ── Per-objective subtitle ──────────────────────────────────────────── */}
      {subtitle && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--muted-foreground)",
            lineHeight: 1.5,
            padding: "0.5rem 1rem 0",
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* ── Feed / Stack for the active objective (swipe left/right to change) ── */}
      <DeckShell slugs={topics.map((t) => t.slug)} activeSlug={active.slug}>
        <DeckBody
          posts={posts}
          comments={comments}
          topMeta={topMeta}
          communityMeta={communityMeta}
          objectiveName={active.name}
          topicSlug={active.slug}
          currentUserId={user.id}
          lastCursor={lastCursor}
          initialHasMore={posts.length === INITIAL}
          empty={empty}
        />
      </DeckShell>
    </main>
  );
}
