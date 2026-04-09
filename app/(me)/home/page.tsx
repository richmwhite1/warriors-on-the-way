import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { CommunityCard } from "@/components/community/community-card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { requireUserProfile } from "@/lib/queries/users";
import { listUserCommunities, listPublicCommunities, type UserMembership } from "@/lib/queries/communities";
import { getActiveMemberCount } from "@/lib/queries/members";

const SHIFTS = [
  { from: "Indoctrination", to: "Exploration", domain: "Education" },
  { from: "Sensual arousal", to: "Mystical stimulation", domain: "Entertainment" },
  { from: "Dominion by the elite", to: "Distribution to all", domain: "Economics" },
  { from: "Dogmatic sectarianism", to: "Unity identity", domain: "Religion" },
  { from: "Party-affiliated blindness", to: "Issue-identified solutions", domain: "Politics" },
  { from: "Gaia-destructive profiteering", to: "Gaia-enhancing gratitude", domain: "Agriculture" },
  { from: "Disease management", to: "People-centered healthcare", domain: "Medicine" },
];

export default async function HomePage() {
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

        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-heading font-semibold text-foreground">
            Welcome back, {user.display_name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">The path is walked together.</p>
        </div>

        {/* ── Mission reminder ──────────────────────────────────────────────── */}
        <section className="rounded-2xl border-2 border-primary/25 bg-primary/5 overflow-hidden">
          {/* Header row with Sean */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-primary/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sean-olaoire.webp"
              alt="Seán Ó Laoire"
              className="size-10 rounded-full object-cover object-top shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Why we&apos;re here
              </p>
              <p className="text-sm font-medium leading-snug">
                The Lightworkers Manifesto — Seán Ó Laoire
              </p>
            </div>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              Read more →
            </Link>
          </div>

          {/* Part 1 — the battle cry */}
          <div className="px-5 py-4 border-b border-primary/15 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Part one · The mission
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              We are in a battle for the soul of the planet. God is sending in the warriors
              and lightbringers to reclaim{" "}
              <span className="font-medium">education, economics, healing, storytelling,
              entertainment, food, fire, democracy, and spirituality</span>{" "}
              from those who have captured them.
            </p>
          </div>

          {/* Part 2 — the shifts */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Part two · The shifts
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SHIFTS.map(({ domain, to }) => (
                <div key={domain} className="rounded-xl bg-background border px-3 py-2 space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{domain}</p>
                  <p className="text-xs text-foreground leading-snug">→ {to}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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
              <Link href="/community/new" className={cn(buttonVariants(), "rounded-full")}>
                Create your first community
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
                    bannerUrl={c.banner_url}
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
