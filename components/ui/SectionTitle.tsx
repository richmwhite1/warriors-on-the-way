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
        fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
        fontWeight: 900,
        color: light ? "white" : "#1a1610",
        lineHeight: 1.1,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        marginBottom: "1.25rem",
      }}
    >
      {children}
    </h2>
  );
}
