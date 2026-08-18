// Skeleton for the Topics directory. Mirrors the real page: no AppNav (own layout),
// "Topics" title, and a vertical list of the nine objective rows.
export default function TopicsLoading() {
  return (
    <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>
        <div className="skeleton-shimmer" style={{ width: 140, height: 28, marginBottom: 8 }} />
        <div className="skeleton-shimmer" style={{ width: "70%", height: 14, marginBottom: 24 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--border)", borderRadius: "1rem", padding: "18px 16px" }}>
              <div className="skeleton-shimmer" style={{ width: 40, height: 40, borderRadius: "0.75rem", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-shimmer" style={{ width: "45%", height: 16, marginBottom: 8 }} />
                <div className="skeleton-shimmer" style={{ width: "80%", height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
