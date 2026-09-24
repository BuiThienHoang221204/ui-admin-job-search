import type { Metadata } from "next";
import { OverviewView } from "./_overview/overview-view";

export const metadata: Metadata = { title: "Tổng quan" };

export default function OverviewPage() {
  return <OverviewView />;
}
