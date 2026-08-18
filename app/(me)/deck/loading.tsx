// Skeleton for the Deck (authenticated home). Mirrors the real page: fixed AppNav,
// "Deck" title, the objective pill row, subtitle, and a couple of feed cards.
export default function DeckLoading() {
  return (
    <>
      {/* App nav placeholder */}
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

      <main style={{ maxWidth: 480, margin: "0 auto", paddingBottom: "5rem" }}>
        {/* Title */}
        <div style={{ padding: "1rem 1rem 0.75rem" }}>
          <div className="skeleton-shimmer" style={{ width: 120, height: 28 }} />
        </div>

        {/* Objective pills */}
        <div style={{ display: "flex", gap: 8, padding: "0 1rem", overflowX: "hidden" }}>
          {[64, 88, 72, 96, 68].map((w, i) => (
            <div key={i} className="skeleton-shimmer" style={{ width: w, height: 32, borderRadius: 9999, flexShrink: 0 }} />
          ))}
        </div>

        {/* Subtitle + follow */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "0.75rem 1rem 0" }}>
          <div style={{ flex: 1 }}>
            <div className="skeleton-shimmer" style={{ width: "90%", height: 14, marginBottom: 6 }} />
            <div className="skeleton-shimmer" style={{ width: 120, height: 13 }} />
          </div>
          <div className="skeleton-shimmer" style={{ width: 72, height: 30, borderRadius: 9999, flexShrink: 0 }} />
        </div>

        {/* Feed cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "1rem" }}>
          {/* Composer placeholder */}
          <div className="skeleton-shimmer" style={{ width: "100%", height: 52, borderRadius: "1rem" }} />
          {[1, 2].map((i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: 16 }}>
                <div className="skeleton-shimmer" style={{ width: 40, height: 40, borderRadius: "50%" }} />
                <div>
                  <div className="skeleton-shimmer" style={{ width: 120, height: 14, marginBottom: 6 }} />
                  <div className="skeleton-shimmer" style={{ width: 60, height: 10 }} />
                </div>
              </div>
              <div className="skeleton-shimmer" style={{ width: "90%", height: 14, marginBottom: 8 }} />
              <div className="skeleton-shimmer" style={{ width: "70%", height: 14, marginBottom: 8 }} />
              <div className="skeleton-shimmer" style={{ width: "40%", height: 14 }} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
