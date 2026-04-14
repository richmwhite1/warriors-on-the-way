import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { CommunityCard } from "@/components/community/community-card";
import { MissionPanel } from "@/components/home/mission-panel";
import { PostCard } from "@/components/feed/post-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { requireUserProfile } from "@/lib/queries/users";
import { listUserCommunities, type UserMembership } from "@/lib/queries/communities";
import { getActiveMemberCount } from "@/lib/queries/members";
import { listPersonalFeed } from "@/lib/queries/posts";
import { listCommentsByPostIds } from "@/lib/queries/comments";

export default async function HomePage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const [myCommunities, feedPosts] = await Promise.all([
    listUserCommunities(user.id),
    listPersonalFeed(user.id),
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

  return (
    <>
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-heading font-semibold text-foreground">
            Welcome back, {user.display_name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">The path is walked together.</p>
        </div>

        {/* ── Mission reminder ──────────────────────────────────────────────── */}
        <MissionPanel />

        {/* My communities */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold">My communities</h2>
            <Link
              href="/community"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full text-muted-foreground")}
            >
              Browse all →
            </Link>
          </div>

          {myCommunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center space-y-4">
              <div className="space-y-1">
                <p className="font-heading font-semibold">You&apos;re not in any communities yet</p>
                <p className="text-sm text-muted-foreground">
                  Browse communities to find your group.
                </p>
              </div>
              <Link href="/community" className={cn(buttonVariants(), "rounded-full")}>
                Browse communities
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myCommunities.map((m: UserMembership, i) => {
                const c = m.community;
                return (
                  <CommunityCard
                    key={c.id}
                    name={c.name}
                    slug={c.slug}
                    description={c.description}
                    bannerUrl={c.banner_url}
                    isPrivate={c.is_private}
                    isParent={c.is_parent}
                    memberCount={myMemberCounts[i] ?? 0}
                    memberCap={c.member_cap}
                    role={m.role}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Personal feed */}
        {feedPosts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-heading font-semibold">Recent activity</h2>
            <div className="space-y-3">
              {feedPosts.map((post) => {
                const community = post.community as { name: string; slug: string } | undefined;
                return (
                  <div key={post.id}>
                    {community && (
                      <Link
                        href={`/community/${community.slug}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors mb-1 inline-block"
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

      </main>
    </>
  );
}
