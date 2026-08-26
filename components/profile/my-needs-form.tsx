import { NeedsPicker } from "@/components/needs/needs-picker";
import { updateMyNeeds } from "@/lib/actions/needs";
import type { Need } from "@/lib/queries/needs";

// The needs taxonomy tagged events, offerings, circles and practitioners — everything
// except the person doing the looking. So the menu was identical for everyone, and when
// a grief circle finally opened there was no way to tell the eleven people who had asked
// for one.
//
// Private by design (enforced by RLS on user_needs, not by this form): "I need support"
// is a disclosure, not a profile field. The copy says so, because someone deciding
// whether to tick that box deserves to know who can see it before they do.
export function MyNeedsForm({ needs, selected }: { needs: Need[]; selected: string[] }) {
  return (
    <form action={updateMyNeeds} className="space-y-4">
      <NeedsPicker
        needs={needs}
        defaultSelected={selected}
        legend="What are you looking for?"
        hint="Only you can see this. It's how we know who to tell when something opens."
        emptyHint="Nothing selected — you won't hear about new circles as they open."
      />
      <button
        type="submit"
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Save what I&rsquo;m looking for
      </button>
    </form>
  );
}
