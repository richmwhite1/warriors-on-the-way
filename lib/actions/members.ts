"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveMemberCount, getMembership } from "@/lib/queries/members";

export async function joinCommunity(communityId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check existing membership
  const existing = await getMembership(communityId, user.id);
  if (existing) {
    if (existing.status === "active") throw new Error("Already a member");
    if (existing.status === "banned") throw new Error("You cannot join this community");
  }

  // Fetch community to check private/cap
  const { data: community } = await supabase
    .from("communities")
    .select("is_private, member_cap")
    .eq("id", communityId)
    .single();

  if (!community) throw new Error("Community not found");

  const activeCount = await getActiveMemberCount(communityId);
  const atCap = activeCount >= community.member_cap;

  // Determine status
  let status: string;
  if (atCap) {
    status = "waitlisted";
  } else if (community.is_private) {
    status = "pending_approval";
  } else {
    status = "active";
  }

  if (existing) {
    await supabase
      .from("community_members")
      .update({ status })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("community_members")
      .insert({ community_id: communityId, user_id: user.id, status });
  }

  revalidatePath(`/community/${communitySlug}`);
  revalidatePath("/home");
}

export async function leaveCommunity(communityId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role === "organizer") {
    throw new Error("Organizers cannot leave. Transfer ownership first.");
  }

  await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  // Promote first waitlisted member if a spot opened
  await promoteFromWaitlist(communityId);

  revalidatePath(`/community/${communitySlug}`);
  revalidatePath("/home");
}

export async function approveMember(membershipId: string, communitySlug: string) {
  const supabase = await createClient();
  await supabase
    .from("community_members")
    .update({ status: "active" })
    .eq("id", membershipId);
  revalidatePath(`/community/${communitySlug}`);
  revalidatePath(`/community/${communitySlug}/members`);
  revalidatePath("/home");
}

export async function denyMember(membershipId: string, communitySlug: string) {
  const supabase = await createClient();
  await supabase
    .from("community_members")
    .delete()
    .eq("id", membershipId);
  revalidatePath(`/community/${communitySlug}`);
  revalidatePath(`/community/${communitySlug}/members`);
}

export async function promoteMember(
  membershipId: string,
  role: "member" | "admin",
  communitySlug: string
) {
  const supabase = await createClient();
  await supabase
    .from("community_members")
    .update({ role })
    .eq("id", membershipId);
  revalidatePath(`/community/${communitySlug}/members`);
}

export async function removeMember(membershipId: string, communitySlug: string) {
  const supabase = await createClient();
  await supabase
    .from("community_members")
    .update({ status: "banned" })
    .eq("id", membershipId);

  await promoteFromWaitlist(
    await getCommunityIdFromMembership(supabase, membershipId)
  );

  revalidatePath(`/community/${communitySlug}/members`);
}

async function promoteFromWaitlist(communityId: string) {
  const supabase = await createClient();
  const { data: next } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", communityId)
    .eq("status", "waitlisted")
    .order("joined_at", { ascending: true })
    .limit(1)
    .single();

  if (next) {
    await supabase
      .from("community_members")
      .update({ status: "active" })
      .eq("id", next.id);
  }
}

async function getCommunityIdFromMembership(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  membershipId: string
): Promise<string> {
  const { data } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("id", membershipId)
    .single();
  return data?.community_id ?? "";
}
