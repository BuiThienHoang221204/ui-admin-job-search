import type { Metadata } from "next";
import { MaintenanceView } from "./maintenance-view";

export const metadata: Metadata = { title: "Bảo trì dữ liệu" };

export default function MaintenancePage() {
  return <MaintenanceView />;
}
