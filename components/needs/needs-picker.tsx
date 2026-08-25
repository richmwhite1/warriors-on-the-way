"use client";

import { useState } from "react";
import { NeedIcon } from "@/components/needs/need-icon";
import type { Need } from "@/lib/queries/needs";

// The doorway picker — shared by the create/edit event forms and the offering form
// so tagging feels identical wherever you do it.
//
// This is the single most consequential field on those forms: an untagged gathering
// is invisible to anyone navigating by felt need, which is now the front door. So the
// copy asks the human question ("who is this for?") rather than naming the data model.
export function NeedsPicker({
  needs,
  defaultSelected = [],
}: {
  needs: Need[];
  defaultSelected?: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <fieldset className="space-y-2.5">
      <legend className="text-sm font-medium">Who is this for?</legend>
      <p className="text-xs text-muted-foreground">
        Pick every doorway this answers — it&rsquo;s how people searching for what you offer will find it.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {needs.map((n) => {
          const on = selected.has(n.id);
          return (
            <label
              key={n.id}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                on ? "border-primary bg-primary/5" : "hover:bg-muted/40"
              }`}
            >
              <input
                type="checkbox"
                name="need_ids"
                value={n.id}
                checked={on}
                onChange={() => toggle(n.id)}
                className="sr-only"
              />
              {/* The check doubles as the state indicator so the row reads at a glance. */}
              <span
                aria-hidden
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
                  on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                }`}
              >
                {on && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <NeedIcon icon={n.icon} size={17} color={on ? "var(--primary)" : "var(--muted-foreground)"} />
              <span className={on ? "font-medium" : ""}>{n.name}</span>
            </label>
          );
        })}
      </div>

      {selected.size === 0 && (
        <p className="text-xs text-muted-foreground/80 pt-0.5">
          Untagged, this stays inside your community and won&rsquo;t show up on the menu.
        </p>
      )}
    </fieldset>
  );
}
