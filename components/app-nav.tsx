import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { requireUserProfile } from "@/lib/queries/users";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";

export async function AppNav() {
  const user = await requireUserProfile().catch(() => null);
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(26,22,16,0.96)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "1.1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Wordmark */}
        <Link
          href="/home"
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#f8f7f4",
            textDecoration: "none",
          }}
        >
          Warriors on the Way
        </Link>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link
            href="/consciousness-map"
            className="hidden sm:block"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#c8c2b4",
              textDecoration: "none",
            }}
          >
            Consciousness Map
          </Link>

          <Link
            href="/resources"
            className="hidden sm:block"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#c8c2b4",
              textDecoration: "none",
            }}
          >
            Resources
          </Link>

          <Link
            href="/community/new"
            className="hidden sm:block"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#1a1610",
              background: "#c4a050",
              padding: "0.5rem 1.25rem",
              textDecoration: "none",
              border: "1px solid #c4a050",
            }}
          >
            + New Community
          </Link>

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <NotificationBell initialCount={unreadCount} userId={user.id} />

              <Link
                href="/profile"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}
              >
                <Avatar
                  className="size-8"
                  style={{ outline: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback
                    style={{
                      fontFamily: "var(--font-brand)",
                      fontSize: 10,
                      background: "#2e2820",
                      color: "#c4a050",
                    }}
                  >
                    {user.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="hidden sm:block"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#6b6456",
                  }}
                >
                  {user.display_name.split(" ")[0]}
                </span>
              </Link>

              <form action={signOut}>
                <button
                  type="submit"
                  style={{
                    fontFamily: "var(--font-brand)",
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#c8c2b4",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
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
