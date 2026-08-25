import {
  Compass, LifeBuoy, HandHeart, UsersRound, Flower2, Sprout, Circle,
} from "lucide-react";

// Maps the icon-name strings seeded on `needs` to lucide components — the same
// string-to-component pattern as TopicIcon, so the two taxonomies render alike.
const MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  compass: Compass,
  "life-buoy": LifeBuoy,
  "hand-heart": HandHeart,
  "users-round": UsersRound,
  "flower-2": Flower2,
  sprout: Sprout,
};

export function NeedIcon({ icon, size = 28, color = "var(--primary)" }: { icon: string | null; size?: number; color?: string }) {
  const Cmp = (icon && MAP[icon]) || Circle;
  return <Cmp size={size} strokeWidth={1.5} color={color} />;
}
