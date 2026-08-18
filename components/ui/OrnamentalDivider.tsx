export function OrnamentalDivider() {
  return (
    <div className="py-3" aria-hidden="true">
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(to right, transparent, var(--border), transparent)" }}
      />
    </div>
  );
}
