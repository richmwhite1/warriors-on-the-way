"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ResourceCategory } from "@/lib/types/resources";

async function assertAdmin(communityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["admin", "organizer"].includes(membership.role as string)) {
    throw new Error("Not authorized");
  }
  return supabase;
}

export async function createResource(
  communityId: string,
  communitySlug: string,
  formData: FormData
) {
  const supabase = await assertAdmin(communityId);

  const category = formData.get("category") as ResourceCategory;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const url = (formData.get("url") as string)?.trim() || null;
  const author = (formData.get("author") as string)?.trim() || null;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  if (!title) throw new Error("Title is required");

  const { error } = await supabase.from("resources").insert({
    community_id: communityId, category, title, description, url, author, sort_order,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/community/${communitySlug}/resources`);
  revalidatePath(`/community/${communitySlug}/settings`);
}

export async function updateResource(
  resourceId: string,
  communityId: string,
  communitySlug: string,
  formData: FormData
) {
  const supabase = await assertAdmin(communityId);

  const category = formData.get("category") as ResourceCategory;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const url = (formData.get("url") as string)?.trim() || null;
  const author = (formData.get("author") as string)?.trim() || null;
  const sort_order = parseInt(formData.get("sort_order") as string) || 0;

  if (!title) throw new Error("Title is required");

  const { error } = await supabase
    .from("resources")
    .update({ category, title, description, url, author, sort_order })
    .eq("id", resourceId)
    .eq("community_id", communityId);

  if (error) throw new Error(error.message);

  revalidatePath(`/community/${communitySlug}/resources`);
  revalidatePath(`/community/${communitySlug}/settings`);
}

export async function deleteResource(
  resourceId: string,
  communityId: string,
  communitySlug: string
) {
  const supabase = await assertAdmin(communityId);

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId)
    .eq("community_id", communityId);

  if (error) throw new Error(error.message);

  revalidatePath(`/community/${communitySlug}/resources`);
  revalidatePath(`/community/${communitySlug}/settings`);
}
