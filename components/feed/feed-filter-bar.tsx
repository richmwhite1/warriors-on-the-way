"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const FILTERS: { label: string; value: string; icon: string }[] = [
  { label: "All", value: "", icon: "◈" },
  { label: "Discussions", value: "discussion", icon: "💬" },
  { label: "Reflections", value: "reflection", icon: "🌅" },
  { label: "Wisdom", value: "wisdom", icon: "✨" },
  { label: "Prayers", value: "prayer", icon: "🙏" },
  { label: "Events", value: "event", icon: "📅" },
  { label: "Videos", value: "video", icon: "🎬" },
  { label: "Music", value: "music", icon: "🎵" },
];

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
    <div className="sticky top-[60px] z-20 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur border-b border-border/50">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors shrink-0",
              current === f.value
                ? "bg-primary/10 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span className="text-sm leading-none">{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
