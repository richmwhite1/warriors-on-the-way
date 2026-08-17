import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { getCommunityTopics, getSiblingCommunities } from "@/lib/queries/topics";

// Rec 7 — steward cross-community connection. Communities seed communities: a steward
// can find kindred groups sharing their topics and reach their stewards.
export default async function RelatedCommunitiesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect(`/sign-in?next=/community/${slug}/related`);

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  const isSteward = membership?.role === "admin" || membership?.role === "organizer";
  if (!isSteward) redirect(`/community/${slug}`);

  const topics = await getCommunityTopics(community.id);
  const siblings = await getSiblingCommunities(community.id, topics.map((t) => t.id));

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link href={`/community/${slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← {community.name}
          </Link>
          <h1 className="text-2xl font-heading font-semibold mt-1">Related communities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Groups that share your topics. When yours fills at 150, this is where the next one comes from —
            reach a steward and seed together.
          </p>
        </div>

        {siblings.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No related communities yet. Yours may be the first in these topics — invite friends to start more.
          </div>
        ) : (
          <div className="space-y-3">
            {siblings.map((s) => (
              <Link key={s.id} href={`/community/${s.slug}`} className="block rounded-xl border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-heading font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{s.public_member_count}/{s.member_cap}</span>
                </div>
                {s.purpose && <p className="text-sm text-muted-foreground mt-1">{s.purpose}</p>}
                <div className="text-xs text-muted-foreground mt-2">
                  {s.steward_name && <>Steward: {s.steward_name} · </>}
                  Shares: {s.shared_topics.join(", ")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
