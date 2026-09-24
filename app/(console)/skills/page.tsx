import type { Metadata } from "next";
import { SkillsView } from "./skills-view";

export const metadata: Metadata = { title: "Prompt skills" };

export default function SkillsPage() {
  return <SkillsView />;
}
