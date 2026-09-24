"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { keys } from "@/lib/query-keys";
import { adminService } from "@/services";
import type { Overview } from "@/types";
import { PageHeader } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Skeleton, SkeletonPage } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { MetricStrip, type Metric } from "@/components/admin/metric-strip";
import { formatCompact, formatCount } from "@/utils";
import { countDelta, pointDelta } from "@/utils/delta";
import { AttentionPanel } from "./attention-panel";
import { ErrorGroupsPanel } from "./error-groups-panel";
import { QueuePanel, ScrapePanel } from "./side-panels";

const REFRESH_MS = 30_000;

const WINDOWS = [
  { value: "1", label: "24 giờ" },
  { value: "7", label: "7 ngày" },
];

// Tỷ lệ thành công từng ô; ô không có lời gọi thì bỏ qua để đường không rơi về 0 giả.
const successSeries = (series: Overview["series"]) =>
  series
    .filter((row) => row.calls > 0)
    .map((row) => ((row.calls - row.failed) / row.calls) * 100);

function metricsOf(data: Overview, failed: number): Metric[] {
  const m = data.metrics;
  const t = data.thresholds;
  const lowSuccess =
    m.successRate.current !== null &&
    m.aiCalls.current >= t.minCallsForRate &&
    m.successRate.current < t.minSuccessRate;

  return [
    {
      label: "Lời gọi AI",
      value: formatCount(m.aiCalls.current),
      delta: countDelta(m.aiCalls.current, m.aiCalls.previous, "neutral"),
      hint: `${formatCount(failed)} hỏng`,
      spark: data.series.map((row) => row.calls),
      href: "/ai-health",
    },
    {
      label: "Tỷ lệ thành công",
      value:
        m.successRate.current === null
          ? "—"
          : `${m.successRate.current.toLocaleString("vi-VN")}%`,
      alert: lowSuccess,
      delta: pointDelta(m.successRate.current, m.successRate.previous),
      hint: lowSuccess ? `ngưỡng ${t.minSuccessRate}%` : undefined,
      spark: successSeries(data.series),
      href: "/ai-failures",
    },
    {
      label: "Token",
      value: formatCompact(m.tokens.current),
      delta: countDelta(m.tokens.current, m.tokens.previous, "neutral"),
      spark: data.series.map((row) => row.inputTokens + row.outputTokens),
      href: "/ai-usage",
    },
    {
      label: "Tin mới",
      value: formatCount(m.newJobs.current),
      delta: countDelta(m.newJobs.current, m.newJobs.previous, "up"),
      hint: `${data.portals.length} portal`,
      href: "/scrape",
    },
    {
      label: "Việc đang chờ",
      value: formatCount(m.queueWaiting),
      alert: m.queueWaiting > t.maxQueueWaiting,
      hint: `${formatCount(m.queueActive)} đang chạy`,
      href: "/queues",
    },
  ];
}

export function OverviewView() {
  const [days, setDays] = useState(1);
  const overview = useApiQuery(
    keys.overview(days),
    () => adminService.overview(days),
    {
      errorMessage: "Không tải được tổng quan",
      refetchInterval: REFRESH_MS,
      keepPrevious: true,
    },
  );
  const data = overview.data;
  const period = days === 1 ? "24 giờ qua" : `${days} ngày qua`;
  // Cộng từ các ô thời gian: khớp đúng cửa sổ, không suy ngược từ tỷ lệ đã làm tròn.
  const failed = data?.series.reduce((sum, row) => sum + row.failed, 0) ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tổng quan"
        subtitle={`${period}, so với cùng kỳ ngay trước · tự làm mới mỗi 30 giây`}
        actions={
          <Tabs
            tabs={WINDOWS}
            value={String(days)}
            onChange={(value) => setDays(Number(value))}
          />
        }
      />

      {overview.error && <Alert tone="danger">{overview.error}</Alert>}

      {!data ? (
        <SkeletonPage>
          <Skeleton className="h-14" />
          <Skeleton className="h-36" />
          <Skeleton className="h-80" />
        </SkeletonPage>
      ) : (
        <>
          <AttentionPanel items={data.attention} />
          <MetricStrip items={metricsOf(data, failed)} />
          <div className="grid gap-5 lg:grid-cols-3 *:min-w-0">
            <ErrorGroupsPanel
              className="lg:col-span-2"
              groups={data.errorGroups}
              failed={failed}
              comparable={data.metrics.aiCalls.previous >= data.thresholds.minCallsForRate}
            />
            <div className="space-y-5">
              <QueuePanel queues={data.queues} total={data.queueCount} />
              <ScrapePanel portals={data.portals} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
