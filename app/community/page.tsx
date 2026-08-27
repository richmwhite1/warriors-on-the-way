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

  const publicCommunities = await listPublicCommunities();
  const myCommunities = user ? await listUserCommunities(user.id) : [];

  const myMemberCounts = await Promise.all(
    myCommunities.map((m) => getActiveMemberCount(m.community.id))
  );

  const myIds = new Set(myCommunities.map((m) => m.community.id));
  const discover = publicCommunities.filter((c) => !myIds.has(c.id));

  const hasMine = myCommunities.length > 0;
  const hasDiscover = discover.length > 0;
  // Three different reasons Discover can come up short, and they are not the same
  // message. Nothing exists yet is an invitation to found; you have joined all of them
  // is a success. Collapsing both into "No communities to discover yet" told the most
  // committed member in the network that the network was empty.
  const networkIsEmpty = publicCommunities.length === 0;
  const inEverything = !hasDiscover && !networkIsEmpty;

  return (
    <>
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10 animate-page-enter">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-heading font-semibold text-foreground">Communities</h1>
          {user && (
            <Link
              href="/community/new"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full shrink-0")}
            >
              + Create
            </Link>
          )}
        </div>

        {/* Guests can browse. A shared "come find us here" link should open onto the
            circles themselves, not a sign-in wall — the same reasoning that already
            keeps shared event links public. Joining still requires an account, so the
            prompt rides above the list rather than replacing it. */}
        {!user && (
          <div className="rounded-2xl border bg-card p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-heading font-semibold">Small groups that meet in person</p>
              <p className="text-sm text-muted-foreground">
                Browse freely. Sign in when you want to join one — it&apos;s free, and nobody
                ever charges to gather.
              </p>
            </div>
            <Link href="/sign-in?next=/community" className={cn(buttonVariants(), "rounded-full shrink-0")}>
              Sign in
            </Link>
          </div>
        )}

        {/* My communities — only once there are some. When there are none, the Discover
            list below is already the answer to "so where do I go?", and stacking a
            dashed "you're not in any yet" box on top of it just reports absence twice
            before showing the thing that isn't absent. */}
        {user && hasMine && (
          <section className="space-y-4">
            <h2 className="text-lg font-heading font-semibold">My communities</h2>
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
                    status={c.status}
                    role={m.role}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Discover */}
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-semibold">
            {hasMine ? "Discover more" : "Find your people"}
          </h2>

          {hasDiscover ? (
            <>
              {user && !hasMine && (
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t joined one yet. Open any circle below to see who&apos;s
                  there and what they&apos;re doing.
                </p>
              )}
              <DiscoverSearch communities={discover} />
            </>
          ) : inEverything ? (
            /* Success, not absence — this person is in every circle the network has. */
            <div className="rounded-2xl border bg-card p-8 text-center space-y-4">
              <div className="space-y-1">
                <p className="font-heading font-semibold">You&apos;re in every circle here</p>
                <p className="text-sm text-muted-foreground">
                  That&apos;s the whole network, for now. When someone starts a new one it
                  shows up here — or start the next one yourself.
                </p>
              </div>
              <Link href="/community/new" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
                Start a new circle
              </Link>
            </div>
          ) : (
            /* Genuinely nothing yet — the one moment that deserves the full ask. */
            <div className="rounded-2xl border border-dashed p-8 text-center space-y-4">
              <div className="space-y-1">
                <p className="font-heading font-semibold">Be the first circle here</p>
                <p className="text-sm text-muted-foreground">
                  Every network starts with one person naming a time and a place. Yours goes
                  live to everyone once five people join.
                </p>
              </div>
              <Link
                href={user ? "/community/new" : "/sign-in?next=/community/new"}
                className={cn(buttonVariants(), "rounded-full")}
              >
                Start the first one
              </Link>
            </div>
          )}
        </section>

      </main>
    </>
  );
}
