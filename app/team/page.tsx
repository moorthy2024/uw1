import { Suspense } from "react";
import { TeamPanel } from "@/components/TeamPanel";

export default function Page() {
  return <Suspense fallback={null}><TeamPanel /></Suspense>;
}
