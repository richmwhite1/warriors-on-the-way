import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  venmo_handle: string | null;
  created_at: string;
};

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, display_name, bio, avatar_url, timezone, venmo_handle, created_at")
    .eq("id", userId)
    .single();
  return data;
}

export async function requireUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("users")
    .select("id, display_name, bio, avatar_url, timezone, venmo_handle, created_at")
    .eq("id", user.id)
    .single();

  if (!data) throw new Error("User profile not found");
  return data;
}
