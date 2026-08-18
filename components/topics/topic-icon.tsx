import {
  GraduationCap, Coins, HeartPulse, BookOpen, Clapperboard,
  Wheat, Flame, Landmark, Sparkles, Circle,
} from "lucide-react";

const MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>> = {
  "graduation-cap": GraduationCap,
  coins: Coins,
  "heart-pulse": HeartPulse,
  "book-open": BookOpen,
  clapperboard: Clapperboard,
  wheat: Wheat,
  flame: Flame,
  landmark: Landmark,
  sparkles: Sparkles,
};

export function TopicIcon({ icon, size = 28, color = "var(--primary)" }: { icon: string | null; size?: number; color?: string }) {
  const Cmp = (icon && MAP[icon]) || Circle;
  return <Cmp size={size} strokeWidth={1.5} color={color} />;
}
