// Skeleton for the Events page. Mirrors the real page: fixed AppNav, "Events"
// title, and a short list of upcoming-event rows.
export default function EventsLoading() {
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

      <main style={{ maxWidth: 480, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
        <div className="skeleton-shimmer" style={{ width: 120, height: 28, marginBottom: 20 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, border: "1px solid var(--border)", borderRadius: "1rem", padding: "0.9rem 1rem" }}>
              <div className="skeleton-shimmer" style={{ width: 52, height: 52, borderRadius: "0.75rem", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-shimmer" style={{ width: "75%", height: 16, marginBottom: 8 }} />
                <div className="skeleton-shimmer" style={{ width: "50%", height: 12, marginBottom: 10 }} />
                <div className="skeleton-shimmer" style={{ width: 90, height: 20, borderRadius: 9999 }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
