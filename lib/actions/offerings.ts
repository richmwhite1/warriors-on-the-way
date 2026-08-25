"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Create a standing/recurring offering (a class, group, or series) for a community.
// Peer-to-peer & free: there is no fee field — only an optional cost_note for
// "chip in for shared costs" logistics.
export async function createOffering(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const community_id = formData.get("community_id") as string;
  const community_slug = (formData.get("community_slug") as string) || "";
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const facilitator_name = (formData.get("facilitator_name") as string)?.trim() || null;
  const cadence_text = (formData.get("cadence_text") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const cost_note = (formData.get("cost_note") as string)?.trim() || null;
  const topic_id = (formData.get("topic_id") as string) || null; // mission badge
  const nextStr = formData.get("next_starts_at") as string;
  const next_starts_at = nextStr ? new Date(nextStr).toISOString() : null;
  const need_ids = (formData.getAll("need_ids") as string[]).filter(Boolean);

  if (!title) throw new Error("Title is required");

  const { data: offering, error } = await supabase
    .from("offerings")
    .insert({
      community_id,
      created_by: user.id,
      title,
      description,
      facilitator_name,
      cadence_text,
      next_starts_at,
      location,
      cost_note,
      topic_id: topic_id || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (need_ids.length > 0) {
    const { error: needErr } = await supabase
      .from("offering_needs")
      .insert(need_ids.map((need_id) => ({ offering_id: offering.id, need_id })));
    if (needErr) throw new Error(needErr.message);
  }

  revalidatePath("/menu");
  revalidatePath("/needs", "layout");
  revalidatePath(`/community/${community_slug}`);
  redirect(`/community/${community_slug}`);
}
