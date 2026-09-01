import { Suspense } from "react";
import { TeamPanel } from "@/components/TeamPanel";

export default function PerformancePage() {
  return <Suspense fallback={null}><TeamPanel /></Suspense>;
}
