"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { zonedInputToUtcIso } from "@/lib/event-time";

type Format = "in_person" | "online" | "hybrid";

function readFormat(formData: FormData): Format {
  const raw = formData.get("format") as string;
  return raw === "online" || raw === "hybrid" ? raw : "in_person";
}

// The fields an offering form posts, in both create and edit. Kept in one place so
// the two forms can't drift into saving different subsets of the same thing.
function readOfferingFields(formData: FormData) {
  // A datetime-local input posts a bare wall clock. Read it against the zone the
  // steward picked, not the server's — see lib/event-time.ts.
  const timezone = (formData.get("timezone") as string)?.trim() || "America/Denver";
  return {
    timezone,
    title: (formData.get("title") as string)?.trim(),
    description: (formData.get("description") as string)?.trim() || null,
    facilitator_name: (formData.get("facilitator_name") as string)?.trim() || null,
    cadence_text: (formData.get("cadence_text") as string)?.trim() || null,
    location: (formData.get("location") as string)?.trim() || null,
    cost_note: (formData.get("cost_note") as string)?.trim() || null,
    topic_id: ((formData.get("topic_id") as string) || null) || null,
    format: readFormat(formData),
    next_starts_at: zonedInputToUtcIso(formData.get("next_starts_at") as string, timezone),
  };
}

// Replace an offering's doorway tags. The form always posts the full set, so this
// replaces rather than merges — unchecking a doorway has to actually remove it.
async function syncOfferingNeeds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offeringId: string,
  needIds: string[],
) {
  await supabase.from("offering_needs").delete().eq("offering_id", offeringId);
  if (needIds.length > 0) {
    const { error } = await supabase
      .from("offering_needs")
      .insert(needIds.map((need_id) => ({ offering_id: offeringId, need_id })));
    if (error) throw new Error(error.message);
  }
}

// Every surface an offering appears on. An edit that fixes a wrong meeting time is
// worthless if the doorway someone actually browses is still serving the old one.
function revalidateOffering(offeringId: string, communitySlug: string) {
  revalidatePath("/menu");
  revalidatePath("/needs", "layout");
  revalidatePath(`/offerings/${offeringId}`);
  revalidatePath(`/community/${communitySlug}`);
}

// Create a standing/recurring offering (a class, group, or series) for a community.
// Peer-to-peer & free: there is no fee field — only an optional cost_note for
// "chip in for shared costs" logistics.
export async function createOffering(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const community_id = formData.get("community_id") as string;
  const community_slug = (formData.get("community_slug") as string) || "";
  const fields = readOfferingFields(formData);
  const need_ids = (formData.getAll("need_ids") as string[]).filter(Boolean);

  if (!fields.title) throw new Error("Title is required");

  const { data: offering, error } = await supabase
    .from("offerings")
    .insert({ community_id, created_by: user.id, ...fields })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await syncOfferingNeeds(supabase, offering.id, need_ids);

  revalidateOffering(offering.id, community_slug);
  redirect(`/offerings/${offering.id}`);
}

// Edit an existing offering. Until now an offering was write-once: a mistyped cadence
// or a moved venue was permanent, which quietly makes the menu untrustworthy — the
// one thing a directory of free community gatherings cannot afford to be.
//
// Permission is enforced by RLS ("offerings: edit by creator or admin"). A non-editor's
// UPDATE matches zero rows rather than erroring, so the empty result is the denial and
// has to be treated as one.
export async function updateOffering(offeringId: string, formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fields = readOfferingFields(formData);
  const need_ids = (formData.getAll("need_ids") as string[]).filter(Boolean);
  if (!fields.title) throw new Error("Title is required");

  const { data, error } = await supabase
    .from("offerings")
    .update(fields)
    .eq("id", offeringId)
    .is("deleted_at", null)
    .select("id, community:communities!community_id(slug)")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to edit this offering");

  await syncOfferingNeeds(supabase, offeringId, need_ids);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = (data as any).community?.slug ?? "";
  revalidateOffering(offeringId, slug);
  redirect(`/offerings/${offeringId}`);
}

// Pause, resume, or end an offering.
//
// The distinction matters and is why this isn't just a delete: a yoga class that stops
// for the winter is `paused` and comes back; a 6-week grief series that finished is
// `ended` and shouldn't. Both drop off the menu — only `active` is listed — but the
// steward keeps the history and the resume path.
export async function setOfferingStatus(
  offeringId: string,
  status: "active" | "paused" | "ended",
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("offerings")
    .update({ status })
    .eq("id", offeringId)
    .is("deleted_at", null)
    .select("id, community:communities!community_id(slug)")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to change this offering");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revalidateOffering(offeringId, (data as any).community?.slug ?? "");
}

// Soft-delete. Kept distinct from `ended` so a mistake ("wrong community") can be
// erased while a real programme that finished stays legible in the community's history.
export async function deleteOffering(offeringId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("offerings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", offeringId)
    .is("deleted_at", null)
    .select("id, community:communities!community_id(slug)")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to remove this offering");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = (data as any).community?.slug ?? "";
  revalidateOffering(offeringId, slug);
  redirect(`/community/${slug}`);
}

// "I'm coming" — the commitment signal offerings never had.
//
// Deliberately lighter than an event RSVP: an offering recurs, so this means "count me
// in generally", not a promise about one Tuesday. Its real job is the headcount on the
// card — deciding whether to walk alone into a room of strangers is the hard part, and
// "9 coming" is the answer. The roster stays private to the community (see RLS);
// everyone else only ever sees the number.
export async function toggleOfferingInterest(
  offeringId: string,
  interested: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (interested) {
    const { error } = await supabase
      .from("offering_interest")
      .upsert({ offering_id: offeringId, user_id: user.id }, { onConflict: "offering_id,user_id" });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("offering_interest")
      .delete()
      .eq("offering_id", offeringId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/offerings/${offeringId}`);
}
