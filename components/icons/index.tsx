/**
 * CAELINUS · İkon Ailesi (Bible §4)
 *
 * Altı çekirdek sembol — tek elden, `currentColor`, tutarlı stroke. Rastgele
 * ikon paketi yok. Her sembol bir dünyaya bağlıdır (bkz. lib/world/worlds.ts).
 *
 *   wing · star · flame · portal · mirror · sacred-circle
 *
 * Kullanım:  <Icon name="mirror" size={28} />  ya da  <Mirror size={28} />
 */
import type { SVGProps } from "react";

export type IconName =
  | "wing"
  | "star"
  | "flame"
  | "portal"
  | "mirror"
  | "sacred-circle";

export type IconProps = {
  size?: number;
  title?: string;
} & Omit<SVGProps<SVGSVGElement>, "width" | "height">;

function Svg({
  size = 24,
  title,
  strokeWidth = 1.4,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Kanat — yükseliş, marka çekirdeği, yaratıcı (Atelier). */
export function Wing(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 6c-1.6 2.2-4 3.6-7 3.8 1.4 1 3 1.3 4.6 1 -1.4 1.3-3.2 2-5.2 1.9 1.8 1.4 4.2 1.7 6.4.8" />
      <path d="M12 6c1.6 2.2 4 3.6 7 3.8 -1.4 1-3 1.3-4.6 1 1.4 1.3 3.2 2 5.2 1.9 -1.8 1.4-4.2 1.7-6.4.8" />
      <path d="M12 5.4v9.2" />
    </Svg>
  );
}

/** Yıldız — dilek, arzu, ulaşılan (Bazaar). Dolu 4-uçlu parıltı. */
export function Star(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M12 2.5c.5 4.6 1.9 6 6.5 6.5 -4.6.5-6 1.9-6.5 6.5 -.5-4.6-1.9-6-6.5-6.5 4.6-.5 6-1.9 6.5-6.5Z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M18.5 16.5c.2 1.7.7 2.2 2.4 2.4 -1.7.2-2.2.7-2.4 2.4 -.2-1.7-.7-2.2-2.4-2.4 1.7-.2 2.2-.7 2.4-2.4Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Alev — dönüşüm, oluş (Avatar Studio). */
export function Flame(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5c2 3 4.6 4.8 4.6 8.4a4.6 4.6 0 1 1-9.2 0c0-1.7.7-2.9 1.8-4 -.2 1.3.3 2.2 1.2 2.6 .4-2.9 .2-4.8 1.6-7Z" />
      <path d="M12 14.2c1.3 0 2.1-.9 2.1-2.1 0-1-.6-1.7-1.3-2.4 -.1 1-.6 1.4-1.3 1.6 -.7.2-1.2.9-1.2 1.7 0 .8.7 1.2 1.7 1.2Z" />
    </Svg>
  );
}

/** Geçit — eşik, oyun, keşif (Play). */
export function Portal(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5c4.4 0 7 4.3 7 9.5s-2.6 9.5-7 9.5-7-4.3-7-9.5 2.6-9.5 7-9.5Z" />
      <path d="M12 6.2c2.4 0 4 2.6 4 5.8s-1.6 5.8-4 5.8-4-2.6-4-5.8 1.6-5.8 4-5.8Z" />
      <path d="M12 9.6c.9 0 1.5 1 1.5 2.4S12.9 14.4 12 14.4 10.5 13.4 10.5 12 11.1 9.6 12 9.6Z" />
    </Svg>
  );
}

/** Ayna — iç görü, yansıma (SANRI). */
export function Mirror(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.4c3.6 0 6 3.1 6 6.9s-2.4 6.9-6 6.9-6-3.1-6-6.9 2.4-6.9 6-6.9Z" />
      <path d="M9.4 6.4c-1 .9-1.6 2.3-1.6 3.9" opacity="0.7" />
      <path d="M12 17.2v4.4" />
      <path d="M9.2 21.6h5.6" />
    </Svg>
  );
}

/** Kutsal çember — döngü, tohum, kök (Gaia). */
export function SacredCircle(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12c0-2.6 1.1-4.6 3.1-5.9C14.8 8 13.9 9.6 12 12Z" />
      <path d="M12 12c0-2.6-1.1-4.6-3.1-5.9C9.2 8 10.1 9.6 12 12Z" />
      <path d="M12 12v5.2" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

const REGISTRY: Record<IconName, (p: IconProps) => React.ReactElement> = {
  wing: Wing,
  star: Star,
  flame: Flame,
  portal: Portal,
  mirror: Mirror,
  "sacred-circle": SacredCircle,
};

/** İsimle ikon çöz — dünya kaydı (worlds.ts) sembolü buradan render eder. */
export function Icon({ name, ...props }: IconProps & { name: IconName }) {
  const Cmp = REGISTRY[name];
  return <Cmp {...props} />;
}
