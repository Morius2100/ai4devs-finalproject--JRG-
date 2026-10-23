import type { NextConfig } from "next";

// Build de la app Android (TKT-046, design.md D1): `OPINA_TARGET=mobile`.
const isMobileBuild = process.env.OPINA_TARGET === "mobile";

// Las imágenes subidas se sirven desde la propia API (`/api/media/...`, TKT-067) y no
// necesitan patrón remoto; picsum.photos solo lo usan las imágenes de demostración
// de prisma/seed.ts.
const images: NextConfig["images"] = {
  remotePatterns: [{ protocol: "https" as const, hostname: "picsum.photos", pathname: "/seed/**" }],
};

const webConfig: NextConfig = {
  images,
  // Enlaces anteriores a las rutas por parámetro (TKT-045). `nuevo` no es un id.
  async redirects() {
    return [
      { source: "/temas/:id((?!nuevo$)[^/]+)", destination: "/tema?id=:id", permanent: true },
      { source: "/personas/:id", destination: "/persona?id=:id", permanent: true },
    ];
  },
};

// Solo la interfaz, como archivos estáticos para Capacitor. `pageExtensions`
// deja fuera los `.ts` (rutas de la API, middleware, manifest, instrumentación).
const mobileConfig: NextConfig = {
  output: "export",
  // Carpeta del export. Next compila igualmente en `.next`: no lanzar con `next dev` en marcha.
  distDir: "out-mobile",
  trailingSlash: true,
  // `js` es necesario para las páginas internas de Next (no hay `.js` en src/app).
  pageExtensions: ["tsx", "js"],
  images: { ...images, unoptimized: true },
  env: { NEXT_PUBLIC_OPINA_TARGET: "mobile" },
};

export default isMobileBuild ? mobileConfig : webConfig;
