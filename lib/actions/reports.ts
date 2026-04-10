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

  const admin = createAdminClient();
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
