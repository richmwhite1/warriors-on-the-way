export default function MessagesLoading() {
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

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem 6rem" }}>
        <div className="skeleton-shimmer" style={{ width: 120, height: 24, marginBottom: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", border: "1px solid #e8e2da", borderRadius: "0.75rem" }}>
              <div className="skeleton-shimmer" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-shimmer" style={{ width: 140, height: 14, marginBottom: 6 }} />
                <div className="skeleton-shimmer" style={{ width: "70%", height: 12 }} />
              </div>
              <div className="skeleton-shimmer" style={{ width: 40, height: 10 }} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
