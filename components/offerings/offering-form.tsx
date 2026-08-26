import { NeedsPicker } from "@/components/needs/needs-picker";
import type { Need, Offering } from "@/lib/queries/needs";

type Topic = { id: string; name: string };

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// `datetime-local` wants "YYYY-MM-DDTHH:mm" in *local* time; an ISO string with a Z
// suffix silently leaves the field blank, which reads as "no next session" and quietly
// erases the one the steward set.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// One form for creating and editing an offering.
//
// They were separate before — or rather, editing didn't exist at all, so an offering was
// write-once and a mistyped meeting time was permanent. A single form is what keeps the
// two from drifting into saving different subsets of the same thing.
export function OfferingForm({
  action,
  needs,
  topics,
  offering,
  selectedNeedIds = [],
  submitLabel,
  hidden,
}: {
  action: (formData: FormData) => void | Promise<void>;
  needs: Need[];
  topics: Topic[];
  offering?: Offering;
  selectedNeedIds?: string[];
  submitLabel: string;
  /** Extra hidden fields (community id/slug on create). */
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} className="space-y-6">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">Name</label>
        <input
          id="title"
          name="title"
          required
          defaultValue={offering?.title ?? ""}
          placeholder="e.g. Jess's Yoga"
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">What is it?</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={offering?.description ?? ""}
          placeholder="A short, welcoming description."
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="facilitator_name" className="text-sm font-medium">Led by</label>
          <input
            id="facilitator_name"
            name="facilitator_name"
            defaultValue={offering?.facilitator_name ?? ""}
            placeholder="Facilitator name"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="cadence_text" className="text-sm font-medium">When</label>
          <input
            id="cadence_text"
            name="cadence_text"
            defaultValue={offering?.cadence_text ?? ""}
            placeholder="e.g. Tuesdays 6pm"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="location" className="text-sm font-medium">Where</label>
          <input
            id="location"
            name="location"
            defaultValue={offering?.location ?? ""}
            placeholder="Location"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="next_starts_at" className="text-sm font-medium">Next session (optional)</label>
          <input
            id="next_starts_at"
            name="next_starts_at"
            type="datetime-local"
            defaultValue={toLocalInput(offering?.next_starts_at ?? null)}
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground">
            Adding one puts this in &ldquo;This week&rdquo; on the doorway when it&rsquo;s close.
          </p>
        </div>
      </div>

      {/* ── In person, online, or both ─────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="format" className="text-sm font-medium">How do people join?</label>
        <p className="text-xs text-muted-foreground">
          The first thing anyone asks is whether they can actually get there.
        </p>
        <select
          id="format"
          name="format"
          defaultValue={offering?.format ?? "in_person"}
          className={inputClass}
        >
          <option value="in_person">In person</option>
          <option value="online">Online</option>
          <option value="hybrid">Both — in person and online</option>
        </select>
      </div>

      <NeedsPicker
        needs={needs}
        defaultSelected={selectedNeedIds}
        legend="Which doorways does this answer?"
      />

      {/* ── Mission badge (Seán's nine) ────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="topic_id" className="text-sm font-medium">Mission it serves</label>
        <p className="text-xs text-muted-foreground">
          The reclamation this belongs to — shown as a badge on the card.
        </p>
        <select
          id="topic_id"
          name="topic_id"
          defaultValue={offering?.topic_id ?? ""}
          className={inputClass}
        >
          <option value="">— None —</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* ── Optional cost-share note (never a fee) ─────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="cost_note" className="text-sm font-medium">Shared-cost note (optional)</label>
        <input
          id="cost_note"
          name="cost_note"
          defaultValue={offering?.cost_note ?? ""}
          placeholder="e.g. Bring $8 for groceries"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          For chipping in on shared costs only. Nobody ever charges to gather.
        </p>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {submitLabel}
      </button>
    </form>
  );
}
