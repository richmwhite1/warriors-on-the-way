import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        background: "#ffffff",
      }}
    >
      <div style={{ width: 64, height: 64, marginBottom: "2rem" }}>
        <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
          <circle cx="48" cy="48" r="46" stroke="#e8e2da" strokeWidth="0.5" strokeDasharray="3 5" />
          <circle cx="48" cy="48" r="34" stroke="#e8e2da" strokeWidth="0.5" />
          <circle cx="48" cy="48" r="22" stroke="#e07040" strokeWidth="0.5" opacity="0.4" />
          <circle cx="48" cy="48" r="4" fill="#e07040" opacity="0.5" />
        </svg>
      </div>

      <p
        style={{
          fontFamily: "var(--font-brand)",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.36em",
          textTransform: "uppercase",
          color: "#e07040",
          marginBottom: "1rem",
        }}
      >
        Lost on the path
      </p>

      <h1
        style={{
          fontFamily: "var(--font-brand)",
          fontWeight: 900,
          fontSize: "clamp(2.5rem, 8vw, 5rem)",
          color: "#1a1a2e",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          lineHeight: 1,
          marginBottom: "1rem",
        }}
      >
        404
      </h1>

      <p
        style={{
          fontFamily: "var(--font-body)",
          color: "#7c7589",
          fontSize: "1.05rem",
          maxWidth: 400,
          lineHeight: 1.7,
          marginBottom: "2.5rem",
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/"
        style={{
          fontFamily: "var(--font-brand)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#ffffff",
          background: "#1a1a2e",
          padding: "1rem 2.5rem",
          textDecoration: "none",
          border: "1px solid #1a1a2e",
        }}
      >
        Return Home
      </Link>
    </main>
  );
}
