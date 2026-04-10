import { createAdminClient } from "@/lib/supabase/admin";

export type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: "post" | "comment" | "user" | "community";
  target_id: string;
  reason: string;
  status: "open" | "reviewed" | "actioned" | "dismissed";
  created_at: string;
  reporter: { display_name: string; avatar_url: string | null } | null;
};

export async function listOpenReportsForCommunity(communityId: string): Promise<ReportRow[]> {
  const admin = createAdminClient();

  // Fetch post IDs for this community first (Supabase JS v2 doesn't support subqueries in .in())
  const { data: posts } = await admin
    .from("posts")
    .select("id")
    .eq("community_id", communityId)
    .is("deleted_at", null);

  const postIds = (posts ?? []).map((p: { id: string }) => p.id);
  if (postIds.length === 0) return [];

  const { data } = await admin
    .from("reports")
    .select(`
      id, reporter_id, target_type, target_id, reason, status, created_at,
      reporter:users!reporter_id(display_name, avatar_url)
    `)
    .eq("status", "open")
    .in("target_id", postIds)
    .order("created_at", { ascending: false });

  return (data as unknown as ReportRow[]) ?? [];
}
