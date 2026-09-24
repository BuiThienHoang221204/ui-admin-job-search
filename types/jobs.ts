import type { PageQuery, WorkStatus } from "./common";

export type RequirementFilter = "NONE" | WorkStatus;

export interface JobCounts {
  matches: number;
  duplicates: number;
  applications: number;
}

export interface JobListItem {
  id: string;
  title: string;
  company: string;
  source: string;
  url: string;
  location: string | null;
  provinceCode: string | null;
  occupationCode: string | null;
  postedAt: string | null;
  scrapedAt: string;
  duplicateOfId: string | null;
  requirements: { status: WorkStatus; extractedAt: string | null } | null;
  _count: JobCounts;
}

export interface JobRef {
  id: string;
  title: string;
  company: string;
  source: string;
}

export interface JobRequirements {
  status: WorkStatus;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  minYears: number | null;
  seniority: string;
  city: string | null;
  remotePolicy: string;
  workPermitRequired: boolean;
  citizenshipRequired: string | null;
  modelId: string | null;
  extractedAt: string | null;
  error: string | null;
}

export interface JobDetail extends Omit<JobListItem, "requirements" | "duplicateOfId"> {
  externalId: string | null;
  workMode: string | null;
  subOccupationCode: string | null;
  dedupeKey: string | null;
  salaryRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  tags: string[];
  description: string;
  requirements: JobRequirements | null;
  duplicateOf: JobRef | null;
  duplicates: Array<JobRef & { scrapedAt: string }>;
}

export interface JobsQuery extends PageQuery {
  q?: string;
  source?: string;
  requirement?: RequirementFilter;
  canonicalOnly?: boolean;
}
