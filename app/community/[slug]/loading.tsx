export default function CommunityDetailLoading() {
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

      <main style={{ maxWidth: 672, margin: "0 auto", padding: "2rem 1rem 6rem" }}>
        {/* Community header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="skeleton-shimmer" style={{ width: "60%", height: 28, marginBottom: 8 }} />
          <div className="skeleton-shimmer" style={{ width: "80%", height: 14, marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div className="skeleton-shimmer" style={{ width: 80, height: 28, borderRadius: 9999 }} />
            <div className="skeleton-shimmer" style={{ width: 100, height: 28, borderRadius: 9999 }} />
          </div>
        </div>

        {/* Tabs / filter bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer" style={{ width: 70, height: 32, borderRadius: 9999 }} />
          ))}
        </div>

        {/* Post composer placeholder */}
        <div className="skeleton-shimmer" style={{ width: "100%", height: 60, borderRadius: "0.75rem", marginBottom: "1rem" }} />

        {/* Feed posts */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ border: "1px solid #e8e2da", borderRadius: "1rem", padding: "1.25rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: 16 }}>
              <div className="skeleton-shimmer" style={{ width: 40, height: 40, borderRadius: "50%" }} />
              <div>
                <div className="skeleton-shimmer" style={{ width: 120, height: 14, marginBottom: 6 }} />
                <div className="skeleton-shimmer" style={{ width: 60, height: 10 }} />
              </div>
            </div>
            <div className="skeleton-shimmer" style={{ width: "90%", height: 14, marginBottom: 8 }} />
            <div className="skeleton-shimmer" style={{ width: "65%", height: 14, marginBottom: 8 }} />
            <div className="skeleton-shimmer" style={{ width: "45%", height: 14 }} />
          </div>
        ))}
      </main>
    </>
  );
}
