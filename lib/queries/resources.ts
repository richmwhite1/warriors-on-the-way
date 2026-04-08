import { createClient } from "@/lib/supabase/server";

export type ResourceCategory = "book" | "link" | "article" | "video" | "organization";

export type Resource = {
  id: string;
  community_id: string;
  category: ResourceCategory;
  title: string;
  description: string | null;
  url: string | null;
  author: string | null;
  sort_order: number;
  created_at: string;
};

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  book: "Books",
  link: "Links",
  article: "Articles",
  video: "Videos",
  organization: "Organizations",
};

export const CATEGORY_ORDER: ResourceCategory[] = [
  "book",
  "article",
  "link",
  "video",
  "organization",
];

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
