import type { Metadata } from "next";
import { AiHealthView } from "./ai-health-view";

export const metadata: Metadata = { title: "Sức khoẻ AI" };

export default function AiHealthPage() {
  return <AiHealthView />;
}
