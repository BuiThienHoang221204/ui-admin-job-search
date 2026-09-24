import { api } from "@/lib/axios";
import type {
  AiCallDetail,
  AiFailureFacets,
  AiFailureRecord,
  AiFailuresQuery,
  AiHealth,
  AiUsage,
  BackfillResult,
  Overview,
  PageQuery,
  Paginated,
  QueueConfigItem,
  ReconcileResult,
  ScrapeNowResult,
} from "@/types";

export const adminService = {
  overview: (days = 1) =>
    api.get<Overview>("/admin/overview", { params: { days } }).then((r) => r.data),

  aiCall: (id: string) =>
    api.get<AiCallDetail>(`/admin/ai-calls/${encodeURIComponent(id)}`).then((r) => r.data),

  aiUsage: (days = 7) =>
    api.get<AiUsage>("/admin/ai-usage", { params: { days } }).then((r) => r.data),

  aiHealth: (days = 7) =>
    api
      .get<AiHealth>("/admin/ai-health", { params: { days } })
      .then((r) => r.data),

  aiFailures: (query: AiFailuresQuery = {}) =>
    api
      .get<Paginated<AiFailureRecord>>("/admin/ai-failures", { params: query })
      .then((r) => r.data),

  aiFailureFacets: (range: { from?: string; to?: string }) =>
    api
      .get<AiFailureFacets>("/admin/ai-failures/facets", { params: range })
      .then((r) => r.data),

  // Chỉ là biên nhận: worker quét ở nền, mỗi portal mất vài phút.
  scrapeNow: () =>
    api.post<ScrapeNowResult>("/admin/scrape/run-now").then((r) => r.data),

  reconcileNow: () =>
    api.post<ReconcileResult>("/admin/reconcile/run-now").then((r) => r.data),

  // Chạy đồng bộ trên server; `all` tính lại cả kho nên có thể mất vài phút.
  backfillTaxonomy: (all: boolean) =>
    api
      .post<BackfillResult>("/admin/jobs/backfill-taxonomy", null, {
        params: all ? { all: "true" } : {},
      })
      .then((r) => r.data),

  // Cỡ trang tối đa của server là 100; số hàng đợi chỉ vài chục nên một trang là đủ.
  queueConfig: (page: PageQuery = { limit: 100 }) =>
    api
      .get<Paginated<QueueConfigItem>>("/admin/queue/config", { params: page })
      .then((r) => r.data),

  // Server ghi đè cả ba trường (thiếu thì về mặc định), nên luôn gửi đủ.
  updateQueueConfig: (
    queueName: string,
    body: Pick<QueueConfigItem, "concurrency" | "serial" | "note">,
  ) =>
    api
      .put<QueueConfigItem>(
        `/admin/queue/config/${encodeURIComponent(queueName)}`,
        body,
      )
      .then((r) => r.data),
};
