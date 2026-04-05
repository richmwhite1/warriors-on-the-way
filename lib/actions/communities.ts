"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugExists } from "@/lib/queries/communities";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await slugExists(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function createCommunity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const is_private = formData.get("is_private") === "true";
  const members_can_create_events = formData.get("members_can_create_events") !== "false";
  const custom_slug = (formData.get("slug") as string)?.trim();

  if (!name) throw new Error("Community name is required");

  const baseSlug = custom_slug ? toSlug(custom_slug) : toSlug(name);
  if (!baseSlug) throw new Error("Could not generate a valid slug from that name");

  const slug = await uniqueSlug(baseSlug);

  // Insert community + membership in a transaction via RPC
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .insert({ slug, name, description, is_private, members_can_create_events, created_by: user.id })
    .select("id, slug")
    .single();

  if (communityError) throw new Error(communityError.message);

  const { error: memberError } = await supabase
    .from("community_members")
    .insert({ community_id: community.id, user_id: user.id, role: "organizer", status: "active" });

  if (memberError) throw new Error(memberError.message);

  redirect(`/community/${community.slug}`);
}

export async function updateCommunitySettings(communityId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const is_private = formData.get("is_private") === "true";
  const members_can_create_events = formData.get("members_can_create_events") !== "false";

  if (!name) throw new Error("Community name is required");

  const { data: community, error } = await supabase
    .from("communities")
    .update({ name, description, is_private, members_can_create_events })
    .eq("id", communityId)
    .select("slug")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/community/${community.slug}`);
  revalidatePath(`/community/${community.slug}/settings`);
}
