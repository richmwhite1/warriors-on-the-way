import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUserProfile } from "@/lib/queries/users";
import { getTopicBySlug } from "@/lib/queries/topics";
import { listTopicResources } from "@/lib/queries/topic-resources";
import { ResourceDirectory } from "@/components/resources/resource-directory";

// Phase Two / Rec 4 — the Resources directory landed. A filtered geographic directory
// (proximity, category, vouches). Reachable now; the topic-page tab still points here.
export default async function TopicResourcesPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; lat?: string; lng?: string }>;
}) {
  const { slug } = await params;
  const { category, lat, lng } = await searchParams;
  const user = await requireUserProfile();

  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const resources = await listTopicResources(topic.id, user.id, {
    category: category || undefined,
    lat: lat ? parseFloat(lat) : undefined,
    lng: lng ? parseFloat(lng) : undefined,
  });

  return (
    <main style={{ background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>
        <Link href={`/topics/${slug}`} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#7c7589", textDecoration: "none" }}>
          ← {topic.name}
        </Link>
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: 24, fontWeight: 800, color: "#1a1a2e", marginTop: 8, marginBottom: 14 }}>
          {topic.name} · Resources
        </h1>
        <ResourceDirectory
          topic={{ id: topic.id, slug: topic.slug, name: topic.name }}
          currentUserId={user.id}
          resources={resources}
          activeCategory={category ?? null}
        />
      </div>
    </main>
  );
}
