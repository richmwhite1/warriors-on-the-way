import { notFound } from "next/navigation";
import { requireUserProfile } from "@/lib/queries/users";
import {
  getTopicBySlug,
  listTopicPosts,
  getCommentsForPosts,
  getListedCommunitiesForTopic,
  recordAndCheckFirstVisit,
} from "@/lib/queries/topics";
import { ObjectiveSheet } from "@/components/topics/objective-sheet";
import { SeanBand } from "@/components/topics/sean-band";
import { TopicView } from "@/components/topics/topic-view";

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [user, topic] = await Promise.all([requireUserProfile(), getTopicBySlug(slug)]);
  if (!topic) notFound();

  const firstVisit = await recordAndCheckFirstVisit(user.id, topic.id);
  const [posts, communities] = await Promise.all([
    listTopicPosts(topic.id),
    getListedCommunitiesForTopic(topic.id),
  ]);
  const comments = await getCommentsForPosts(posts.map((p) => p.id));

  return (
    <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
        <ObjectiveSheet
          name={topic.name}
          manifesto={topic.manifesto_objective}
          solution={topic.solution_statement}
          firstVisit={firstVisit}
        />

        <div style={{ marginTop: 18 }}>
          <SeanBand topicSlug={topic.slug} topicName={topic.name} />
        </div>

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
