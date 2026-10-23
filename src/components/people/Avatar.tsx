import Image from "next/image";
import { resolveMediaUrl } from "@/lib/platform/media";

// Fondos del marcador con la inicial: todos dan ≥ 4.5:1 con texto blanco.
const PLACEHOLDER_COLORS = [
  "#c2410c",
  "#0f766e",
  "#6d28d9",
  "#1d4ed8",
  "#be185d",
  "#15803d",
  "#a16207",
  "#b91c1c",
];

/** Color estable derivado del nombre de usuario (mismo nombre → mismo color). */
export function placeholderColor(username: string): string {
  let hash = 0;
  for (const char of username) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return PLACEHOLDER_COLORS[hash % PLACEHOLDER_COLORS.length];
}

type AvatarProps = {
  username: string;
  avatarUrl: string | null;
  /** Lado en píxeles. */
  size: number;
  className?: string;
};

/**
 * Foto de perfil circular (TKT-038) o, si la persona no tiene, un círculo
 * con la inicial de su nombre sobre un color derivado de él. Es decorativo:
 * el nombre ya aparece como texto junto a él.
 */
export function Avatar({ username, avatarUrl, size, className = "" }: AvatarProps) {
  if (avatarUrl) {
    return (
      <Image
        src={resolveMediaUrl(avatarUrl)}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      data-testid="avatar-placeholder"
      className={`flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        backgroundColor: placeholderColor(username),
      }}
    >
      {username.trim().charAt(0).toUpperCase()}
    </span>
  );
}
