// Skeleton for the Notifications page. Mirrors the real page: fixed AppNav, title,
// and a bordered list of notification rows.
export default function NotificationsLoading() {
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
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="skeleton-shimmer" style={{ width: 160, height: 20 }} />
          <div className="skeleton-shimmer" style={{ width: 32, height: 32, borderRadius: "50%" }} />
        </div>
      </header>
      <div style={{ height: 60 }} aria-hidden />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="skeleton-shimmer" style={{ width: 180, height: 26, marginBottom: 24 }} />

        <div style={{ border: "1px solid var(--border)", borderRadius: "1rem", overflow: "hidden" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "1rem", borderTop: i === 1 ? "none" : "1px solid var(--border)" }}>
              <div className="skeleton-shimmer" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-shimmer" style={{ width: "80%", height: 14, marginBottom: 8 }} />
                <div className="skeleton-shimmer" style={{ width: "40%", height: 11 }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
