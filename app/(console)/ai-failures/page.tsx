import type { Metadata } from "next";
import { AiFailuresView } from "./ai-failures-view";

export const metadata: Metadata = { title: "Nhật ký lỗi AI" };

export default function AiFailuresPage() {
  return <AiFailuresView />;
}
