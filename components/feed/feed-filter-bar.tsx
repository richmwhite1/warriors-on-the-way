"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTERS = [
  { label: "All", value: "" },
  { label: "Discussions", value: "discussion" },
  { label: "Events", value: "event" },
  { label: "Videos", value: "video" },
  { label: "Music", value: "music" },
] as const;

export function FeedFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("type") ?? "";

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
            current === f.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
