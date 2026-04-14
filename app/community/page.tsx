import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { CommunityCard } from "@/components/community/community-card";
import { DiscoverSearch } from "@/components/community/discover-search";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { requireUserProfile } from "@/lib/queries/users";
import { listUserCommunities, listPublicCommunities, type UserMembership } from "@/lib/queries/communities";
import { getActiveMemberCount } from "@/lib/queries/members";

export default async function CommunitiesPage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const [myCommunities, publicCommunities] = await Promise.all([
    listUserCommunities(user.id),
    listPublicCommunities(),
  ]);

  const myMemberCounts = await Promise.all(
    myCommunities.map((m) => getActiveMemberCount(m.community.id))
  );

  const myIds = new Set(myCommunities.map((m) => m.community.id));
  const discover = publicCommunities.filter((c) => !myIds.has(c.id));

  return (
    <>
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-heading font-semibold text-foreground">Communities</h1>
          <Link
            href="/community/new"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
          >
            + Create
          </Link>
        </div>

        {/* My communities */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-semibold">My communities</h2>

          {myCommunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center space-y-4">
              <div className="space-y-1">
                <p className="font-heading font-semibold">You&apos;re not in any communities yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your own or join one from the list below.
                </p>
              </div>
              <Link href="/community/new" className={cn(buttonVariants(), "rounded-full")}>
                Create a community
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

        {/* Discover */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-semibold">Discover communities</h2>
          {discover.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center space-y-1">
              <p className="font-heading font-semibold">No communities to discover yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first — create one above and others can find and join it.
              </p>
            </div>
          ) : (
            <DiscoverSearch communities={discover} />
          )}
        </section>

      </main>
    </>
  );
}
