import type { AiFailureKind } from "./admin";
import type { AuthUser } from "./auth";
import type { PageQuery } from "./common";

export type Role = AuthUser["role"];

export interface UserCounts {
  documents: number;
  matches: number;
  applications: number;
  aiCalls: number;
  scrapeRuns: number;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  profile: { headline: string | null; completion: number } | null;
  _count: UserCounts;
}

export interface UserDetail {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  profile: {
    headline: string | null;
    occupationCode: string | null;
    completion: number;
    primarySkills: string[];
    updatedAt: string;
  } | null;
  _count: UserCounts;
  usage: { inputTokens: number; outputTokens: number; lastCallAt: string | null };
  recentCalls: Array<{
    id: string;
    purpose: string;
    modelId: string;
    ok: boolean;
    failureKind: AiFailureKind | null;
    durationMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
    createdAt: string;
  }>;
}

export interface UsersQuery extends PageQuery {
  q?: string;
  role?: Role;
}
