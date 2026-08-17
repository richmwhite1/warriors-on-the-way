import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { HiddenList } from "@/components/moderation/hidden-list";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listHiddenForCommunity } from "@/lib/queries/moderation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  return { title: community ? `Moderation · ${community.name}` : "Moderation" };
}

export default async function CommunityModerationPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect(`/sign-in?next=/community/${slug}/moderation`);

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  const isSteward = membership?.role === "admin" || membership?.role === "organizer";
  if (!isSteward) redirect(`/community/${slug}`);

  const hidden = await listHiddenForCommunity(community.id);

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link href={`/community/${slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← {community.name}
          </Link>
          <h1 className="text-2xl font-heading font-semibold mt-1">Hidden content</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Content flagged past the threshold, hidden pending your review. You can restore anything —
            a steward can hide, but never permanently delete.
          </p>
        </div>
        <HiddenList items={hidden} scope="community" slug={slug} />
        <div className="pt-2">
          <Link href={`/community/${slug}/reports`} className="text-sm text-primary underline">
            View open reports →
          </Link>
        </div>
      </main>
    </>
  );
}
