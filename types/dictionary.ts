import type { PageQuery } from "./common";

export type AliasSource = "EXACT" | "LLM" | "MANUAL";

export interface SkillAlias {
  key: string;
  raw: string;
  source: AliasSource;
}

export interface CanonicalSkillItem {
  id: string;
  name: string;
  model: string;
  createdAt: string;
  _count: { aliases: number };
  aliases: SkillAlias[];
}

export interface SkillNeighbor {
  id: string;
  name: string;
  similarity: number;
  aliases: number;
}

export interface CanonicalSkillDetail {
  id: string;
  name: string;
  model: string;
  createdAt: string;
  aliases: Array<SkillAlias & { createdAt: string }>;
  neighbors: SkillNeighbor[];
}

export interface DictionarySummary {
  skills: number;
  aliases: Partial<Record<AliasSource, number>>;
}

export interface SkillsQuery extends PageQuery {
  q?: string;
  source?: AliasSource;
}
