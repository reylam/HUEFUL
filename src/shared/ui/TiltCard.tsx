import { useRef } from "react";
import type { PointerEvent, ReactNode } from "react";
import gsap from "gsap";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees at the edges. */
  max?: number;
}

/*
  A card that tilts in 3D toward the pointer, with a soft light glare that
  tracks the cursor. Adds a little tactile "wow" to feature and stat cards on
  devices with a real pointer.

  Motion is GSAP (quick tweens on transform), which the project already ships.
  It only engages for fine pointers (mouse), so touch users get a normal flat,
  tappable card, and it respects prefers-reduced-motion (no tilt, no glare) so
  it never becomes distracting motion. On pointer leave the card eases back to
  rest, so it can never get stuck at an angle.
*/
export function TiltCard({ children, className, max = 8 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);

  const canTilt = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || !canTilt()) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const rotateY = (px - 0.5) * (max * 2);
    const rotateX = (0.5 - py) * (max * 2);

    gsap.to(card, {
      rotateX,
      rotateY,
      transformPerspective: 800,
      transformOrigin: "center",
      duration: 0.3,
      ease: "power2.out",
    });
    if (glareRef.current) {
      gsap.to(glareRef.current, {
        opacity: 1,
        duration: 0.3,
        background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.16), transparent 55%)`,
      });
    }
  };

  const onLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "power3.out" });
    if (glareRef.current) gsap.to(glareRef.current, { opacity: 0, duration: 0.4 });
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={["relative [transform-style:preserve-3d]", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      <span
        ref={glareRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0"
      />
    </div>
  );
}
