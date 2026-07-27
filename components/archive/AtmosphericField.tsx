"use client";

import type { CSSProperties } from "react";

const MOTES = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 37) % 97}%`,
  top: `${18 + ((index * 53) % 70)}%`,
  delay: `${(index % 6) * 90}ms`,
}));

/** Finite CSS-only atmosphere; no requestAnimationFrame loop. */
export default function AtmosphericField() {
  return (
    <div className="archive-motes" aria-hidden="true">
      {MOTES.map((mote, index) => (
        <i
          key={index}
          style={{
            "--mote-left": mote.left,
            "--mote-top": mote.top,
            "--mote-delay": mote.delay,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
