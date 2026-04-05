import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  name: string;
  slug: string;
  description: string | null;
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
  isPrivate,
  isParent,
  memberCount,
  memberCap,
  role,
}: Props) {
  const isFull = memberCount >= memberCap;
  const pct = Math.round((memberCount / memberCap) * 100);

  return (
    <Link href={`/community/${slug}`} className="block group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader className="pb-2 gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-semibold text-foreground leading-tight">
              {name}
            </h3>
            <div className="flex gap-1 shrink-0">
              {isParent && (
                <Badge variant="secondary" className="text-xs">
                  North Star
                </Badge>
              )}
              {isPrivate && (
                <Badge variant="outline" className="text-xs">
                  Private
                </Badge>
              )}
              {role && (
                <Badge className="text-xs capitalize">{role}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          {/* Member bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{memberCount} members</span>
              <span className={isFull ? "text-destructive" : ""}>
                {isFull ? "Full" : `${memberCap - memberCount} spots left`}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
