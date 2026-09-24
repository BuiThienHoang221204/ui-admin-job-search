"use client";

import { useState } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { usePagedFilters } from "@/hooks/use-paged-filters";
import { keys } from "@/lib/query-keys";
import { scraperService } from "@/services";
import type { BatchRun, ScrapeBatch } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCount, formatDateTime } from "@/utils";
import type { TimeRange } from "@/utils/date-range";
import { isBusy, shortError } from "./scrape-format";

const PAGE_SIZE = 15;
const POLL_MS = 5_000;

const hasBusy = (batches: ScrapeBatch[]) =>
  batches.some((batch) => Object.values(batch.runs).some((run) => isBusy(run.status)));

// Một ô = kết quả của một portal trong một lượt: "+44" khi xong, mã lỗi khi hỏng; chạm trần chỉ nằm trong tooltip vì gần như lượt nào cũng chạm.
function Cell({ run, cap }: { run: BatchRun | undefined; cap: number }) {
  if (!run) return <span className="text-slate-300">—</span>;
  if (run.status === "FAILED") {
    return (
      <span title={run.error ?? undefined} className="cursor-help font-medium text-rose-700">
        ✕ {shortError(run.error)}
      </span>
    );
  }
  if (isBusy(run.status)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-700">
        <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
        {run.status === "RUNNING" ? "đang chạy" : "chờ"}
      </span>
    );
  }
  const capped = run.jobsFound >= cap;
  return (
    <span
      className="inline-flex items-center gap-1"
      title={`Thấy ${run.jobsFound}, mới ${run.jobsNew}${capped ? ` · chạm trần ${cap}` : ""}`}
    >
      <span className={cn("font-mono tabular-nums", run.jobsNew ? "text-slate-900" : "text-slate-400")}>
        +{formatCount(run.jobsNew)}
      </span>
    </span>
  );
}

// Lịch sử dạng ma trận lượt × portal: nhìn một dòng biết cả đêm, nhìn một cột biết portal hỏng lặp lại hay không.
export function BatchMatrixCard({
  portals,
  cap,
  range,
}: {
  portals: string[];
  cap: number;
  range: TimeRange;
}) {
  const [failedOnly, setFailedOnly] = useState(false);
  const filters = { failedOnly: failedOnly || undefined, ...range };
  const [offset, setOffset] = usePagedFilters(filters);
  const query = { ...filters, limit: PAGE_SIZE, offset };

  const page = useApiQuery(keys.scrapeBatches(query), () => scraperService.batches(query), {
    errorMessage: "Không tải được lịch sử quét",
    keepPrevious: true,
    // Chỉ thăm dò khi trang đang xem còn lượt chưa xong.
    refetchInterval: (data) => (data && hasBusy(data.items) ? POLL_MS : false),
  });
  const data = page.data;
  const polling = data ? hasBusy(data.items) : false;

  return (
    <SectionCard
      title="Lịch sử theo lượt"
      description={
        data
          ? `${formatCount(data.total)} lượt${failedOnly ? " có portal hỏng" : ""}`
          : undefined
      }
      contentClassName="p-0"
      actions={
        <>
          {polling && (
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="size-2 animate-pulse rounded-full bg-amber-500" />
              Đang theo dõi
            </span>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={failedOnly}
            onClick={() => setFailedOnly(!failedOnly)}
            className={cn(
              "h-8 cursor-pointer rounded-md border px-2.5 text-xs font-medium transition-colors",
              failedOnly
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            Chỉ lượt hỏng
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={page.reload}
            loading={data !== null && page.loading}
            aria-label="Tải lại lịch sử quét"
          >
            <ArrowsClockwise className="size-4" />
          </Button>
        </>
      }
    >
      {page.error && (
        <div className="p-4 pb-0">
          <Alert tone="danger">{page.error}</Alert>
        </div>
      )}

      {!data ? (
        <div className="p-4">
          <Skeleton className="h-64" />
        </div>
      ) : data.items.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">
          {failedOnly ? "Không có lượt nào có portal hỏng trong khoảng này." : "Không có lượt quét nào trong khoảng này."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-2 font-medium">Lượt</th>
                  {portals.map((portal) => (
                    <th key={portal} className="px-2 py-2 text-right font-mono font-medium">
                      {portal}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right font-medium">Tổng mới</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((batch) => (
                  <tr key={batch.id} className={cn("transition-colors hover:bg-slate-50", batch.failed > 0 && "bg-rose-50/40")}>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-700">{formatDateTime(batch.startedAt)}</span>
                      {batch.manual && (
                        <Badge variant="outline" className="ml-2" title={batch.userEmail ?? undefined}>
                          tài khoản tự chạy
                        </Badge>
                      )}
                    </td>
                    {portals.map((portal) => (
                      <td key={portal} className="px-2 py-2.5 text-right text-xs">
                        <Cell run={batch.runs[portal]} cap={cap} />
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {formatCount(batch.totalNew)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            offset={data.offset}
            limit={data.limit}
            total={data.total}
            onOffsetChange={setOffset}
            noun="lượt"
            disabled={page.loading}
          />
        </>
      )}
    </SectionCard>
  );
}
