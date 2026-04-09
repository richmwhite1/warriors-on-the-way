import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/lib/types/resources";

export type { ResourceCategory, Resource } from "@/lib/types/resources";
export { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/types/resources";

export async function listCommunityResources(communityId: string): Promise<Resource[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("community_id", communityId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data as Resource[]) ?? [];
}

export async function listParentResources(): Promise<Resource[]> {
  const supabase = await createClient();
  const { data: parent } = await supabase
    .from("communities")
    .select("id")
    .eq("is_parent", true)
    .single();

  if (!parent) return [];

  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("community_id", parent.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data as Resource[]) ?? [];
}
