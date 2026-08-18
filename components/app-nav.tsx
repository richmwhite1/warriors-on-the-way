import Link from "next/link";
import { requireUserProfile } from "@/lib/queries/users";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { TopNavLinks } from "@/components/top-nav-links";

export async function AppNav() {
  const user = await requireUserProfile().catch(() => null);
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <>
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        {/* Wordmark */}
        <Link
          href="/deck"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: "var(--foreground)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Warriors on the Way
        </Link>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Primary + secondary destinations — see components/nav-config.tsx */}
          <TopNavLinks />

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <NotificationBell initialCount={unreadCount} userId={user.id} />

              <Link
                href="/profile"
                aria-label="You"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
              >
                <Avatar
                  className="size-8"
                  style={{ outline: "2px solid #f5f0eb" }}
                >
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback
                    style={{
                      fontFamily: "var(--font-brand)",
                      fontSize: 12,
                      fontWeight: 700,
                      background: "var(--primary)",
                      color: "#ffffff",
                      borderRadius: "9999px",
                    }}
                  >
                    {user.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
    {/* Spacer so content always starts below the fixed bar */}
    <div style={{ height: 60 }} aria-hidden />
    </>
  );
}
