import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { PostCard } from "@/components/feed/post-card";
import { MissionPanel } from "@/components/home/mission-panel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { requireUserProfile } from "@/lib/queries/users";
import { listUserCommunities, getParentCommunity, type UserMembership } from "@/lib/queries/communities";
import { getActiveMemberCount } from "@/lib/queries/members";
import { listPersonalFeed, getLatestParentPost } from "@/lib/queries/posts";
import { listUpcomingEventsForUser } from "@/lib/queries/events";
import { listCommentsByPostIds } from "@/lib/queries/comments";
import { TelegramJoinBanner } from "@/components/telegram-join-banner";

export default async function HomePage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const [myCommunities, feedPosts, latestTransmission, upcomingEvents, parentCommunity] = await Promise.all([
    listUserCommunities(user.id),
    listPersonalFeed(user.id),
    getLatestParentPost(),
    listUpcomingEventsForUser(user.id),
    getParentCommunity(),
  ]);

  const myMemberCounts = await Promise.all(
    myCommunities.map((m) => getActiveMemberCount(m.community.id))
  );

  const commentsByPost = feedPosts.length > 0
    ? await listCommentsByPostIds(feedPosts.map((p) => p.id))
    : {};

  const userCommunities = myCommunities.map((m) => ({
    id: m.community.id,
    name: m.community.name,
    slug: m.community.slug,
  }));

  const firstName = user.display_name.split(" ")[0];

  return (
    <>
      <AppNav />

      <main className="animate-page-enter" style={{ maxWidth: 680, margin: "0 auto", padding: "0 1rem 6rem" }}>

        {/* ── Welcome Block ─────────────────────────────────────────────────── */}
        <div style={{ padding: "1.5rem 0 0" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "#7c7589",
              fontSize: "0.9rem",
              fontWeight: 500,
              marginBottom: "0.15rem",
            }}
          >
            Welcome back,
          </p>
          <h1
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 800,
              fontSize: "clamp(1.6rem, 5vw, 2.2rem)",
              color: "#1a1a2e",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {firstName}
          </h1>
        </div>

        {/* ── Upcoming Events (FIRST — the heartbeat) ─────────────────────── */}
        <section style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <SectionLabel>Upcoming Events</SectionLabel>
            {myCommunities.length > 0 && (
              <Link
                href={
                  myCommunities.length === 1
                    ? `/community/${myCommunities[0].community.slug}/events/new`
                    : "/community"
                }
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ffffff",
                  background: "#e07040",
                  padding: "0.4rem 0.9rem",
                  borderRadius: "9999px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                + Create
              </Link>
            )}
          </div>

          {upcomingEvents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {upcomingEvents.map((event) => {
                const startsAt = event.starts_at ? new Date(event.starts_at) : null;
                return (
                  <Link
                    key={event.id}
                    href={`/community/${event.community_slug}/events/${event.id}`}
                    style={{
                      display: "flex",
                      gap: "0.85rem",
                      alignItems: "flex-start",
                      background: "#ffffff",
                      border: "1px solid #e8e2da",
                      borderRadius: "1rem",
                      padding: "0.9rem 1rem",
                      textDecoration: "none",
                      transition: "box-shadow 0.15s, transform 0.15s",
                    }}
                    className="hover:shadow-md press-scale"
                  >
                    {/* Date chip */}
                    {startsAt && (
                      <div
                        style={{
                          flexShrink: 0,
                          width: 52,
                          textAlign: "center",
                          background: "#fff5f0",
                          borderRadius: "0.75rem",
                          padding: "0.5rem 0.25rem",
                        }}
                      >
                        <p style={{
                          fontFamily: "var(--font-brand)",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#e07040",
                          textTransform: "uppercase",
                          lineHeight: 1,
                        }}>
                          {startsAt.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-brand)",
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#1a1a2e",
                          lineHeight: 1.2,
                        }}>
                          {startsAt.getDate()}
                        </p>
                      </div>
                    )}

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        fontFamily: "var(--font-brand)",
                        fontWeight: 700,
                        color: "#1a1a2e",
                        fontSize: "0.95rem",
                        lineHeight: 1.3,
                        marginBottom: "0.2rem",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}>
                        {event.title}
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#7c7589", lineHeight: 1.4 }}>
                        {startsAt
                          ? startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                          : "Date TBD"}
                        {event.location && ` \u00b7 ${event.location}`}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#e07040",
                            background: "#fff5f0",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "9999px",
                          }}
                        >
                          {event.community_name}
                        </span>
                        {event.rsvp_counts && event.rsvp_counts.yes > 0 && (
                          <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "#16a34a" }}>
                            {event.rsvp_counts.yes} going
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                border: "2px dashed #e8e2da",
                borderRadius: "1rem",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: "0.95rem", color: "#1a1a2e", marginBottom: "0.25rem" }}>
                Nothing on the calendar yet
              </p>
              <p style={{ fontFamily: "var(--font-body)", color: "#7c7589", fontSize: 14, marginBottom: "1rem" }}>
                The room is waiting. Call your people together.
              </p>
              {myCommunities.length > 0 && (
                <Link
                  href={
                    myCommunities.length === 1
                      ? `/community/${myCommunities[0].community.slug}/events/new`
                      : "/community"
                  }
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#ffffff",
                    background: "#e07040",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "9999px",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Create an event
                </Link>
              )}
            </div>
          )}
        </section>

        {/* ── Your Communities ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <SectionLabel>Your Groups</SectionLabel>
            <Link
              href="/community"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "#e07040",
                textDecoration: "none",
              }}
            >
              See all
            </Link>
          </div>

          {myCommunities.length === 0 ? (
            <div
              style={{
                border: "2px dashed #e8e2da",
                borderRadius: "1rem",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <p style={{
                fontFamily: "var(--font-brand)",
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#1a1a2e",
                marginBottom: "0.25rem",
              }}>
                No groups yet
              </p>
              <p style={{ fontFamily: "var(--font-body)", color: "#7c7589", fontSize: 14, marginBottom: "1rem" }}>
                Find your people and join a group.
              </p>
              <Link
                href="/community"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#ffffff",
                  background: "#e07040",
                  padding: "0.6rem 1.5rem",
                  borderRadius: "9999px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Browse Groups
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
                maskImage: "linear-gradient(to right, black 85%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, black 85%, transparent)",
              }}
              className="no-scrollbar"
            >
              {myCommunities.map((m: UserMembership, i) => {
                const c = m.community;
                return (
                  <Link
                    key={c.id}
                    href={`/community/${c.slug}`}
                    style={{
                      minWidth: 160,
                      background: "#ffffff",
                      border: "1px solid #e8e2da",
                      borderRadius: "1rem",
                      padding: "1rem",
                      textDecoration: "none",
                      flexShrink: 0,
                      display: "block",
                      transition: "box-shadow 0.15s",
                    }}
                    className="hover:shadow-md"
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-brand)",
                        fontWeight: 700,
                        color: "#1a1a2e",
                        fontSize: "0.9rem",
                        marginBottom: "0.2rem",
                        lineHeight: 1.3,
                      }}
                    >
                      {c.name}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#7c7589" }}>
                      {myMemberCounts[i] ?? 0} members
                    </p>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "0.5rem",
                        fontFamily: "var(--font-body)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#e07040",
                        background: "#fff5f0",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "9999px",
                        textTransform: "capitalize",
                      }}
                    >
                      {m.role}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Latest Update ────────────────────────────────────────────────── */}
        {latestTransmission && (
          <section style={{ marginBottom: "1.5rem" }}>
            <SectionLabel>Latest Update</SectionLabel>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e2da",
                borderRadius: "1rem",
                padding: "1.25rem",
              }}
            >
              {latestTransmission.title && (
                <p
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontWeight: 700,
                    color: "#1a1a2e",
                    fontSize: "1rem",
                    marginBottom: "0.25rem",
                    lineHeight: 1.3,
                  }}
                >
                  {latestTransmission.title}
                </p>
              )}
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#7c7589", marginBottom: "0.5rem" }}>
                {new Date(latestTransmission.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {latestTransmission.body && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "#4a4458",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    marginBottom: "0.75rem",
                  }}
                >
                  {latestTransmission.body.slice(0, 220)}{latestTransmission.body.length > 220 ? "\u2026" : ""}
                </p>
              )}
              <Link
                href="/community/warriors-on-the-way"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#e07040",
                  textDecoration: "none",
                }}
              >
                Read more &rarr;
              </Link>
            </div>
          </section>
        )}

        {/* ── Activity Feed ─────────────────────────────────────────────────── */}
        {feedPosts.length > 0 && (
          <section style={{ marginBottom: "1.5rem" }}>
            <SectionLabel>Activity</SectionLabel>
            <div className="space-y-3">
              {feedPosts.map((post) => {
                const community = post.community as { name: string; slug: string } | undefined;
                return (
                  <div key={post.id}>
                    {community && (
                      <Link
                        href={`/community/${community.slug}`}
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#e07040",
                          textDecoration: "none",
                          display: "inline-block",
                          marginBottom: "0.35rem",
                        }}
                      >
                        {community.name}
                      </Link>
                    )}
                    <PostCard
                      post={post}
                      comments={commentsByPost[post.id] ?? []}
                      communitySlug={community?.slug ?? ""}
                      currentUserId={user.id}
                      isAdmin={false}
                      isMember={true}
                      userCommunities={userCommunities}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Mission ─────────────────────────────────────────────────────── */}
        <section>
          <SectionLabel>Our Mission</SectionLabel>
          <MissionPanel />
        </section>

      </main>

      {parentCommunity?.telegram_invite_link && (
        <TelegramJoinBanner
          telegramUrl={parentCommunity.telegram_invite_link}
          communityName={parentCommunity.name}
          communityId={parentCommunity.id}
        />
      )}
    </>
  );
}
