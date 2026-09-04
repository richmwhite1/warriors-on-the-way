"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/actions/notifications";

export async function actionReport(
  reportId: string,
  action: "actioned" | "dismissed",
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // This runs on the service role, so RLS is not the perimeter here — and the
  // page-level steward gate does not protect a server action, which any signed-in
  // user can invoke directly. Without this check, "actioned" let anyone soft-delete
  // any post or comment and suspend any account. Authorization has to happen in the
  // action itself.
  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("reports")
    .select("community_id")
    .eq("id", reportId)
    .single();
  if (!pending) throw new Error("Report not found");

  let authorized = false;
  if (pending.community_id) {
    const { data: membership } = await admin
      .from("community_members")
      .select("role")
      .eq("community_id", pending.community_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    authorized = !!membership && ["admin", "organizer"].includes(membership.role);
  }
  if (!authorized) {
    // Platform-wide reports (no community) and anything else fall to a parent-community
    // organizer, which is the same bar RLS uses for reading reports at all.
    const { data: parent } = await admin
      .from("communities")
      .select("id")
      .eq("is_parent", true)
      .maybeSingle();
    if (parent) {
      const { data: parentMembership } = await admin
        .from("community_members")
        .select("role")
        .eq("community_id", parent.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      authorized = parentMembership?.role === "organizer";
    }
  }
  if (!authorized) throw new Error("Not authorized");

  const { data: report } = await admin
    .from("reports")
    .update({
      status: action,
      actioned_by: user.id,
      actioned_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .select("reporter_id, target_type, target_id")
    .single();

  if (report) {
    // When actioned (not dismissed), remove the offending content
    if (action === "actioned") {
      const now = new Date().toISOString();
      if (report.target_type === "post") {
        await admin
          .from("posts")
          .update({ deleted_at: now })
          .eq("id", report.target_id);
      } else if (report.target_type === "comment") {
        await admin
          .from("comments")
          .update({ deleted_at: now })
          .eq("id", report.target_id);
      } else if (report.target_type === "user") {
        await admin
          .from("users")
          .update({ suspended_at: now })
          .eq("id", report.target_id);
      }
    }

    await createNotification(report.reporter_id, "report_actioned", {
      action,
      target_type: report.target_type,
      community_slug: communitySlug,
    });
  }

  revalidatePath(`/community/${communitySlug}/reports`);
}

export async function reportUser(targetUserId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Reason is required");
  if (targetUserId === user.id) throw new Error("Cannot report yourself");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: "user",
    target_id: targetUserId,
    reason: trimmed,
  });

  if (error) throw new Error(error.message);
}
