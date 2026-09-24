import type { WorkStatus } from "./common";

export interface PortalEntry {
  key: string;
  directory: string;
  cliPath: string;
  enabled: boolean;
  supportsJobAge: boolean;
  description: string;
}

export interface BatchRun {
  id: string;
  portal: string;
  status: WorkStatus;
  userId: string | null;
  userEmail: string | null;
  jobsFound: number;
  jobsNew: number;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

// Một lượt đêm: các portal được tạo cùng lúc (cron hoặc "Quét ngay"), hoặc lượt một tài khoản tự chạy.
export interface ScrapeBatch {
  id: string;
  startedAt: string;
  manual: boolean;
  userEmail: string | null;
  runs: Record<string, BatchRun>;
  totalNew: number;
  failed: number;
}

export interface PortalHealth extends PortalEntry {
  portal: string;
  runs: number;
  failed: number;
  failStreak: number;
  lastRun: BatchRun | null;
  lastSuccessAt: string | null;
  newSeries: number[];
  hitCap: boolean;
}
