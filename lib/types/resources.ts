export type ResourceCategory = "book" | "link" | "article" | "video" | "organization" | "practitioner";

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
  article: "Articles",
  practitioner: "Practitioners",
  organization: "Organizations",
  link: "Links",
  video: "Videos",
};

export const CATEGORY_ORDER: ResourceCategory[] = [
  "book",
  "article",
  "practitioner",
  "organization",
  "link",
  "video",
];
