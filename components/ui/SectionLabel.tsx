export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-brand)",
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "#a07828",
        display: "block",
        marginBottom: "1.25rem",
      }}
    >
      {children}
    </span>
  );
}
