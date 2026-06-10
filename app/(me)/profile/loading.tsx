export default function ProfileLoading() {
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
        {/* Avatar + name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div className="skeleton-shimmer" style={{ width: 88, height: 88, borderRadius: "50%" }} />
          <div className="skeleton-shimmer" style={{ width: 160, height: 22 }} />
          <div className="skeleton-shimmer" style={{ width: 200, height: 14 }} />
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="skeleton-shimmer" style={{ width: 80, height: 12, marginBottom: 6 }} />
              <div className="skeleton-shimmer" style={{ width: "100%", height: 40, borderRadius: "0.5rem" }} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
