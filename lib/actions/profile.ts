"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const display_name = (formData.get("display_name") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim() || null;
  const timezone = (formData.get("timezone") as string) || "UTC";

  if (!display_name) throw new Error("Display name is required");

  const { error } = await supabase
    .from("users")
    .update({ display_name, bio, timezone })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/home");
}

export async function updateAvatarUrl(url: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("users")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
  revalidatePath("/home");
}
