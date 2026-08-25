import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { getNeeds } from "@/lib/queries/needs";
import { getTopics } from "@/lib/queries/topics";
import { createOffering } from "@/lib/actions/offerings";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "New offering" };

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function NewOfferingPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const [needs, topics] = await Promise.all([getNeeds(), getTopics()]);

  return (
    <>
      <AppNav />
      <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
        <div>
          <Link href={`/community/${slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← {community.name}
          </Link>
          <h1 className="text-2xl font-heading font-semibold mt-1">New offering</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A standing or recurring gathering — a class, a group, a circle. Free and peer-to-peer.
          </p>
        </div>

        <form action={createOffering} className="space-y-6">
          <input type="hidden" name="community_id" value={community.id} />
          <input type="hidden" name="community_slug" value={slug} />

          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">Name</label>
            <input id="title" name="title" required placeholder="e.g. Jess's Yoga" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium">What is it?</label>
            <textarea id="description" name="description" rows={3} placeholder="A short, welcoming description." className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="facilitator_name" className="text-sm font-medium">Led by</label>
              <input id="facilitator_name" name="facilitator_name" placeholder="Facilitator name" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cadence_text" className="text-sm font-medium">When</label>
              <input id="cadence_text" name="cadence_text" placeholder="e.g. Tuesdays 6pm" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="location" className="text-sm font-medium">Where</label>
              <input id="location" name="location" placeholder="Location" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="next_starts_at" className="text-sm font-medium">Next session (optional)</label>
              <input id="next_starts_at" name="next_starts_at" type="datetime-local" className={inputClass} />
            </div>
          </div>

          {/* ── Which needs does this answer? (Shannon's six) ─────────────────── */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Which doorways does this answer?</legend>
            <p className="text-xs text-muted-foreground">Pick all that fit — this is how people find it.</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {needs.map((n) => (
                <label key={n.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer">
                  <input type="checkbox" name="need_ids" value={n.id} />
                  {n.name}
                </label>
              ))}
            </div>
          </fieldset>

          {/* ── Mission badge (Seán's nine) ──────────────────────────────────── */}
          <div className="space-y-1.5">
            <label htmlFor="topic_id" className="text-sm font-medium">Mission it serves</label>
            <p className="text-xs text-muted-foreground">The reclamation this belongs to — shown as a badge on the card.</p>
            <select id="topic_id" name="topic_id" defaultValue="" className={inputClass}>
              <option value="">— None —</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* ── Optional cost-share note (never a fee) ───────────────────────── */}
          <div className="space-y-1.5">
            <label htmlFor="cost_note" className="text-sm font-medium">Shared-cost note (optional)</label>
            <input id="cost_note" name="cost_note" placeholder="e.g. Bring $8 for groceries" className={inputClass} />
            <p className="text-xs text-muted-foreground">For chipping in on shared costs only. Nobody ever charges to gather.</p>
          </div>

          <button type="submit" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Create offering
          </button>
        </form>
      </main>
    </>
  );
}
