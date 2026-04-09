import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { listParentResources } from "@/lib/queries/resources";
import { getParentCommunity } from "@/lib/queries/communities";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/types/resources";

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
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-3xl font-heading font-semibold">Resources</h1>
          <p className="text-muted-foreground leading-relaxed">
            A curated collection of books, practitioners, and tools that{" "}
            {parent?.name ?? "Warriors on the Way"} recommends for your journey.
            Open to everyone — no account required.
          </p>
        </div>

        {/* Resource sections */}
        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            Resources are being curated — check back soon.
          </div>
        ) : (
          grouped.map(({ cat, items }) => (
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
          ))
        )}

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
