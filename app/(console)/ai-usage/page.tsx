import type { Metadata } from "next";
import { AiUsageView } from "./ai-usage-view";

export const metadata: Metadata = { title: "Token AI" };

export default function AiUsagePage() {
  return <AiUsageView />;
}
