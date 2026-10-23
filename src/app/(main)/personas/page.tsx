import { Suspense } from "react";
import { PeopleScreen } from "@/components/people/PeopleScreen";

/** PeoplePage (TKT-038, HU-13): todas las personas o búsqueda según `?q=`, cargadas desde el cliente (TKT-045). */
export default function PeoplePage() {
  return (
    <Suspense>
      <PeopleScreen />
    </Suspense>
  );
}
