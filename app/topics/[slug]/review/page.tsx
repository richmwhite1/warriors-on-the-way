import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUserProfile } from "@/lib/queries/users";
import { getTopicBySlug } from "@/lib/queries/topics";
import { listHiddenForTopic, getReviewerTopics } from "@/lib/queries/moderation";
import { HiddenList } from "@/components/moderation/hidden-list";

// Trusted-member review queue for topic-level (community-less) content.
export default async function TopicReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUserProfile();

  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const reviewerTopics = await getReviewerTopics(user.id);
  const canReview = reviewerTopics.some((t) => t.id === topic.id);
  if (!canReview) redirect(`/topics/${slug}`);

  const hidden = await listHiddenForTopic(topic.id);

  return (
    <main style={{ background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
        <Link href={`/topics/${slug}`} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", textDecoration: "none" }}>
          ← {topic.name}
        </Link>
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 24, fontWeight: 800, color: "var(--foreground)", marginTop: 8 }}>
          Review queue
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted-foreground)", margin: "6px 0 20px", lineHeight: 1.5 }}>
          Topic-feed content flagged past the threshold. Restore anything that belongs; leave hidden
          what doesn&apos;t. You can hide, but never permanently delete.
        </p>
        <HiddenList items={hidden} scope="topic" slug={slug} />
      </div>
    </main>
  );
}
