/** Pulgar arriba/abajo en SVG de trazo; hereda el color del texto. */
export function ThumbIcon({
  direction,
  className = "h-5 w-5",
}: {
  direction: "up" | "down";
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        transform={direction === "down" ? "rotate(180 12 12)" : undefined}
        d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3a4 4 0 0 0 4-4V6a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1-2 2h-7a3 3 0 0 1-3-3"
      />
    </svg>
  );
}
