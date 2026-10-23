import { ImageResponse } from "next/og";
import { MARK_RING, MARK_TAIL } from "@/components/Logo";

// Estático para que también entre en el export del build móvil (TKT-046).
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#035949",
      }}
    >
      <svg width="180" height="180" viewBox="-18 -16 96 96">
        <circle
          cx={MARK_RING.cx}
          cy={MARK_RING.cy}
          r={MARK_RING.r}
          fill="none"
          stroke="#FFC244"
          strokeWidth={MARK_RING.strokeWidth}
        />
        <path d={MARK_TAIL} fill="#FFC244" />
      </svg>
    </div>,
    size,
  );
}
