export function SectionTitle({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-brand)",
        fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
        fontWeight: 800,
        color: light ? "white" : "#1a1a2e",
        lineHeight: 1.1,
        letterSpacing: "-0.01em",
        marginBottom: "1rem",
      }}
    >
      {children}
    </h2>
  );
}
