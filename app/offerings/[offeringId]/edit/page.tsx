import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { OfferingForm } from "@/components/offerings/offering-form";
import { OfferingAdmin } from "@/components/offerings/offering-admin";
import { getOfferingById, getNeedIdsForOffering, getNeeds } from "@/lib/queries/needs";
import { getTopics } from "@/lib/queries/topics";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { updateOffering } from "@/lib/actions/offerings";

type Props = { params: Promise<{ offeringId: string }> };

export const metadata = { title: "Edit offering" };

// Until now an offering was write-once: a mistyped cadence or a moved venue was
// permanent. A directory of free community gatherings that can't be corrected is a
// directory people stop trusting, which is the one thing it can't afford to be.
export default async function EditOfferingPage({ params }: Props) {
  const { offeringId } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect(`/sign-in?next=/offerings/${offeringId}/edit`);

  const offering = await getOfferingById(offeringId);
  if (!offering) notFound();

  // Mirrors the RLS policy ("offerings: edit by creator or admin"). Checking here too
  // is what turns a silent zero-row update into an honest redirect.
  const membership = await getMembership(offering.community_id, user.id);
  const canEdit =
    offering.created_by === user.id ||
    (membership?.status === "active" && ["admin", "organizer"].includes(membership.role));
  if (!canEdit) redirect(`/offerings/${offeringId}`);

  const [needs, topics, selectedNeedIds] = await Promise.all([
    getNeeds(),
    getTopics(),
    getNeedIdsForOffering(offeringId),
  ]);

  const save = updateOffering.bind(null, offeringId);

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-xl space-y-8 px-4 py-8">
        <div>
          <Link
            href={`/offerings/${offeringId}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {offering.title}
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-semibold">Edit offering</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes show up on the menu and every doorway this is tagged with.
          </p>
        </div>

        <OfferingForm
          action={save}
          needs={needs}
          topics={topics}
          offering={offering}
          selectedNeedIds={selectedNeedIds}
          submitLabel="Save changes"
        />

        <div className="border-t pt-6">
          <p className="text-sm font-medium">
            {offering.status === "active"
              ? "This offering is live on the menu."
              : offering.status === "paused"
                ? "Paused — hidden from the menu until you resume it."
                : "Ended — kept in your community's history, off the menu."}
          </p>
          <OfferingAdmin offeringId={offeringId} status={offering.status} />
        </div>
      </main>
    </>
  );
}
