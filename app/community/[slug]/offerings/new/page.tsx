import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { OfferingForm } from "@/components/offerings/offering-form";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { getNeeds } from "@/lib/queries/needs";
import { getTopics } from "@/lib/queries/topics";
import { createOffering } from "@/lib/actions/offerings";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "New offering" };

export default async function NewOfferingPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect(`/sign-in?next=/community/${slug}/offerings/new`);

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const [needs, topics] = await Promise.all([getNeeds(), getTopics()]);

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-xl space-y-8 px-4 py-8">
        <div>
          <Link
            href={`/community/${slug}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {community.name}
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-semibold">New offering</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A standing or recurring gathering — a class, a group, a circle. Free and peer-to-peer.
          </p>
        </div>

        <OfferingForm
          action={createOffering}
          needs={needs}
          topics={topics}
          submitLabel="Create offering"
          hidden={{ community_id: community.id, community_slug: slug }}
        />
      </main>
    </>
  );
}
