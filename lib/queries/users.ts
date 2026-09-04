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

/** Someone else's profile: what a member is allowed to see about another member. */
export type PublicUserProfile = Omit<UserProfile, "birthdate" | "phone" | "notify_sms">;

// phone / birthdate are no longer readable through the users table by anon or
// authenticated — the column grants were letting anyone with the anon key (which
// ships in the client bundle) dump every member's number and date of birth. They
// come back only via my_profile(), which is scoped to auth.uid().
const PUBLIC_USER_SELECT =
  "id, display_name, first_name, last_initial, bio, avatar_url, timezone, venmo_handle, created_at";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string): Promise<PublicUserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select(PUBLIC_USER_SELECT)
    .eq("id", userId)
    .single();
  return data;
}

const OWN_USER_SELECT = `${PUBLIC_USER_SELECT}, birthdate, phone, notify_sms`;

export async function requireUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // SECURITY DEFINER, and it takes no argument — it can only ever return the
  // caller's own row, contact details included.
  const { data, error } = await supabase.rpc("my_profile").maybeSingle();
  if (data) return data as UserProfile;

  // Deploy-order shim: the RPC arrives with migration 20260903000001. Until that is
  // applied the direct select still works, because the column grants it revokes are
  // also still unapplied. Once it is applied this branch stops being reachable — and
  // if it somehow is, the select fails loudly rather than serving a half-empty profile.
  if (error) {
    const { data: legacy } = await supabase
      .from("users")
      .select(OWN_USER_SELECT)
      .eq("id", user.id)
      .single();
    if (legacy) return legacy as UserProfile;
  }

  throw new Error("User profile not found");
}
