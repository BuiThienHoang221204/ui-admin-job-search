import type { Metadata } from "next";
import { UserDetailView } from "./user-detail-view";

export const metadata: Metadata = { title: "Chi tiết người dùng" };

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UserDetailView id={id} />;
}
