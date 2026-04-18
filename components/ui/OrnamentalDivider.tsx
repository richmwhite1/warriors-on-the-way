export function OrnamentalDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-5">
      <div
        className="flex-1 h-px"
        style={{
          maxWidth: 320,
          background: "linear-gradient(to left, #ede9e1, transparent)",
        }}
      />
      <span
        style={{
          color: "#a07828",
          fontSize: 8,
          letterSpacing: 5,
          opacity: 0.8,
          fontFamily: "var(--font-brand)",
        }}
      >
        ✦ ✦ ✦
      </span>
      <div
        className="flex-1 h-px"
        style={{
          maxWidth: 320,
          background: "linear-gradient(to right, #ede9e1, transparent)",
        }}
      />
    </div>
  );
}
