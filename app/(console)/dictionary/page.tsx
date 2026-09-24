import type { Metadata } from "next";
import { DictionaryView } from "./dictionary-view";

export const metadata: Metadata = { title: "Từ điển kỹ năng" };

export default function DictionaryPage() {
  return <DictionaryView />;
}
