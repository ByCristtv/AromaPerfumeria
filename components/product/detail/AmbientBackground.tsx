/**
 * Soft ambient backdrop for the product detail page.
 * Two large gold radial blooms drift behind content for a luxurious,
 * cinematic feel. Pure CSS — no JS cost, no layout impact.
 */
export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white"
    >
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full opacity-[0.18] blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, #c9a96e 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[620px] w-[620px] rounded-full opacity-[0.12] blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, #c9a96e 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
