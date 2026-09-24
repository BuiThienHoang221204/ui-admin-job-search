import type { PageQuery, WorkStatus } from "./common";

export type AiFailureKind = "SCHEMA" | "TIMEOUT" | "UPSTREAM" | "OTHER";

export interface PurposeStats {
  purpose: string;
  total: number;
  ok: number;
  successRate: number;
  p50Ms: number;
  p95Ms: number;
  failures: Partial<Record<AiFailureKind, number>>;
}

// p50/p95 thay cho trung bình: đuôi độ trễ gọi model rất dài (từng đo 517 giây).
export interface AiHealth {
  total: number;
  ok: number;
  successRate: number;
  p50Ms: number;
  p95Ms: number;
  failures: Partial<Record<AiFailureKind, number>>;
  byPurpose: PurposeStats[];
  byModel: Array<{
    modelId: string;
    total: number;
    successRate: number;
    p50Ms: number;
  }>;
  windowDays: number;
}

export interface AiFailureRecord {
  id: string;
  purpose: string;
  provider: string;
  modelId: string;
  failureKind: AiFailureKind | null;
  errorMessage: string | null;
  durationMs: number;
  createdAt: string;
}

// `model` khớp một phần tên provider hoặc model; lọc OTHER lấy cả lời gọi chưa phân loại (null).
export interface AiFailuresQuery extends PageQuery {
  from?: string;
  to?: string;
  failureKind?: AiFailureKind;
  purpose?: string;
  model?: string;
}

// Lựa chọn cho ô chọn của bộ lọc, đếm trong cùng khoảng thời gian.
export interface AiFailureFacets {
  purposes: Array<{ purpose: string; count: number }>;
  models: Array<{ provider: string; modelId: string; count: number }>;
}

// `responseText` là null và `responseRedacted` = true khi lời gọi gắn với người dùng hoặc tác vụ mang dữ liệu cá nhân.
export interface AiCallDetail extends AiFailureRecord {
  ok: boolean;
  finishReason: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  responseText: string | null;
  responseRedacted: boolean;
  user: { id: string; email: string; name: string } | null;
}

export interface UsageRow {
  calls: number;
  failed: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  totalTokens: number;
}

export interface AiUsage {
  windowDays: number;
  totals: UsageRow & { untrackedCalls: number };
  since: string;
  // days = 1 chia theo giờ (24 ô), dài hơn chia theo ngày; `bucket` là giờ Việt Nam YYYY-MM-DD hoặc YYYY-MM-DDTHH.
  granularity: "hour" | "day";
  buckets: Array<{ bucket: string; calls: number; inputTokens: number; outputTokens: number }>;
  byModel: Array<UsageRow & { modelId: string }>;
  byPurpose: Array<UsageRow & { purpose: string }>;
  topUsers: Array<UsageRow & { userId: string; email: string | null; name: string | null }>;
}

export interface ScrapeNowResult {
  queued: number;
  runs: Array<{ portal: string; runId: string }>;
  note: string;
}

export interface ReconcileResult {
  documents: number;
  matches: number;
  agentRuns: number;
  upskillReports: number;
  interviewPreps: number;
  profileDrafts: number;
  jobRequirements: number;
  deferred: number;
  note: string;
}

export interface BackfillResult {
  processed: number;
  missingProvince: number;
  missingDedupeKey: number;
}

export interface QueueConfigItem {
  queueName: string;
  concurrency: number;
  serial: boolean;
  note: string | null;
}

export interface Comparison {
  current: number;
  previous: number;
}

export interface AttentionItem {
  id: string;
  severity: "danger" | "warning";
  title: string;
  detail: string;
  href: string;
  action: string;
}

export interface ErrorGroup {
  purpose: string;
  failureKind: AiFailureKind | null;
  count: number;
  previousCount: number;
  lastAt: string;
  sample: string | null;
}

// Kỳ trước là cửa sổ cùng độ dài ngay trước `since`; `successRate.previous` null khi kỳ trước quá ít lời gọi.
export interface Overview {
  windowDays: number;
  since: string;
  previousSince: string;
  granularity: "hour" | "day";
  thresholds: { minSuccessRate: number; minCallsForRate: number; maxQueueWaiting: number; scrapeStaleHours: number };
  metrics: {
    aiCalls: Comparison;
    successRate: { current: number | null; previous: number | null };
    tokens: Comparison;
    newJobs: Comparison;
    queueWaiting: number;
    queueActive: number;
  };
  series: Array<{ bucket: string; calls: number; failed: number; inputTokens: number; outputTokens: number }>;
  errorGroups: ErrorGroup[];
  queues: Array<{ name: string; concurrency: number; size: number; active: number }>;
  queueCount: number;
  portals: Array<{ portal: string; status: WorkStatus; jobsNew: number; error: string | null; createdAt: string }>;
  attention: AttentionItem[];
}
