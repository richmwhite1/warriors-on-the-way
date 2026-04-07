import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

// Deterministic warm gradient per community — consistent across renders
const GRADIENTS = [
  "linear-gradient(135deg, oklch(0.32 0.09 42) 0%, oklch(0.22 0.06 55) 100%)",   // terracotta
  "linear-gradient(135deg, oklch(0.28 0.07 148) 0%, oklch(0.20 0.05 165) 100%)", // forest
  "linear-gradient(135deg, oklch(0.30 0.10 290) 0%, oklch(0.22 0.07 310) 100%)", // plum
  "linear-gradient(135deg, oklch(0.38 0.11 75) 0%, oklch(0.26 0.08 55) 100%)",   // ochre
  "linear-gradient(135deg, oklch(0.30 0.08 220) 0%, oklch(0.22 0.05 245) 100%)", // slate
  "linear-gradient(135deg, oklch(0.34 0.09 22) 0%, oklch(0.24 0.07 40) 100%)",   // rust
];

function slugGradient(slug: string): string {
  const hash = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

type Props = {
  name: string;
  slug: string;
  description: string | null;
  bannerUrl?: string | null;
  isPrivate: boolean;
  isParent: boolean;
  memberCount: number;
  memberCap: number;
  role?: string;
};

export function CommunityCard({
  name,
  slug,
  description,
  bannerUrl,
  isPrivate,
  isParent,
  memberCount,
  memberCap,
  role,
}: Props) {
  const isFull = memberCount >= memberCap;
  const pct = Math.round((memberCount / memberCap) * 100);

  return (
    <Link href={`/community/${slug}`} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
      <div className="rounded-2xl border bg-card overflow-hidden h-full flex flex-col transition-shadow group-hover:shadow-lg">

        {/* Banner / gradient header */}
        <div className="relative h-28 w-full shrink-0 overflow-hidden">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div
              className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
              style={{ background: slugGradient(slug) }}
            />
          )}

          {/* Scrim so badges are readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Badges overlaid on banner */}
          <div className="absolute bottom-2.5 left-3 flex gap-1.5 flex-wrap">
            {isParent && (
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/90 text-amber-950 border-0">
                North Star
              </Badge>
            )}
            {isPrivate && (
              <Badge className="text-[10px] px-1.5 py-0 bg-black/50 text-white border-0 backdrop-blur-sm">
                Private
              </Badge>
            )}
            {role && (
              <Badge className="text-[10px] px-1.5 py-0 bg-primary/80 text-primary-foreground border-0 capitalize">
                {role}
              </Badge>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          <h3 className="font-heading font-semibold text-foreground leading-tight">
            {name}
          </h3>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
              {description}
            </p>
          )}

          {/* Member bar */}
          <div className="space-y-1 mt-auto">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{memberCount} members</span>
              <span className={isFull ? "text-destructive font-medium" : ""}>
                {isFull ? "Full" : `${memberCap - memberCount} spots left`}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFull ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
