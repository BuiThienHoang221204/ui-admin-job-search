import type { Metadata } from "next";
import { ScrapeView } from "./scrape-view";

export const metadata: Metadata = { title: "Quét tin" };

export default function ScrapePage() {
  return <ScrapeView />;
}
