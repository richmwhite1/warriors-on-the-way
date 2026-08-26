import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { MissionBadge } from "@/components/needs/mission-badge";
import { FormatBadge } from "@/components/needs/format-badge";
import { NeedIcon } from "@/components/needs/need-icon";
import { OfferingInterestButton } from "@/components/needs/offering-interest-button";
import { getOfferingById, isInterestedInOffering } from "@/lib/queries/needs";
import { getMembership } from "@/lib/queries/members";
import { getAuthUser } from "@/lib/queries/users";

type Props = { params: Promise<{ offeringId: string }> };

export async function generateMetadata({ params }: Props) {
  const { offeringId } = await params;
  const offering = await getOfferingById(offeringId);
  if (!offering) return { title: "Offering" };
  return {
    title: offering.title,
    description: offering.description ?? `${offering.cadence_text ?? "Ongoing"} · ${offering.community_name}`,
  };
}

function nextSession(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (d.getTime() < Date.now()) return null;
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-t border-border py-3">
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{k}</p>
      <p className="mt-[3px] font-sans text-[15px] leading-relaxed text-foreground">{v}</p>
    </div>
  );
}

const FORMAT_LABEL = {
  in_person: "In person",
  online: "Online",
  hybrid: "In person and online",
} as const;

// Offerings are public on purpose. Someone who's been handed a link to a grief group
// should be able to read what it is and when it meets without making an account —
// the sign-in wall is what keeps people who need this from ever reaching it.
export default async function OfferingPage({ params }: Props) {
  const { offeringId } = await params;
  const offering = await getOfferingById(offeringId);
  if (!offering) notFound();

  const user = await getAuthUser();
  const [interested, membership] = await Promise.all([
    isInterestedInOffering(offeringId),
    user ? getMembership(offering.community_id, user.id) : Promise.resolve(null),
  ]);

  const canEdit =
    Boolean(user) &&
    (offering.created_by === user!.id ||
      (membership?.status === "active" && ["admin", "organizer"].includes(membership.role)));

  const next = nextSession(offering.next_starts_at);

  return (
    <>
      <AppNav />

      <main className="animate-page-enter mx-auto max-w-[560px] pb-20">
        <div className="px-4 pt-5">
          <Link
            href={`/community/${offering.community_slug}`}
            className="font-heading text-[13px] font-bold text-primary no-underline"
          >
            ← {offering.community_name}
          </Link>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/30 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
              Ongoing
            </span>
            <MissionBadge mission={offering.mission} linked />
            <FormatBadge format={offering.format} showInPerson />
            {offering.status !== "active" && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {offering.status === "paused" ? "Paused" : "Ended"}
              </span>
            )}
          </div>

          <h1 className="mt-2.5 font-heading text-[2rem] font-extrabold leading-[1.12] tracking-[-0.02em] text-foreground">
            {offering.title}
          </h1>

          {offering.description && (
            <p className="mt-3 font-sans text-base leading-relaxed text-foreground">
              {offering.description}
            </p>
          )}

          {canEdit && (
            <Link
              href={`/offerings/${offeringId}/edit`}
              className="mt-3 inline-block font-sans text-[13px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground"
            >
              Edit this offering
            </Link>
          )}
        </div>

        {/* ── The practical facts, in the order someone deciding whether to come needs them ── */}
        <div className="px-4 pt-4">
          {offering.cadence_text && <Row k="When" v={offering.cadence_text} />}
          {next && <Row k="Next session" v={next} />}
          <Row k="How to join" v={FORMAT_LABEL[offering.format]} />
          {offering.location && <Row k="Where" v={offering.location} />}
          {offering.facilitator_name && <Row k="Led by" v={offering.facilitator_name} />}
          {offering.cost_note && <Row k="Shared costs" v={offering.cost_note} />}
        </div>

        {/* ── Doorways this answers ─────────────────────────────────────────── */}
        {offering.needs.length > 0 && (
          <div className="px-4 pt-6">
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Good for
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {offering.needs.map((n) => (
                <Link
                  key={n.slug}
                  href={`/needs/${n.slug}`}
                  className="inline-flex items-center gap-[7px] rounded-full border border-border bg-card px-3.5 py-[7px] font-sans text-[13px] font-medium text-foreground no-underline"
                >
                  <NeedIcon icon={n.icon} size={15} />
                  {n.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── How you actually show up ──────────────────────────────────────── */}
        <div className="px-4 pt-7">
          {/* Walking into a room of strangers alone is the hard part; the headcount is
              the answer to it. Who those people are stays private to the community. */}
          <OfferingInterestButton
            offeringId={offeringId}
            initialInterested={interested}
            initialCount={offering.interest_count}
            signedIn={Boolean(user)}
          />

          <Link
            href={`/community/${offering.community_slug}`}
            className="press-scale mt-2.5 block min-h-11 rounded-full border border-border bg-card px-6 py-3 text-center font-heading text-[15px] font-bold text-foreground no-underline"
          >
            Go to {offering.community_name}
          </Link>

          <p className="mt-3 text-center font-sans text-[13px] leading-relaxed text-muted-foreground">
            Everything here is free and peer-to-peer. Just come.
          </p>
        </div>
      </main>
    </>
  );
}
