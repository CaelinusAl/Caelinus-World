/**
 * Caelinus stage system — barrel export.
 *
 * The "stage" components are the cinematic primitives shared across
 * Atelier (landing, dashboard, public showcase) and Play (avatar
 * studio). They lean on the existing nebula CSS palette but add a
 * dedicated `.stage-*` namespace in `app/globals.css` for layering,
 * portal rings, glow platforms, etc.
 */
export { default as NebulaPortal } from "./NebulaPortal";
export type { NebulaPortalProps, StageTone } from "./NebulaPortal";

export { default as GlowPlatform } from "./GlowPlatform";
export type { GlowPlatformProps } from "./GlowPlatform";

export { default as StageCard } from "./StageCard";
export type {
  StageCardProps,
  StageCardVariant,
  StageCardStatus,
} from "./StageCard";

export { default as SceneTile } from "./SceneTile";
export type { SceneTileProps } from "./SceneTile";

export { default as CinemaCTA } from "./CinemaCTA";
export type { CinemaCTAProps, CinemaCTAVariant } from "./CinemaCTA";

export { default as StageHero } from "./StageHero";
export type { StageHeroProps } from "./StageHero";
