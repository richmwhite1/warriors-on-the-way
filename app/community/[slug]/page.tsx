// Sean's YouTube channel ID — set this once you have the channel URL
// Find it at: youtube.com/@channelname → view source → look for "channelId"
const SEAN_YOUTUBE_CHANNEL_ID = "UCSEABr_YYaS6MLSAXE6Tuzw";

async function getLatestYouTubeVideoId(channelId: string): Promise<string | null> {
  if (!channelId) return null;
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } } // re-fetch at most once per hour
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const match = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { JoinButton } from "@/components/community/join-button";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
import { FeedFilterBar } from "@/components/feed/feed-filter-bar";
import { EventCard } from "@/components/events/event-card";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug, getParentCommunity, listUserCommunities } from "@/lib/queries/communities";
import { ConsciousnessSidebar } from "@/components/community/consciousness-sidebar";
import { getActiveMemberCount, getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listCommunityPosts, listParentPushPosts } from "@/lib/queries/posts";
import { listCommunityEvents } from "@/lib/queries/events";
import { listCommentsByPostIds } from "@/lib/queries/comments";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; invite?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  return { title: community?.name ?? "Community" };
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { type: postTypeFilter, invite: inviteToken } = await searchParams;

  const user = await requireUserProfile().catch(() => null);

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [membership, memberCount, latestVideoId] = await Promise.all([
    user ? getMembership(community.id, user.id) : Promise.resolve(null),
    getActiveMemberCount(community.id),
    community.is_parent ? getLatestYouTubeVideoId(SEAN_YOUTUBE_CHANNEL_ID) : Promise.resolve(null),
  ]);

  const memberStatus = membership?.status ?? "none";
  const isAdmin = membership?.role === "admin" || membership?.role === "organizer";
  const isViewer = false; // viewer role not yet implemented
  const isMember = memberStatus === "active";
  const isFull = memberCount >= (community.member_cap ?? 150);

  const [communityPosts, parentPushPosts, communityEvents, userMemberships] = (isMember && user)
    ? await Promise.all([
        listCommunityPosts(community.id, user.id, postTypeFilter),
        community.is_parent ? [] : listParentPushPosts(user.id),
        listCommunityEvents(community.id),
        listUserCommunities(user.id),
      ])
    : [[], [], [], []];

  const userCommunities = (userMemberships as Awaited<ReturnType<typeof listUserCommunities>>)
    .map((m) => ({ id: m.community.id, name: m.community.name, slug: m.community.slug }));

  const parentCommunity = (isMember && !community.is_parent)
    ? await getParentCommunity()
    : null;

  // Pinned post always shows above the filter bar, regardless of active filter
  const pinnedPost = communityPosts.find((p) => p.is_pinned) ?? null;
  const feedPosts = communityPosts.filter((p) => !p.is_pinned);
  const allPosts = [...parentPushPosts, ...feedPosts];
  const isEmpty = allPosts.length === 0 && communityEvents.length === 0;

  // Single bulk query for all comments instead of N+1
  const allPostsForComments = pinnedPost ? [pinnedPost, ...allPosts] : allPosts;
  const commentsByPost = isMember && allPostsForComments.length > 0
    ? await listCommentsByPostIds(allPostsForComments.map((p) => p.id))
    : {};

  const isParentAdmin = isAdmin && community.is_parent;

  const joinStatus = (memberStatus === "none" ? "none" : memberStatus) as
    "none" | "active" | "waitlisted" | "pending_approval" | "banned";

  return (
    <>
      <AppNav />
      <ConsciousnessSidebar />
      <div style={{ height: 60 }} />

      {/* ── Community Header (dark band) ───────────────────────────────────── */}
      {community.is_parent ? (
        <div
          style={{
            background: "#1a1610",
            padding: "4rem 2rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 80% 100% at 50% 110%, rgba(160,120,40,0.12) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                fontFamily: "var(--font-brand)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#a07828",
                marginBottom: "1rem",
              }}
            >
              Another name for lightworkers
            </p>
            <h1
              style={{
                fontFamily: "var(--font-brand)",
                fontWeight: 900,
                fontSize: "clamp(2rem, 6vw, 4rem)",
                color: "#ffffff",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                lineHeight: 1,
                marginBottom: "1rem",
              }}
            >
              Warriors on the Way
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.45)",
                fontSize: "1rem",
              }}
            >
              {memberCount} {memberCount === 1 ? "member" : "members"}
              {isFull && <span style={{ marginLeft: "0.5rem", color: "#c4a050" }}>· Full</span>}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#1a1610",
            padding: "4rem 2rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {community.banner_url && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex: 0,
                opacity: 0.2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={community.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
            <h1
              style={{
                fontFamily: "var(--font-brand)",
                fontWeight: 900,
                fontSize: "clamp(1.6rem, 4vw, 3rem)",
                color: "#ffffff",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                lineHeight: 1.05,
                marginBottom: "0.75rem",
              }}
            >
              {community.name}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.45)",
                fontSize: "1rem",
              }}
            >
              {memberCount} / {community.member_cap} {memberCount === 1 ? "member" : "members"}
              {isFull && <span style={{ marginLeft: "0.5rem", color: "#c4a050" }}>· Full</span>}
              {community.is_private && <span style={{ marginLeft: "0.5rem" }}>· Private</span>}
            </p>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
              {isMember && (
                <Link href={`/community/${slug}/members`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Members
                </Link>
              )}
{isAdmin && (
                <Link href={`/community/${slug}/settings`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Settings
                </Link>
              )}
              <JoinButton
                communityId={community.id}
                communitySlug={slug}
                status={joinStatus}
                isFull={isFull}
                inviteToken={inviteToken}
              />
          </div>
          {community.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
                color: "#c8c2b4",
                fontSize: "1rem",
              }}
            >
              {community.description}
            </p>
          )}

          {/* Mission statement — collapsible */}
          {community.mission && (
            <details style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <summary
                style={{
                  padding: "0.75rem 1rem",
                  fontFamily: "var(--font-brand)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#c8c2b4",
                  cursor: "pointer",
                }}
              >
                Mission ↓
              </summary>
              <div style={{ padding: "0.75rem 1rem 1rem", borderTop: "1px solid rgba(255,255,255,0.1)", background: "#2e2820" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", whiteSpace: "pre-wrap", color: "#c8c2b4" }}>{community.mission}</p>
              </div>
            </details>
          )}

          {/* Parent community: show rules collapsed */}
          {community.is_parent && community.rules_md && (
            <details style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <summary style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-brand)", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8c2b4", cursor: "pointer" }}>
                Community Standards ↓
              </summary>
              <div style={{ padding: "0.75rem 1rem 1rem", borderTop: "1px solid rgba(255,255,255,0.1)", background: "#2e2820" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "#c8c2b4" }}>{community.rules_md}</p>
              </div>
            </details>
          )}

          {/* Child community: show parent rules collapsed */}
          {!community.is_parent && parentCommunity?.rules_md && (
            <details style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <summary style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-brand)", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8c2b4", cursor: "pointer" }}>
                Community Standards ↓
              </summary>
              <div style={{ padding: "0.75rem 1rem 1rem", borderTop: "1px solid rgba(255,255,255,0.1)", background: "#2e2820" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>Standards all Warriors on the Way communities follow:</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "#c8c2b4" }}>{parentCommunity.rules_md}</p>
              </div>
            </details>
          )}

          {/* Latest video from Seán — only on the parent (Warriors on the Way) community */}
          {community.is_parent && latestVideoId && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ fontFamily: "var(--font-brand)", fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#a07828", marginBottom: "0.75rem" }}>Latest from Seán</p>
              <div className="aspect-video overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${latestVideoId}`}
                  title="Latest video from Seán Ó'Laoire"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "1rem 0" }} />

        {isMember ? (
          <div className="space-y-4">
            {!isViewer && (
              <PostComposer
                communityId={community.id}
                communitySlug={slug}
                isParentAdmin={isParentAdmin}
                userAvatar={user?.avatar_url}
                userName={user?.display_name}
              />
            )}
            {isViewer && (
              <div style={{ border: "1px dashed rgba(255,255,255,0.1)", padding: "0.75rem 1rem", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "#6b6456", fontSize: "0.9rem" }}>You have view-only access to this community.</p>
              </div>
            )}

            {/* Pinned post — always visible above filter */}
            {pinnedPost && (
              <PostCard
                post={pinnedPost}
                comments={commentsByPost[pinnedPost.id] ?? []}
                communitySlug={slug}
                currentUserId={user?.id ?? ""}
                isAdmin={isAdmin}
                isMember={isMember}
                isPinned
                userCommunities={userCommunities}
              />
            )}

            {/* Filter bar */}
            <Suspense>
              <FeedFilterBar />
            </Suspense>

            {/* Parent push posts */}
            {parentPushPosts.length > 0 && (
              <div className="space-y-3">
                {parentPushPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    comments={commentsByPost[post.id] ?? []}
                    communitySlug={slug}
                    currentUserId={user?.id ?? ""}
                    isAdmin={isAdmin}
                    isMember={isMember}
                    userCommunities={userCommunities}
                  />
                ))}
                {feedPosts.length > 0 && <Separator />}
              </div>
            )}

            {/* Events from events table */}
            {communityEvents.length > 0 && (
              <div className="space-y-3">
                {communityEvents.map((event) => (
                  <EventCard key={event.id} event={event} communitySlug={slug} />
                ))}
                {feedPosts.length > 0 && <Separator />}
              </div>
            )}

            {isEmpty ? (
              <div style={{ border: "1px dashed rgba(255,255,255,0.1)", padding: "3rem 2rem", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "#6b6456" }}>
                  {postTypeFilter
                    ? `The space is quiet here. Be the first to share a ${postTypeFilter}.`
                    : "The space is quiet. What truth wants to emerge?"}
                </p>
              </div>
            ) : (
              feedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={commentsByPost[post.id] ?? []}
                  communitySlug={slug}
                  currentUserId={user?.id ?? ""}
                  isAdmin={isAdmin}
                  isMember={isMember}
                  userCommunities={userCommunities}
                />
              ))
            )}
          </div>
        ) : memberStatus === "waitlisted" ? (
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f8f7f4", marginBottom: "0.5rem" }}>You&apos;re on the waitlist</p>
            <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "#c8c2b4", fontSize: "1rem" }}>We&apos;ll let you know when a spot opens up.</p>
          </div>
        ) : memberStatus === "pending_approval" ? (
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f8f7f4", marginBottom: "0.5rem" }}>Request pending</p>
            <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "#c8c2b4", fontSize: "1rem" }}>An admin will review your request shortly.</p>
          </div>
        ) : (
          <div style={{ position: "relative", minHeight: 280, overflow: "hidden" }}>
            {/* Ghost posts behind the blur */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 80,
                  margin: "0.5rem 0",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              />
            ))}
            {/* Frosted overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                background: "rgba(26,22,16,0.75)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-brand)",
                  fontSize: 9,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "#c4a050",
                }}
              >
                Members Only
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontStyle: "italic",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "0.95rem",
                }}
              >
                Join to see the community wall
              </p>
              <JoinButton
                communityId={community.id}
                communitySlug={slug}
                status={joinStatus}
                isFull={isFull}
                inviteToken={inviteToken}
              />
              {!user && (
                <Link
                  href={`/sign-in?next=/community/${slug}`}
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#6b6456",
                    textDecoration: "none",
                  }}
                >
                  Already a member? Sign in →
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
