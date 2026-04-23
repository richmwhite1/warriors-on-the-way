import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { PostCard } from "@/components/feed/post-card";
import { MissionPanel } from "@/components/home/mission-panel";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { requireUserProfile } from "@/lib/queries/users";
import { listUserCommunities, type UserMembership } from "@/lib/queries/communities";
import { getActiveMemberCount } from "@/lib/queries/members";
import { listPersonalFeed, getLatestParentPost } from "@/lib/queries/posts";
import { listCommentsByPostIds } from "@/lib/queries/comments";

export default async function HomePage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const [myCommunities, feedPosts, latestTransmission] = await Promise.all([
    listUserCommunities(user.id),
    listPersonalFeed(user.id),
    getLatestParentPost(),
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

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "0 1rem 6rem" }}>

        {/* ── Welcome Block ─────────────────────────────────────────────────── */}
        <div style={{ padding: "2rem 0 0" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              color: "#6b6456",
              fontSize: "1rem",
            }}
          >
            Welcome back,
          </p>
          <h1
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 900,
              textTransform: "uppercase",
              fontSize: "clamp(1.8rem, 5vw, 3rem)",
              color: "#1a1610",
              lineHeight: 1.05,
              letterSpacing: "0.04em",
            }}
          >
            {firstName}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              color: "#6b6456",
              fontSize: "1rem",
              marginTop: "0.5rem",
            }}
          >
            The path is walked together.
          </p>
        </div>

        <OrnamentalDivider />

        {/* ── Latest Transmission ───────────────────────────────────────────── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #ede9e1",
            borderTop: "2px solid #a07828",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <SectionLabel>Latest Transmission</SectionLabel>

          {latestTransmission ? (
            <>
              {latestTransmission.title && (
                <p
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#1a1610",
                    fontSize: "1.1rem",
                    letterSpacing: "0.04em",
                    marginBottom: "0.25rem",
                  }}
                >
                  {latestTransmission.title}
                </p>
              )}
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#c8c2b4", marginBottom: "0.75rem" }}>
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
                    fontStyle: "italic",
                    color: "#6b6456",
                    fontSize: "1rem",
                    lineHeight: 1.7,
                    marginBottom: "1rem",
                  }}
                >
                  {latestTransmission.body.slice(0, 220)}{latestTransmission.body.length > 220 ? "…" : ""}
                </p>
              )}
              <Link
                href="/community/warriors-on-the-way"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 12,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#a07828",
                  textDecoration: "none",
                }}
              >
                Read transmission →
              </Link>
            </>
          ) : (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
                color: "#c8c2b4",
                fontSize: "1rem",
              }}
            >
              No transmissions yet. Check back soon.
            </p>
          )}
        </div>

        {/* ── Your Communities ──────────────────────────────────────────────── */}
        <section style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <SectionLabel>Your Communities</SectionLabel>
            <Link
              href="/community"
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#c8c2b4",
                textDecoration: "none",
              }}
            >
              Browse all →
            </Link>
          </div>

          {myCommunities.length === 0 ? (
            <div
              style={{
                border: "1px dashed #ede9e1",
                padding: "2.5rem",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#1a1610",
                  marginBottom: "0.5rem",
                }}
              >
                No communities yet
              </p>
              <p style={{ fontFamily: "var(--font-body)", color: "#c8c2b4", fontSize: 15, marginBottom: "1rem" }}>
                Browse to find your group.
              </p>
              <Link
                href="/community"
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  background: "#1a1610",
                  padding: "0.75rem 1.75rem",
                  textDecoration: "none",
                  border: "1px solid #1a1610",
                  display: "inline-block",
                }}
              >
                Browse Communities
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
              }}
            >
              {myCommunities.map((m: UserMembership, i) => {
                const c = m.community;
                return (
                  <Link
                    key={c.id}
                    href={`/community/${c.slug}`}
                    style={{
                      minWidth: 200,
                      background: "#f8f7f4",
                      border: "1px solid #ede9e1",
                      borderTop: "2px solid #1a1610",
                      padding: "1.25rem",
                      textDecoration: "none",
                      flexShrink: 0,
                      display: "block",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-brand)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "#1a1610",
                        fontSize: "0.9rem",
                        letterSpacing: "0.04em",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {c.name}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#c8c2b4", marginBottom: "0.5rem" }}>
                      {myMemberCounts[i] ?? 0} members
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-brand)",
                          fontSize: 11,
                          color: "#a07828",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                        }}
                      >
                        {m.role}
                      </span>
                      <span style={{ color: "#a07828", fontSize: "1rem" }}>→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Activity Feed ─────────────────────────────────────────────────── */}
        {feedPosts.length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <SectionLabel>Across the Network</SectionLabel>
            <div>
              {feedPosts.map((post) => {
                const community = post.community as { name: string; slug: string } | undefined;
                return (
                  <div key={post.id}>
                    {community && (
                      <Link
                        href={`/community/${community.slug}`}
                        style={{
                          fontFamily: "var(--font-brand)",
                          fontSize: 12,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "#c8c2b4",
                          textDecoration: "none",
                          display: "inline-block",
                          marginBottom: "0.5rem",
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

        {/* ── Manifesto Accordion ───────────────────────────────────────────── */}
        <section>
          <SectionLabel>The Lightworkers Manifesto</SectionLabel>
          <MissionPanel />
        </section>

      </main>
    </>
  );
}
