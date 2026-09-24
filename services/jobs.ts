import { api } from "@/lib/axios";
import type { JobDetail, JobListItem, JobRequirements, JobsQuery, PageQuery, Paginated } from "@/types";

export const jobsService = {
  list: (query: JobsQuery) =>
    api.get<Paginated<JobListItem>>("/admin/jobs", { params: query }).then((r) => r.data),

  sources: (page: PageQuery = {}) =>
    api
      .get<Paginated<{ source: string; count: number }>>("/admin/jobs/sources", { params: page })
      .then((r) => r.data),

  detail: (id: string) =>
    api.get<JobDetail>(`/admin/jobs/${encodeURIComponent(id)}`).then((r) => r.data),

  // Gọi model ĐỒNG BỘ nên có thể mất vài chục giây; `force` bỏ qua cache theo sourceHash.
  extractRequirements: (id: string) =>
    api
      .post<JobRequirements>(`/matches/requirements/${encodeURIComponent(id)}`, null, {
        params: { force: "true" },
        timeout: 180_000,
      })
      .then((r) => r.data),
};
