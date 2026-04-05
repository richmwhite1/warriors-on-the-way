import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { CommunityCard } from "@/components/community/community-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { requireUserProfile } from "@/lib/queries/users";
import { listUserCommunities, listPublicCommunities, type UserMembership } from "@/lib/queries/communities";

export default async function HomePage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const [myCommunities, publicCommunities] = await Promise.all([
    listUserCommunities(user.id),
    listPublicCommunities(),
  ]);

  const myIds = new Set(myCommunities.map((m) => m.community.id));
  const discover = publicCommunities.filter((c) => !myIds.has(c.id));

  return (
    <>
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-heading font-semibold text-foreground">
            Welcome back, {user.display_name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">Your communities are waiting.</p>
        </div>

        {/* My communities */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold">My communities</h2>
            <Link
              href="/community/new"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
            >
              + Create
            </Link>
          </div>

          {myCommunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center space-y-3">
              <p className="text-muted-foreground">You haven&apos;t joined any communities yet.</p>
              <Link
                href="/community/new"
                className={cn(buttonVariants(), "rounded-full")}
              >
                Create your first community
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myCommunities.map((m: UserMembership) => {
                const c = m.community;
                return (
                  <CommunityCard
                    key={c.id}
                    name={c.name}
                    slug={c.slug}
                    description={c.description}
                    isPrivate={c.is_private}
                    isParent={c.is_parent}
                    memberCount={0}
                    memberCap={c.member_cap}
                    role={m.role}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Discover */}
        {discover.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-heading font-semibold">Discover communities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {discover.map((c) => {
                const count = (c.member_count as unknown as { count: number }[])?.[0]?.count ?? 0;
                return (
                  <CommunityCard
                    key={c.id}
                    name={c.name}
                    slug={c.slug}
                    description={c.description}
                    isPrivate={c.is_private}
                    isParent={c.is_parent}
                    memberCount={count}
                    memberCap={c.member_cap}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
