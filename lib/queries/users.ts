import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  display_name: string;
  first_name: string | null;
  last_initial: string | null;
  birthdate: string | null;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  venmo_handle: string | null;
  phone: string | null;
  notify_sms: boolean;
  created_at: string;
};

const USER_SELECT =
  "id, display_name, first_name, last_initial, birthdate, bio, avatar_url, timezone, venmo_handle, phone, notify_sms, created_at";

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
    .select(USER_SELECT)
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
    .select(USER_SELECT)
    .eq("id", user.id)
    .single();

  if (!data) throw new Error("User profile not found");
  return data;
}
