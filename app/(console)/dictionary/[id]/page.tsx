import type { Metadata } from "next";
import { SkillDetailView } from "./skill-detail-view";

export const metadata: Metadata = { title: "Kỹ năng" };

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SkillDetailView id={id} />;
}
