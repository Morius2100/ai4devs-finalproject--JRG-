import { Suspense } from "react";
import { TopicScreen } from "@/components/topics/TopicScreen";

/** TopicPage (TKT-017, TKT-045, HU-03): `/tema?id=<id>`. */
export default function TopicPage() {
  return (
    <Suspense>
      <TopicScreen />
    </Suspense>
  );
}
