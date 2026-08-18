export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-brand)",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "0.01em",
        color: "var(--foreground)",
        display: "block",
        marginBottom: "0.75rem",
      }}
    >
      {children}
    </h2>
  );
}
