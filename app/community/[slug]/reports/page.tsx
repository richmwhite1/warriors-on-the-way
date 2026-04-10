import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { getCommunityBySlug } from "@/lib/queries/communities";
import { getMembership } from "@/lib/queries/members";
import { requireUserProfile } from "@/lib/queries/users";
import { listOpenReportsForCommunity } from "@/lib/queries/reports";
import { actionReport } from "@/lib/actions/reports";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  return { title: community ? `Reports · ${community.name}` : "Reports" };
}

export default async function CommunityReportsPage({ params }: Props) {
  const { slug } = await params;

  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const membership = await getMembership(community.id, user.id);
  const isAdmin = membership?.role === "admin" || membership?.role === "organizer";
  if (!isAdmin) redirect(`/community/${slug}`);

  const reports = await listOpenReportsForCommunity(community.id);

  return (
    <>
      <AppNav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href={`/community/${slug}/settings`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Settings
            </Link>
            <h1 className="text-2xl font-heading font-semibold mt-1">Open reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {reports.length === 0 ? "No open reports" : `${reports.length} open`}
            </p>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            No reports to review. All clear.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-2xl border bg-card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={report.reporter?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(report.reporter?.display_name ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      Reported by{" "}
                      <span className="font-medium text-foreground">
                        {report.reporter?.display_name ?? "Unknown"}
                      </span>
                      {" · "}
                      {new Date(report.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      Type: {report.target_type}
                    </p>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{report.reason}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap pt-1">
                  <form
                    action={async () => {
                      "use server";
                      await actionReport(report.id, "actioned", slug);
                    }}
                  >
                    <button
                      type="submit"
                      className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
                    >
                      Action (remove)
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await actionReport(report.id, "dismissed", slug);
                    }}
                  >
                    <button
                      type="submit"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Dismiss
                    </button>
                  </form>
                  <Link
                    href={`/community/${slug}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    View wall
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
