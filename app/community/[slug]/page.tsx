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
import { listComments } from "@/lib/queries/comments";

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
  const isMember = memberStatus === "active";
  const isFull = memberCount >= community.member_cap;

  const [communityPosts, parentPushPosts] = isMember
    ? await Promise.all([
        listCommunityPosts(community.id),
        community.is_parent ? [] : listParentPushPosts(),
      ])
    : [[], []];

  const allPosts = [...parentPushPosts, ...communityPosts];
  const commentsByPost = isMember
    ? Object.fromEntries(
        await Promise.all(allPosts.map(async (p) => [p.id, await listComments(p.id)]))
      )
    : {};

  const isParentAdmin = isAdmin && community.is_parent;

  return (
    <>
      <AppNav />
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
              {isAdmin && (
                <Link href={`/community/${slug}/members`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Members
                </Link>
              )}
              <JoinButton
                communityId={community.id}
                communitySlug={slug}
                status={memberStatus as "none" | "active" | "waitlisted" | "pending_approval" | "banned"}
                isFull={isFull}
              />
            </div>
          </div>
          {community.description && (
            <p className="text-muted-foreground text-sm">{community.description}</p>
          )}
        </div>

        <Separator />

        {isMember ? (
          <div className="space-y-4">
            <PostComposer communityId={community.id} isParentAdmin={isParentAdmin} />

            {parentPushPosts.length > 0 && (
              <div className="space-y-3">
                {parentPushPosts.map((post) => (
                  <PostCard key={post.id} post={post} comments={commentsByPost[post.id] ?? []}
                    communitySlug={slug} currentUserId={user.id} isAdmin={isAdmin} isMember={isMember} />
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
                <PostCard key={post.id} post={post} comments={commentsByPost[post.id] ?? []}
                  communitySlug={slug} currentUserId={user.id} isAdmin={isAdmin} isMember={isMember} />
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
