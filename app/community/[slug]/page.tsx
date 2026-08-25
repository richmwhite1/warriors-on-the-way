import Image from "next/image";
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
import { getCommunityBySlug, getCommunityBySlugPublic, getCommunityAdminSecrets, getParentCommunity, listUserCommunities } from "@/lib/queries/communities";
import { CommunityShareButton, RecruitProgress } from "@/components/community/community-share";
import { getCommunityTopics } from "@/lib/queries/topics";
import { ConsciousnessSidebar } from "@/components/community/consciousness-sidebar";
import { getActiveMemberCount, getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listCommunityPosts, listParentPushPosts } from "@/lib/queries/posts";
import { listCommunityEvents } from "@/lib/queries/events";
import { listCommentsByPostIds } from "@/lib/queries/comments";
import { fetchLatestChannelVideo } from "@/lib/integrations/youtube";
import { TelegramJoinBanner } from "@/components/telegram-join-banner";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; invite?: string; created?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  // Use the public (admin) lookup so a link shared into a group chat previews
  // richly even for logged-out recipients and private communities.
  const community = await getCommunityBySlugPublic(slug);
  if (!community) return { title: "Community" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const url = `${siteUrl}/community/${slug}`;
  const memberCount = await getActiveMemberCount(community.id).catch(() => 0);

  // Warm, plain-language description with light social proof.
  const parts: string[] = [];
  if (community.location) parts.push(community.location);
  if (memberCount > 0) parts.push(`${memberCount} ${memberCount === 1 ? "member" : "members"}`);
  const metaLine = parts.join(" · ");
  const blurb = community.description?.trim() || community.mission?.trim() || "";
  const description =
    [metaLine, blurb].filter(Boolean).join(" — ").slice(0, 200) ||
    `Join ${community.name} — a Warriors on the Way community.`;

  return {
    title: community.name,
    description,
    openGraph: {
      title: `Join ${community.name}`,
      description,
      url,
      type: "website" as const,
      images: [
        {
          url: `${siteUrl}/community/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: community.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `Join ${community.name}`,
      description,
      images: [`${siteUrl}/community/${slug}/opengraph-image`],
    },
  };
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { type: postTypeFilter, invite: inviteToken, created: justCreated } = await searchParams;

  const user = await requireUserProfile().catch(() => null);

  // Guests arriving via a shared invite link need the public (admin) lookup so the
  // preview + join path render even for private communities — not a login wall.
  const community = user
    ? await getCommunityBySlug(slug)
    : await getCommunityBySlugPublic(slug);
  if (!community) notFound();

  const [membership, memberCount, latestVideo] = await Promise.all([
    user ? getMembership(community.id, user.id) : Promise.resolve(null),
    getActiveMemberCount(community.id),
    community.is_parent ? fetchLatestChannelVideo() : Promise.resolve(null),
  ]);
  const latestVideoId = latestVideo?.videoId ?? null;

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

  // Topics this community is tagged to — powers the author cross-post prompt.
  const communityTopics = isMember ? await getCommunityTopics(community.id) : [];

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
  const canCreate = isAdmin || community.members_can_create_events;

  // Growth loop: while a community is still forming (under the five-member go-live
  // threshold) stewards get a celebrated "recruit your first four" panel. Admins
  // also get the instant-join invite token so their shared links join in one tap;
  // regular members share the plain link (public communities join directly).
  const GO_LIVE_AT = 5;
  const isForming = !community.is_parent && memberCount < GO_LIVE_AT;
  const communityInviteToken = isAdmin
    ? (await getCommunityAdminSecrets(community.id)).invite_token
    : null;
  const inviterName = user?.display_name ?? "";
  const communityPath = `/community/${slug}`;

  const evNow = new Date();
  const upcomingEvs = (communityEvents as typeof communityEvents).filter((e) => e.status !== "cancelled" && (!e.starts_at || new Date(e.starts_at) >= evNow));

  const joinStatus = (memberStatus === "none" ? "none" : memberStatus) as
    "none" | "active" | "waitlisted" | "pending_approval" | "banned";

  return (
    <>
      <AppNav />
      <ConsciousnessSidebar />

      {/* ── Community Header ────────────────────────────────────────────────── */}
      {community.is_parent ? (
        <div
          style={{
            background: "#1a1610",
            padding: "3rem 1.5rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            borderRadius: "0 0 1.5rem 1.5rem",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 80% 100% at 50% 110%, rgba(224,112,64,0.12) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--primary)",
                marginBottom: "0.75rem",
              }}
            >
              Another name for lightworkers
            </p>
            <h1
              style={{
                fontFamily: "var(--font-brand)",
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 6vw, 3rem)",
                color: "#ffffff",
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
                marginBottom: "0.75rem",
              }}
            >
              Warriors on the Way
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.9rem",
              }}
            >
              {memberCount} {memberCount === 1 ? "member" : "members"}
              {isFull && <span style={{ marginLeft: "0.5rem", color: "var(--primary)" }}>· Full</span>}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#1a1610",
            padding: "3rem 1.5rem",
            position: "relative",
            overflow: "hidden",
            borderRadius: "0 0 1.5rem 1.5rem",
          }}
        >
          {community.banner_url && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                zIndex: 0,
                opacity: 0.25,
              }}
            >
              <Image
                src={community.banner_url}
                alt={`${community.name} banner`}
                fill
                sizes="100vw"
                preload
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
          <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
            <h1
              style={{
                fontFamily: "var(--font-brand)",
                fontWeight: 800,
                fontSize: "clamp(1.5rem, 4vw, 2.4rem)",
                color: "#ffffff",
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
                marginBottom: "0.5rem",
              }}
            >
              {community.name}
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.9rem",
              }}
            >
              {memberCount} / {community.member_cap} {memberCount === 1 ? "member" : "members"}
              {isFull && <span style={{ marginLeft: "0.5rem", color: "var(--primary)" }}>· Full</span>}
              {community.is_private && <span style={{ marginLeft: "0.5rem" }}>· Private</span>}
            </p>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-page-enter">
        <div className="space-y-3">
          {/* Recruit-your-first-four — celebrated growth nudge while forming */}
          {isAdmin && isForming && (
            <RecruitProgress
              communityName={community.name}
              communityUrl={communityPath}
              inviterName={inviterName}
              inviteToken={communityInviteToken}
              memberCount={memberCount}
              threshold={GO_LIVE_AT}
              autoOpen={justCreated === "1"}
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
              {isMember && (
                <Link href={`/community/${slug}/members`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Members
                </Link>
              )}
              {isMember && (
                <Link href={`/community/${slug}/events`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Events
                </Link>
              )}
              {isMember && (
                <Link href={`/community/${slug}/asks`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Ask &amp; Offer
                </Link>
              )}
              {canCreate && (
                <Link href={`/community/${slug}/events/new`} className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
                  + New event
                </Link>
              )}
              {isMember && (
                <Link href={`/community/${slug}/offerings/new`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
                  + New offering
                </Link>
              )}
              {isAdmin && (
                <Link href={`/community/${slug}/related`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Related
                </Link>
              )}
              {isAdmin && (
                <Link href={`/community/${slug}/moderation`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Moderation
                </Link>
              )}
              {isAdmin && (
                <Link href={`/community/${slug}/settings`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Settings
                </Link>
              )}
              {isMember && !community.is_parent && (
                <CommunityShareButton
                  communityName={community.name}
                  communityUrl={communityPath}
                  inviterName={inviterName}
                  inviteToken={communityInviteToken}
                />
              )}
              <JoinButton
                communityId={community.id}
                communitySlug={slug}
                status={joinStatus}
                isFull={isFull}
                inviteToken={inviteToken}
                role={membership?.role}
              />
          </div>

          {/* Post composer — right at the top, Facebook-style */}
          {isMember && !isViewer && (
            <PostComposer
              communityId={community.id}
              communitySlug={slug}
              isParentAdmin={isParentAdmin}
              userAvatar={user?.avatar_url}
              userName={user?.display_name}
            />
          )}
          {isMember && isViewer && (
            <div style={{ border: "1px dashed rgba(255,255,255,0.1)", padding: "0.75rem 1rem", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "var(--muted-foreground)", fontSize: "0.9rem" }}>You have view-only access to this community.</p>
            </div>
          )}

          {/* Non-members see the pitch up top; members get it tucked into About below the feed */}
          {!isMember && community.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--muted-foreground)",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              {community.description}
            </p>
          )}

          {/* Mission statement — collapsible */}
          {!isMember && community.mission && (
            <details className="rounded-xl border overflow-hidden">
              <summary
                style={{
                  padding: "0.75rem 1rem",
                  fontFamily: "var(--font-brand)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  cursor: "pointer",
                }}
              >
                Mission
              </summary>
              <div style={{ padding: "0.75rem 1rem 1rem", borderTop: "1px solid var(--border)", background: "#f5f0eb" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "#4a4458" }}>{community.mission}</p>
              </div>
            </details>
          )}

          {/* Parent community: show rules collapsed */}
          {!isMember && community.is_parent && community.rules_md && (
            <details className="rounded-xl border overflow-hidden">
              <summary style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 600, color: "var(--foreground)", cursor: "pointer" }}>
                Community Standards
              </summary>
              <div style={{ padding: "0.75rem 1rem 1rem", borderTop: "1px solid var(--border)", background: "#f5f0eb" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "#4a4458" }}>{community.rules_md}</p>
              </div>
            </details>
          )}

          {/* Child community: show parent rules collapsed */}
          {!isMember && !community.is_parent && parentCommunity?.rules_md && (
            <details style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              <summary style={{ padding: "0.75rem 1rem", fontFamily: "var(--font-brand)", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)", cursor: "pointer" }}>
                Community Standards ↓
              </summary>
              <div style={{ padding: "0.75rem 1rem 1rem", borderTop: "1px solid rgba(255,255,255,0.1)", background: "#1a1a2e" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>Standards all Warriors on the Way communities follow:</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "var(--muted-foreground)" }}>{parentCommunity.rules_md}</p>
              </div>
            </details>
          )}

        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "1rem 0" }} />

        {isMember ? (
          <div className="space-y-4">
            {/* ── Upcoming Events ─────────────────────────────────────────────── */}
            {(upcomingEvs.length > 0 || canCreate) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming Events</p>
                  {canCreate && (
                    <Link href={`/community/${slug}/events/new`} className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
                      + New event
                    </Link>
                  )}
                </div>
                {upcomingEvs.length > 0 ? (
                  upcomingEvs.slice(0, 3).map((event) => (
                    <EventCard key={event.id} event={event} communitySlug={slug} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
                )}
                <Link
                  href={`/community/${slug}/events`}
                  className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  View all events →
                </Link>
                <Separator />
              </div>
            )}

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

            <Suspense>
              <FeedFilterBar />
            </Suspense>

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

            {allPosts.length === 0 ? (
              <div style={{ border: "1px dashed rgba(255,255,255,0.1)", padding: "3rem 2rem", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "var(--muted-foreground)" }}>
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
                  communityTopics={communityTopics}
                />
              ))
            )}

            {/* ── Latest from Seán (parent community only) ────────────────────── */}
            {community.is_parent && latestVideoId && (
              <div className="space-y-3">
                <Separator />
                <p style={{ fontFamily: "var(--font-brand)", fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--primary)" }}>Latest from Seán</p>
                <div className="aspect-video overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
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

            {/* ── About (collapsed, bottom of feed) ───────────────────────────── */}
            {(community.description || community.mission || community.rules_md || parentCommunity?.rules_md) && (
              <details className="rounded-xl border overflow-hidden">
                <summary
                  style={{
                    padding: "0.75rem 1rem",
                    fontFamily: "var(--font-brand)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--foreground)",
                    cursor: "pointer",
                  }}
                >
                  About this community
                </summary>
                <div style={{ padding: "0.75rem 1rem 1rem", borderTop: "1px solid var(--border)", background: "#f5f0eb" }} className="space-y-3">
                  {community.description && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", lineHeight: 1.6, color: "#4a4458" }}>{community.description}</p>
                  )}
                  {community.mission && (
                    <div>
                      <p style={{ fontFamily: "var(--font-brand)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--foreground)", marginBottom: "0.25rem" }}>Mission</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "#4a4458" }}>{community.mission}</p>
                    </div>
                  )}
                  {(community.is_parent ? community.rules_md : parentCommunity?.rules_md) && (
                    <div>
                      <p style={{ fontFamily: "var(--font-brand)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--foreground)", marginBottom: "0.25rem" }}>Community Standards</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "#4a4458" }}>
                        {community.is_parent ? community.rules_md : parentCommunity?.rules_md}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        ) : memberStatus === "waitlisted" ? (
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f5f0eb", marginBottom: "0.5rem" }}>You&apos;re on the waitlist</p>
            <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "var(--muted-foreground)", fontSize: "1rem", marginBottom: "1rem" }}>We&apos;ll let you know when a spot opens up.</p>
            <Link
              href="/community"
              style={{ fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
            >
              Find another group near you →
            </Link>
          </div>
        ) : memberStatus === "pending_approval" ? (
          <div style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "3rem 2rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f5f0eb", marginBottom: "0.5rem" }}>Request pending</p>
            <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", color: "var(--muted-foreground)", fontSize: "1rem" }}>An admin will review your request shortly.</p>
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
                  color: "var(--primary)",
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
                role={membership?.role}
              />
              {!user && (
                <Link
                  href={`/sign-in?next=/community/${slug}`}
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: 9,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--muted-foreground)",
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

      {isMember && community.telegram_invite_link && (
        <TelegramJoinBanner
          telegramUrl={community.telegram_invite_link}
          communityName={community.name}
          communityId={community.id}
        />
      )}
    </>
  );
}
