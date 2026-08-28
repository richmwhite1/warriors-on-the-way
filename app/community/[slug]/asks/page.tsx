import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import Link from "next/link";
import { AskBoard } from "@/components/asks/ask-board";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listCommunityAsks, listAskCommentsForAsks } from "@/lib/queries/asks";
import { getTopics } from "@/lib/queries/topics";

export default async function AsksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect(`/sign-in?next=/community/${slug}/asks`);

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  if (membership?.status !== "active") {
    // Ask & Offer is member-scoped.
    redirect(`/community/${slug}`);
  }

  const [asks, topics] = await Promise.all([
    listCommunityAsks(community.id),
    getTopics(),
  ]);
  const comments = await listAskCommentsForAsks(asks.map((a) => a.id));

  return (
    <>
      <AppNav />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "1.25rem 1.25rem 3rem" }}>
        <Link
          href={`/community/${slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {community.name}
        </Link>
        <div style={{ marginTop: 8 }}>
          <AskBoard
            communityId={community.id}
            communitySlug={slug}
            currentUserId={user.id}
            asks={asks}
            comments={comments}
            topics={topics.map((t) => ({ id: t.id, name: t.name }))}
          />
        </div>
      </main>
    </>
  );
}
