import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import {
  listCommunityResources,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/lib/queries/resources";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);
  return { title: `Resources · ${c?.name ?? slug}` };
}

export default async function ResourcesPage({ params }: Props) {
  const { slug } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  if (!membership || membership.status !== "active") redirect(`/community/${slug}`);

  const isAdmin = membership.role === "admin" || membership.role === "organizer";
  const resources = await listCommunityResources(community.id);

  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, items: resources.filter((r) => r.category === cat) }))
    .filter(({ items }) => items.length > 0);

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href={`/community/${slug}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← {community.name}
            </Link>
            <h1 className="text-2xl font-heading font-semibold mt-1">Resources</h1>
            {community.description && (
              <p className="text-sm text-muted-foreground mt-1">{community.description}</p>
            )}
          </div>
          {isAdmin && (
            <Link
              href={`/community/${slug}/settings#resources`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Manage
            </Link>
          )}
        </div>

        {grouped.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
            <p className="text-muted-foreground">No resources added yet.</p>
            {isAdmin && (
              <Link
                href={`/community/${slug}/settings#resources`}
                className={cn(buttonVariants(), "rounded-full")}
              >
                Add the first resource
              </Link>
            )}
          </div>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat} className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="space-y-2">
                {items.map((r) => (
                  <div key={r.id} className="rounded-2xl border bg-card p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-sm leading-snug">{r.title}</p>
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline underline-offset-2 hover:opacity-80 shrink-0"
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                    {r.author && (
                      <p className="text-xs text-muted-foreground">by {r.author}</p>
                    )}
                    {r.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  );
}
