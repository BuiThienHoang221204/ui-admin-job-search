import type { Metadata } from "next";
import { JobsView } from "./jobs-view";

export const metadata: Metadata = { title: "Tin tuyển dụng" };

export default function JobsPage() {
  return <JobsView />;
}
