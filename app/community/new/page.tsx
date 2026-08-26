import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { CreateCommunityForm } from "@/components/community/create-community-form";
import { requireUserProfile } from "@/lib/queries/users";
import { getTopics } from "@/lib/queries/topics";
import { getNeeds } from "@/lib/queries/needs";

export const metadata = { title: "Create community" };

export default async function NewCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; need?: string }>;
}) {
  // ?need=<slug> arrives from an empty doorway — carry that doorway through so the
  // circle is born already answering the need its founder came looking for.
  const { topic: preselectSlug, need: preselectNeedSlug } = await searchParams;
  // Guard after reading the params so a signed-out founder keeps the doorway they
  // came from across the sign-in.
  const user = await requireUserProfile().catch(() => null);
  if (!user) {
    redirect(
      `/sign-in?next=${encodeURIComponent(
        preselectNeedSlug ? `/community/new?need=${preselectNeedSlug}` : "/community/new"
      )}`
    );
  }

  const [topics, needs] = await Promise.all([getTopics(), getNeeds()]);
  const preselectTopicId = topics.find((t) => t.slug === preselectSlug)?.id;
  const preselectNeed = needs.find((n) => n.slug === preselectNeedSlug);

  return (
    <>
      <AppNav />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-heading font-semibold">Create a community</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {preselectNeed
              ? `You'll be the steward of a circle for "${preselectNeed.name}". Communities are capped at 150 members.`
              : "You'll be the steward. Communities are capped at 150 members."}
          </p>
        </div>
        <CreateCommunityForm
          topics={topics.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
          preselectTopicId={preselectTopicId}
          needs={needs}
          preselectNeedIds={preselectNeed ? [preselectNeed.id] : []}
        />
      </main>
    </>
  );
}
