import { createClient } from "@/lib/supabase/server";

// Stub for Phase 6 DM feature — returns 0 until direct_messages table is active
export async function getUnreadDMCount(_userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", _userId)
      .is("read_at", null)
      .is("deleted_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}
