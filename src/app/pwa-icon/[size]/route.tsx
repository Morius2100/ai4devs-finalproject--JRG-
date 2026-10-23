import { ImageResponse } from "next/og";
import { MARK_RING, MARK_TAIL } from "@/components/Logo";

const SIZES = new Set([192, 512]);

// Estático para que también entre en el export del build móvil (TKT-046).
export const dynamic = "force-static";

export function generateStaticParams() {
  return [...SIZES].map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) {
    return new Response("Not found", { status: 404 });
  }
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
      <svg width={size} height={size} viewBox="-18 -16 96 96">
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
    { width: size, height: size },
  );
}
