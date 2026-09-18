/*
  Decorative wavy background for the landing. Two soft, brand-tinted wave bands
  sit fixed behind the content near the bottom of the viewport and drift slowly
  sideways. Purely ornamental: it is aria-hidden, sits behind everything
  (negative z-index), and never intercepts pointer events.

  Kept as inline SVG + a CSS drift animation (no JS, near-zero weight). Each band
  is twice the viewport wide and loops by half its width, so the sway is
  seamless. The global reduced-motion rule freezes the drift for visitors who
  ask for less motion, leaving a static, still-pleasant backdrop.
*/
export function WavyBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Back wave: accent, fainter and slower. */}
      <svg
        className="animate-wave-slow absolute bottom-0 left-0 h-[38vh] w-[200%] text-accent/15"
        viewBox="0 0 2880 320"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,160 C240,240 480,80 720,120 C960,160 1200,280 1440,240 C1680,200 1920,80 2160,120 C2400,160 2640,240 2880,200 L2880,320 L0,320 Z" />
      </svg>

      {/* Front wave: primary, a touch stronger and faster, offset for depth. */}
      <svg
        className="animate-wave-fast absolute bottom-0 left-0 h-[30vh] w-[200%] text-primary/15"
        viewBox="0 0 2880 320"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,220 C240,160 480,280 720,240 C960,200 1200,120 1440,160 C1680,200 1920,300 2160,260 C2400,220 2640,140 2880,180 L2880,320 L0,320 Z" />
      </svg>
    </div>
  );
}
