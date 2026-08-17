import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { CreateCommunityForm } from "@/components/community/create-community-form";
import { requireUserProfile } from "@/lib/queries/users";
import { getTopics } from "@/lib/queries/topics";

export const metadata = { title: "Create community" };

export default async function NewCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const { topic: preselectSlug } = await searchParams;
  const topics = await getTopics();
  const preselectTopicId = topics.find((t) => t.slug === preselectSlug)?.id;

  return (
    <>
      <AppNav />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Create a community</h1>
          <p className="text-muted-foreground text-sm mt-1">
            You&apos;ll be the steward. Communities are capped at 150 members.
          </p>
        </div>
        <CreateCommunityForm
          topics={topics.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
          preselectTopicId={preselectTopicId}
        />
      </main>
    </>
  );
}
