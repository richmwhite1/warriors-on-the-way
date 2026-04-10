import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { JoinButton } from "@/components/community/join-button";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
import { FeedFilterBar } from "@/components/feed/feed-filter-bar";
import { EventCard } from "@/components/events/event-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug, getParentCommunity } from "@/lib/queries/communities";
import { getActiveMemberCount, getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listCommunityPosts, listParentPushPosts } from "@/lib/queries/posts";
import { listCommunityEvents } from "@/lib/queries/events";
import { listCommentsByPostIds } from "@/lib/queries/comments";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  return { title: community?.name ?? "Community" };
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { type: postTypeFilter } = await searchParams;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect(`/sign-in?next=/community/${slug}`);

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [membership, memberCount] = await Promise.all([
    getMembership(community.id, user.id),
    getActiveMemberCount(community.id),
  ]);

  const memberStatus = membership?.status ?? "none";
  const isAdmin = membership?.role === "admin" || membership?.role === "organizer";
  const isViewer = false; // viewer role not yet implemented
  const isMember = memberStatus === "active";
  const isFull = memberCount >= community.member_cap;

  const [communityPosts, parentPushPosts, communityEvents] = isMember
    ? await Promise.all([
        listCommunityPosts(community.id, user.id, postTypeFilter),
        community.is_parent ? [] : listParentPushPosts(user.id),
        listCommunityEvents(community.id),
      ])
    : [[], [], []];

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
      {community.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="w-full h-40 sm:h-56 overflow-hidden">
          <img src={community.banner_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-heading font-semibold">{community.name}</h1>
                {community.is_parent && <Badge variant="secondary">North Star</Badge>}
                {community.is_private && <Badge variant="outline">Private</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {memberCount} / {community.member_cap} members
                {isFull && <span className="ml-2 text-destructive font-medium">· Full</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isMember && (
                <Link href={`/community/${slug}/members`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Members
                </Link>
              )}
              {isMember && (
                <Link href="/resources" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Resources
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
              />
            </div>
          </div>
          {community.description && (
            <p className="text-muted-foreground text-sm">{community.description}</p>
          )}

          {/* Mission statement */}
          {community.mission && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mission</p>
              <p className="text-sm whitespace-pre-wrap">{community.mission}</p>
            </div>
          )}

          {/* Parent community: show rules inline */}
          {community.is_parent && community.rules_md && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Community Standards</p>
              <p className="text-sm whitespace-pre-wrap">{community.rules_md}</p>
            </div>
          )}

          {/* Child community: show parent rules collapsed */}
          {!community.is_parent && parentCommunity?.rules_md && (
            <details className="rounded-2xl border">
              <summary className="px-4 py-3 text-sm font-medium cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors">
                Community Standards ↓
              </summary>
              <div className="px-4 pb-4 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Standards all Warriors on the Way communities follow:</p>
                <p className="text-sm whitespace-pre-wrap">{parentCommunity.rules_md}</p>
              </div>
            </details>
          )}
        </div>

        <Separator />

        {isMember ? (
          <div className="space-y-4">
            {!isViewer && <PostComposer communityId={community.id} communitySlug={slug} isParentAdmin={isParentAdmin} />}
            {isViewer && (
              <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground text-center">
                You have view-only access to this community.
              </div>
            )}

            {/* Pinned post — always visible above filter */}
            {pinnedPost && (
              <PostCard
                post={pinnedPost}
                comments={commentsByPost[pinnedPost.id] ?? []}
                communitySlug={slug}
                currentUserId={user.id}
                isAdmin={isAdmin}
                isMember={isMember}
                isPinned
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
                    currentUserId={user.id}
                    isAdmin={isAdmin}
                    isMember={isMember}
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
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                {postTypeFilter
                  ? `No ${postTypeFilter} posts yet.`
                  : "No posts yet. Be the first to share something."}
              </div>
            ) : (
              feedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={commentsByPost[post.id] ?? []}
                  communitySlug={slug}
                  currentUserId={user.id}
                  isAdmin={isAdmin}
                  isMember={isMember}
                />
              ))
            )}
          </div>
        ) : memberStatus === "waitlisted" ? (
          <div className="rounded-2xl border p-8 text-center space-y-2">
            <p className="font-heading font-semibold">You&apos;re on the waitlist</p>
            <p className="text-sm text-muted-foreground">We&apos;ll let you know when a spot opens up.</p>
          </div>
        ) : memberStatus === "pending_approval" ? (
          <div className="rounded-2xl border p-8 text-center space-y-2">
            <p className="font-heading font-semibold">Request pending</p>
            <p className="text-sm text-muted-foreground">An admin will review your request shortly.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            Join this community to see its wall.
          </div>
        )}
      </main>
    </>
  );
}
