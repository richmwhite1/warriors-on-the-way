"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveMemberCount, getMembership } from "@/lib/queries/members";
import { createNotification, notifyCommunityAdmins } from "@/lib/actions/notifications";

export async function joinCommunity(communityId: string, communitySlug: string, inviteToken?: string) {
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
    .select("is_private, member_cap, is_parent, invite_token")
    .eq("id", communityId)
    .single();

  if (!community) throw new Error("Community not found");

  const c = community as typeof community & { invite_token?: string | null };

  const activeCount = await getActiveMemberCount(communityId);
  const atCap = !community.is_parent && community.member_cap != null && activeCount >= community.member_cap;

  // Valid invite token overrides pending_approval for private communities
  const hasValidInvite = inviteToken && c.invite_token && inviteToken === c.invite_token;

  // Determine status
  let status: string;
  if (atCap) {
    status = "waitlisted";
  } else if (community.is_private && !hasValidInvite) {
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

  // Notify admins
  const { data: joiner } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const notifType = status === "pending_approval" ? "join_request" : "member_joined";
  await notifyCommunityAdmins(communityId, notifType, {
    actor_id: user.id,
    actor_name: joiner?.display_name ?? "Someone",
    community_slug: communitySlug,
  }, user.id);

  // Auto-join the WoW parent community if this is a sub-community
  if (!community.is_parent && status === "active") {
    const { data: parent } = await supabase
      .from("communities")
      .select("id, slug")
      .eq("is_parent", true)
      .single();

    if (parent && parent.id !== communityId) {
      const { data: existingParentMembership } = await supabase
        .from("community_members")
        .select("id, status")
        .eq("community_id", parent.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingParentMembership) {
        await supabase
          .from("community_members")
          .insert({ community_id: parent.id, user_id: user.id, status: "active" });
        revalidatePath(`/community/${parent.slug}`);
      }
    }
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
  const { data: membership } = await supabase
    .from("community_members")
    .update({ status: "active" })
    .eq("id", membershipId)
    .select("user_id, community_id, community:communities(name)")
    .single();

  if (membership) {
    await createNotification(membership.user_id, "member_joined", {
      community_slug: communitySlug,
      community_name: (membership.community as { name?: string } | null)?.name ?? communitySlug,
    });
  }

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
    const { data: promoted } = await supabase
      .from("community_members")
      .update({ status: "active" })
      .eq("id", next.id)
      .select("user_id, community:communities(name, slug)")
      .single();

    if (promoted) {
      const community = promoted.community as { name?: string; slug?: string } | null;
      await createNotification(promoted.user_id, "waitlist_spot_opened", {
        community_name: community?.name ?? "",
        community_slug: community?.slug ?? "",
      });
    }
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
