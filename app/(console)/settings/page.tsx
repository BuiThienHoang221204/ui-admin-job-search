import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { DisplayCard } from "./display-card";

export const metadata: Metadata = { title: "Hiển thị" };

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader
        title="Hiển thị"
        subtitle="Chủ đề và cỡ chữ của khu quản trị, lưu riêng khỏi app người dùng"
      />
      <DisplayCard />
    </div>
  );
}
