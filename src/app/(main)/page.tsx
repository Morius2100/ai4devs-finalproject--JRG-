import { Suspense } from "react";
import { HomeScreen } from "@/components/topics/HomeScreen";

/** HomePage (TKT-013, HU-01, HU-02): tendencias o búsqueda según `?q=`, cargadas desde el cliente (TKT-045). */
export default function HomePage() {
  return (
    <Suspense>
      <HomeScreen />
    </Suspense>
  );
}
