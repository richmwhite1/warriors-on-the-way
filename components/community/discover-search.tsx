"use client";

import { useState } from "react";
import { CommunityCard } from "@/components/community/community-card";

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  is_private: boolean;
  is_parent: boolean;
  member_cap: number;
  member_count: unknown;
};

export function DiscoverSearch({ communities }: { communities: Community[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? communities.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : communities;

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search communities…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No communities match &ldquo;{query}&rdquo;</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const count = (c.member_count as { count: number }[])?.[0]?.count ?? 0;
            return (
              <CommunityCard
                key={c.id}
                name={c.name}
                slug={c.slug}
                description={c.description}
                bannerUrl={c.banner_url}
                isPrivate={c.is_private}
                isParent={c.is_parent}
                memberCount={count}
                memberCap={c.member_cap}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
