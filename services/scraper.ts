import { api } from "@/lib/axios";
import type { PageQuery, Paginated, PortalEntry, PortalHealth, ScrapeBatch } from "@/types";

export const scraperService = {
  // `cap` là trần tin mỗi lượt (scraper.maxJobsPerPortal); đủ trần nghĩa là portal còn tin nhưng bị cắt.
  portalHealth: (query: PageQuery & { from?: string; to?: string } = { limit: 100 }) =>
    api
      .get<Paginated<PortalHealth> & { cap: number }>("/admin/scrape/portals", { params: query })
      .then((r) => r.data),

  batches: (query: PageQuery & { failedOnly?: boolean; from?: string; to?: string }) =>
    api
      .get<Paginated<ScrapeBatch>>("/admin/scrape/batches", { params: query })
      .then((r) => r.data),

  reloadPortals: () =>
    api
      .post<{ portals: PortalEntry[] }>("/scrape/portals/reload")
      .then((r) => r.data.portals),
};
