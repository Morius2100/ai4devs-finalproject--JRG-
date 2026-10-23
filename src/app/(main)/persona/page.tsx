import { Suspense } from "react";
import { PersonScreen } from "@/components/people/PersonScreen";

/** ProfilePage (TKT-039, TKT-045, HU-14, HU-15): `/persona?id=<id>`. */
export default function ProfilePage() {
  return (
    <Suspense>
      <PersonScreen />
    </Suspense>
  );
}
