"use client";

import type { ReactNode, RefObject } from "react";

type PageTransitionProps = {
  transitionKey: number;
  sceneRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
};

/** Visual adapter only: critical state changes happen before this renders. */
export default function PageTransition({
  transitionKey,
  sceneRef,
  children,
}: PageTransitionProps) {
  return (
    <div key={transitionKey} ref={sceneRef} className="archive-scene" tabIndex={-1}>
      {children}
    </div>
  );
}
