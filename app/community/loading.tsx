export default function CommunityLoading() {
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

      <main style={{ maxWidth: 896, margin: "0 auto", padding: "2rem 1rem 6rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div className="skeleton-shimmer" style={{ width: 140, height: 28 }} />
          <div className="skeleton-shimmer" style={{ width: 120, height: 36, borderRadius: 9999 }} />
        </div>

        {/* My Groups */}
        <div className="skeleton-shimmer" style={{ width: 110, height: 18, marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem", marginBottom: "2.5rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ border: "1px solid #e8e2da", borderRadius: "1rem", padding: "1.25rem" }}>
              <div className="skeleton-shimmer" style={{ width: "75%", height: 18, marginBottom: 8 }} />
              <div className="skeleton-shimmer" style={{ width: "50%", height: 14, marginBottom: 12 }} />
              <div className="skeleton-shimmer" style={{ width: 80, height: 24, borderRadius: 9999 }} />
            </div>
          ))}
        </div>

        {/* Discover */}
        <div className="skeleton-shimmer" style={{ width: 130, height: 18, marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ border: "1px solid #e8e2da", borderRadius: "1rem", padding: "1.25rem" }}>
              <div className="skeleton-shimmer" style={{ width: "80%", height: 18, marginBottom: 8 }} />
              <div className="skeleton-shimmer" style={{ width: "60%", height: 14, marginBottom: 8 }} />
              <div className="skeleton-shimmer" style={{ width: "40%", height: 14 }} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
