export default function HomeLoading() {
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
          borderBottom: "1px solid #e8e2da",
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

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "0 1rem 6rem" }}>
        {/* Welcome */}
        <div style={{ padding: "1.5rem 0 0" }}>
          <div className="skeleton-shimmer" style={{ width: 120, height: 14, marginBottom: 8 }} />
          <div className="skeleton-shimmer" style={{ width: 180, height: 28 }} />
        </div>

        {/* Upcoming Events */}
        <section style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
          <div className="skeleton-shimmer" style={{ width: 140, height: 16, marginBottom: 12 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ display: "flex", gap: "0.85rem", border: "1px solid #e8e2da", borderRadius: "1rem", padding: "0.9rem 1rem" }}>
                <div className="skeleton-shimmer" style={{ width: 52, height: 56, borderRadius: "0.75rem", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton-shimmer" style={{ width: "80%", height: 16, marginBottom: 8 }} />
                  <div className="skeleton-shimmer" style={{ width: "50%", height: 12, marginBottom: 8 }} />
                  <div className="skeleton-shimmer" style={{ width: 80, height: 20, borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Groups */}
        <section style={{ marginBottom: "1.5rem" }}>
          <div className="skeleton-shimmer" style={{ width: 110, height: 16, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: "0.75rem", overflowX: "hidden" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ minWidth: 160, border: "1px solid #e8e2da", borderRadius: "1rem", padding: "1rem", flexShrink: 0 }}>
                <div className="skeleton-shimmer" style={{ width: "85%", height: 16, marginBottom: 8 }} />
                <div className="skeleton-shimmer" style={{ width: "50%", height: 12, marginBottom: 12 }} />
                <div className="skeleton-shimmer" style={{ width: 60, height: 20, borderRadius: 9999 }} />
              </div>
            ))}
          </div>
        </section>

        {/* Feed */}
        <section>
          <div className="skeleton-shimmer" style={{ width: 80, height: 16, marginBottom: 12 }} />
          {[1, 2].map((i) => (
            <div key={i} style={{ border: "1px solid #e8e2da", borderRadius: "1rem", padding: "1.25rem", marginBottom: "0.75rem" }}>
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
        </section>
      </main>
    </>
  );
}
