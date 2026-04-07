import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { JoinButton } from "@/components/community/join-button";
import { PostComposer } from "@/components/feed/post-composer";
import { PostCard } from "@/components/feed/post-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getActiveMemberCount, getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listCommunityPosts, listParentPushPosts } from "@/lib/queries/posts";
import { listCommentsByPostIds } from "@/lib/queries/comments";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  return { title: community?.name ?? "Community" };
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [membership, memberCount] = await Promise.all([
    getMembership(community.id, user.id),
    getActiveMemberCount(community.id),
  ]);

  const memberStatus = membership?.status ?? "none";
  const isAdmin = membership?.role === "admin" || membership?.role === "organizer";
  const isViewer = membership?.role === "viewer";
  const isMember = memberStatus === "active";
  const isFull = memberCount >= community.member_cap;

  const [communityPosts, parentPushPosts] = isMember
    ? await Promise.all([
        listCommunityPosts(community.id, user.id),
        community.is_parent ? [] : listParentPushPosts(user.id),
      ])
    : [[], []];

  const allPosts = [...parentPushPosts, ...communityPosts];

  // Single bulk query for all comments instead of N+1
  const commentsByPost = isMember && allPosts.length > 0
    ? await listCommentsByPostIds(allPosts.map((p) => p.id))
    : {};

  const isParentAdmin = isAdmin && community.is_parent;

  // Treat "left" the same as "none" for the join button
  const joinStatus = (memberStatus === "left" ? "none" : memberStatus) as
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
            <div className="flex items-center gap-2">
              {isMember && (
                <>
                  <Link href={`/community/${slug}/events`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Events
                  </Link>
                  <Link href={`/community/${slug}/members`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Members
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link href={`/community/${slug}/settings`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Settings
                </Link>
              )}
              <JoinButton
                communityId={community.id}
                communitySlug={slug}
                communityName={community.name}
                isPrivate={community.is_private}
                status={joinStatus}
                isFull={isFull}
              />
            </div>
          </div>
          {community.description && (
            <p className="text-muted-foreground text-sm">{community.description}</p>
          )}
          {community.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>📍</span> {community.location}
            </p>
          )}
          {isMember && community.telegram_invite_link && (
            <a
              href={community.telegram_invite_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#229ED9] hover:underline"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              Get updates on your Telegram!
            </a>
          )}
        </div>

        <Separator />

        {isMember ? (
          <div className="space-y-4">
            {!isViewer && <PostComposer communityId={community.id} isParentAdmin={isParentAdmin} />}
          {isViewer && (
            <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground text-center">
              You have view-only access to this community.
            </div>
          )}

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
                    isViewer={isViewer}
                  />
                ))}
                {communityPosts.length > 0 && <Separator />}
              </div>
            )}

            {communityPosts.length === 0 && parentPushPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                No posts yet. Be the first to share something.
              </div>
            ) : (
              communityPosts.map((post) => (
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
