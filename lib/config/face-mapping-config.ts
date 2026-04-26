/**
 * Face decal tunables.
 * `headFraction` = where the face center sits as a fraction of total model height (0=feet, 1=top).
 * `sizeRelative`  = face plane width & height as fraction of model height.
 */
export const FACE_DECAL_CONFIG = {
  /** 0–1 fraction of model height (1 = very top of head) */
  headFraction: 0.915,
  /** width, height as fraction of model height */
  sizeRelative: [0.12, 0.14] as [number, number],
  /** push plane forward (Z) relative to model depth center */
  forwardOffset: 0.065,
  renderOrder: 14,
  /** elliptical feather: 0 = hard edge, 1 = very soft */
  feather: 0.38,
  opacity: 0.92,
} as const;
