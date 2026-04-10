import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { requireUserProfile } from "@/lib/queries/users";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button-variants";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";

export async function AppNav() {
  const user = await requireUserProfile().catch(() => null);
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/home"
          className="font-heading font-semibold text-lg text-foreground hover:text-primary transition-colors"
        >
          Warriors on the Way
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/resources"
            className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Resources
          </Link>

          <Link
            href="/install"
            className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Install app
          </Link>

          <Link
            href="/community/new"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden sm:flex"
            )}
          >
            + New community
          </Link>

          {user && (
            <div className="flex items-center gap-2">
              <NotificationBell initialCount={unreadCount} />
              <Link href="/profile" className="flex items-center gap-2 group">
                <Avatar className="size-8">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {user.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {user.display_name}
                </span>
              </Link>

              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
