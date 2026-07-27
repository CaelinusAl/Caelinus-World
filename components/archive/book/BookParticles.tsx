import type { CSSProperties } from "react";

const PARTICLES = Array.from({ length: 16 }, (_, index) => ({
  left: `${(index * 43) % 97}%`,
  top: `${12 + ((index * 29) % 76)}%`,
  delay: `${(index % 8) * 110}ms`,
  size: `${1 + (index % 3)}px`,
}));

/** Finite, CSS-only dust. Reduced Motion disables it in the book stylesheet. */
export default function BookParticles() {
  return (
    <div className="codex-dust" aria-hidden="true">
      {PARTICLES.map((particle, index) => (
        <i
          key={index}
          style={{
            "--dust-left": particle.left,
            "--dust-top": particle.top,
            "--dust-delay": particle.delay,
            "--dust-size": particle.size,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
