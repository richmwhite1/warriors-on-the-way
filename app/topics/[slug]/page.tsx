import { notFound } from "next/navigation";
import { requireUserProfile } from "@/lib/queries/users";
import {
  getTopicBySlug,
  listTopicPosts,
  getCommentsForPosts,
  getListedCommunitiesForTopic,
  recordAndCheckFirstVisit,
} from "@/lib/queries/topics";
import { getReviewerTopics } from "@/lib/queries/moderation";
import { ObjectiveSheet } from "@/components/topics/objective-sheet";
import { TopicView } from "@/components/topics/topic-view";
import Link from "next/link";

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [user, topic] = await Promise.all([requireUserProfile(), getTopicBySlug(slug)]);
  if (!topic) notFound();

  const firstVisit = await recordAndCheckFirstVisit(user.id, topic.id);
  const [posts, communities, reviewerTopics] = await Promise.all([
    listTopicPosts(topic.id),
    getListedCommunitiesForTopic(topic.id),
    getReviewerTopics(user.id),
  ]);
  const comments = await getCommentsForPosts(posts.map((p) => p.id));
  const canReview = reviewerTopics.some((t) => t.id === topic.id);

  return (
    <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
        <ObjectiveSheet
          name={topic.name}
          manifesto={topic.manifesto_objective}
          solution={topic.solution_statement}
          firstVisit={firstVisit}
        />

        {canReview && (
          <div style={{ marginTop: 12 }}>
            <Link href={`/topics/${topic.slug}/review`} style={{ fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 700, color: "#b91c1c", textDecoration: "none" }}>
              Review queue →
            </Link>
          </div>
        )}

        <TopicView
          topic={{ id: topic.id, slug: topic.slug, name: topic.name }}
          currentUserId={user.id}
          posts={posts}
          comments={comments}
          communities={communities}
        />
      </div>
    </main>
  );
}
