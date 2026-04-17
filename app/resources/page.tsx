import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { listParentResources } from "@/lib/queries/resources";
import { getParentCommunity } from "@/lib/queries/communities";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/types/resources";
import { SACRED_TEXT_GROUPS, TEACHER_GROUPS, type CalibrationGroup } from "@/lib/data/calibrations";

export const metadata = {
  title: "Resources · Warriors on the Way",
  description: "Books, practitioners, and tools recommended by Warriors on the Way.",
};

const CATEGORY_ICONS: Record<string, string> = {
  book: "📚",
  article: "📄",
  practitioner: "🧭",
  organization: "🏛️",
  link: "🔗",
  video: "🎥",
};

// Colour for calibration badge based on level
function levelColor(level: number): string {
  if (level >= 900) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  if (level >= 800) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  if (level >= 700) return "text-lime-500 bg-lime-500/10 border-lime-500/20";
  if (level >= 600) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  if (level >= 500) return "text-sky-500 bg-sky-500/10 border-sky-500/20";
  return "text-muted-foreground bg-muted border-border";
}

function CalibrationSection({ icon, title, groups }: { icon: string; title: string; groups: CalibrationGroup[] }) {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h2 className="text-lg font-heading font-semibold">{title}</h2>
        </div>
        <p className="text-sm text-muted-foreground pl-8">
          Consciousness levels as calibrated by Dr. David R. Hawkins
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.range} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                Level {group.range}{group.label ? ` · ${group.label}` : ""}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div
                  key={`${item.title}-${item.level}`}
                  className="flex items-start gap-3 rounded-xl border bg-card px-4 py-3"
                >
                  <span className={`shrink-0 mt-0.5 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border ${levelColor(item.level)}`}>
                    {item.level.toLocaleString()}
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {item.author && (
                        <span className="text-xs text-muted-foreground">by {item.author}</span>
                      )}
                      {item.note && (
                        <span className="text-xs text-muted-foreground italic">{item.note}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ResourcesPage() {
  const [resources, parent] = await Promise.all([
    listParentResources(),
    getParentCommunity(),
  ]);

  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: resources.filter((r) => r.category === cat) }))
    .filter(({ items }) => items.length > 0);

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-12">

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-heading font-semibold">Resources</h1>
          <p className="text-muted-foreground leading-relaxed">
            Curated by Seán Ó'Laoire and the Warriors on the Way community —
            books, practitioners, and tools for the journey.
            Open to everyone, no account required.
          </p>
        </div>

        {/* DB-sourced resource sections */}
        {grouped.map(({ cat, items }) => (
          <section key={cat} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
              <h2 className="text-lg font-heading font-semibold">{CATEGORY_LABELS[cat]}</h2>
            </div>
            <div className="space-y-3">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border bg-card p-5 space-y-2 hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium leading-snug">{r.title}</p>
                      {r.author && (
                        <p className="text-sm text-muted-foreground">by {r.author}</p>
                      )}
                    </div>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-sm font-medium text-primary hover:underline underline-offset-2"
                      >
                        Visit ↗
                      </a>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {r.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* ── Sacred Texts Calibrations ──────────────────────────────── */}
        <CalibrationSection
          icon="🕊️"
          title="Sacred Texts Calibrations"
          groups={SACRED_TEXT_GROUPS}
        />

        {/* ── Spiritual Teachers Calibrations ────────────────────────── */}
        <CalibrationSection
          icon="✨"
          title="Spiritual Teachers Calibrations"
          groups={TEACHER_GROUPS}
        />

        {/* Footer CTA */}
        <div className="rounded-2xl border bg-muted/40 p-6 text-center space-y-3">
          <p className="font-medium">Want to go deeper?</p>
          <p className="text-sm text-muted-foreground">
            Warriors on the Way brings people together in local communities of practice.
          </p>
          <Link
            href="/home"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium px-5 py-2 hover:opacity-90 transition-opacity"
          >
            Find a community
          </Link>
        </div>
      </main>
    </>
  );
}
