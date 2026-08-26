import { MapPin, Video, Blend } from "lucide-react";
import type { GatheringFormat } from "@/lib/queries/needs";

const MAP: Record<GatheringFormat, { label: string; Icon: typeof MapPin }> = {
  in_person: { label: "In person", Icon: MapPin },
  online: { label: "Online", Icon: Video },
  hybrid: { label: "In person + online", Icon: Blend },
};

// "Can I actually get there" is the first question anyone asks of a gathering, and
// free-text location couldn't answer it — an online circle read exactly like one meeting
// across the valley. In-person is the common case and the quiet default, so it only
// earns a badge where it's doing work (a detail page); lists show the exceptions.
export function FormatBadge({
  format,
  showInPerson = false,
}: {
  format: GatheringFormat;
  showInPerson?: boolean;
}) {
  if (format === "in_person" && !showInPerson) return null;
  const { label, Icon } = MAP[format];

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
      <Icon size={11} strokeWidth={2} aria-hidden />
      {label}
    </span>
  );
}
