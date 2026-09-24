import type { Metadata } from "next";
import { JobDetailView } from "./job-detail-view";

export const metadata: Metadata = { title: "Chi tiết tin" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobDetailView id={id} />;
}
