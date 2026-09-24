"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { EyeSlash } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { keys } from "@/lib/query-keys";
import { adminService } from "@/services";
import type { UsageRow } from "@/types";
import { PageHeader } from "@/components/shell/page-header";
import { MetricStrip } from "@/components/admin/metric-strip";
import { StackedBars, type BarSeries } from "@/components/admin/stacked-bars";
import { purposeLabel } from "@/constants/constants";
import { Alert } from "@/components/ui/alert";
import { EmptyHint } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton, SkeletonPage } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatCount } from "@/utils";

// Backend chặn `days` trong 1–90; 1 = 24 giờ, chia theo giờ.
const WINDOWS = [
  { value: "1", label: "24 giờ" },
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
  { value: "90", label: "90 ngày" },
];

// Token vào nằm dưới, token ra chồng lên; hai màu đã qua validator dataviz ở cả sáng lẫn tối.
const TOKEN_SERIES: BarSeries<"input" | "output">[] = [
  { key: "input", label: "Token vào", swatch: "bg-chart-in" },
  { key: "output", label: "Token ra", swatch: "bg-chart-out" },
];

// `bucket` là giờ Việt Nam do server tính sẵn: YYYY-MM-DD hoặc YYYY-MM-DDTHH.
function bucketLabels(bucket: string, granularity: "hour" | "day") {
  const date = `${bucket.slice(8, 10)}/${bucket.slice(5, 7)}`;
  if (granularity === "day") return { label: date, title: `Ngày ${date}/${bucket.slice(0, 4)}` };
  const hour = Number(bucket.slice(11, 13));
  return {
    label: `${hour}h`,
    title: `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00 · ${date}`,
  };
}

export function AiUsageView() {
  const [days, setDays] = useState(1);
  const usage = useApiQuery(keys.aiUsage(days), () => adminService.aiUsage(days), {
    errorMessage: "Không tải được số liệu token",
    keepPrevious: true,
  });
  const data = usage.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Token AI"
        subtitle="Token vào/ra từ nhật ký gọi model · chưa quy ra tiền"
      />

      <Tabs tabs={WINDOWS} value={String(days)} onChange={(value) => setDays(Number(value))} className="max-w-sm" />

      {usage.error && <Alert tone="danger">{usage.error}</Alert>}

      {!data ? (
        <SkeletonPage>
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </SkeletonPage>
      ) : (
        <>
          <MetricStrip
            items={[
              {
                label: "Tổng token",
                value: formatCount(data.totals.totalTokens),
                hint: `${formatCount(data.totals.cachedTokens)} cache`,
              },
              { label: "Token vào", value: formatCount(data.totals.inputTokens) },
              { label: "Token ra", value: formatCount(data.totals.outputTokens) },
              {
                label: "Lời gọi",
                value: formatCount(data.totals.calls),
                hint: `${formatCount(data.totals.failed)} hỏng`,
              },
            ]}
          />

          {data.totals.untrackedCalls > 0 && (
            <Alert tone="warning" icon={EyeSlash}>
              {formatCount(data.totals.untrackedCalls)} / {formatCount(data.totals.calls)} lời gọi không
              được provider báo số token, nên tổng token ở đây thấp hơn thực tế.
            </Alert>
          )}

          <SectionCard
            title={data.granularity === "hour" ? "Token theo giờ" : "Token theo ngày"}
            description="Giờ Việt Nam"
          >
            <StackedBars
              unit="token"
              series={TOKEN_SERIES}
              bars={data.buckets.map((row) => ({
                id: row.bucket,
                ...bucketLabels(row.bucket, data.granularity),
                values: { input: row.inputTokens, output: row.outputTokens },
                note: `${formatCount(row.calls)} lời gọi`,
              }))}
            />
          </SectionCard>

          <div className="grid gap-5 2xl:grid-cols-2 *:min-w-0">
            <UsageTable
              title="Theo model"
              rows={data.byModel.map((row) => ({ key: row.modelId, label: <span className="font-mono text-xs">{row.modelId}</span>, row }))}
            />
            <UsageTable
              title="Theo tác vụ"
              rows={data.byPurpose.map((row) => ({
                key: row.purpose,
                label: (
                  <>
                    <p className="text-sm text-slate-900">{purposeLabel(row.purpose)}</p>
                    <p className="font-mono text-2xs text-slate-400">{row.purpose}</p>
                  </>
                ),
                row,
              }))}
            />
          </div>

          <UsageTable
            title="10 tài khoản tốn nhiều token nhất"
            rows={data.topUsers.map((row) => ({
              key: row.userId,
              label: (
                <Link href={`/users/${row.userId}`} className="hover:text-primary-600">
                  <p className="text-sm text-slate-900">{row.name ?? "—"}</p>
                  <p className="font-mono text-2xs text-slate-400">{row.email ?? row.userId}</p>
                </Link>
              ),
              row,
            }))}
          />
        </>
      )}
    </div>
  );
}

function UsageTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; label: ReactNode; row: UsageRow }>;
}) {
  const max = Math.max(1, ...rows.map(({ row }) => row.totalTokens));
  return (
    <SectionCard title={title} contentClassName="p-0">
      {rows.length === 0 ? (
        <div className="p-4">
          <EmptyHint>Chưa có lời gọi nào trong khoảng này.</EmptyHint>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead />
                <TableHead className="text-right">Lời gọi</TableHead>
                <TableHead className="text-right">Vào</TableHead>
                <TableHead className="text-right">Ra</TableHead>
                <TableHead className="min-w-40">Tổng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ key, label, row }) => (
                <TableRow key={key}>
                  <TableCell className="max-w-56">{label}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatCount(row.calls)}
                    {row.failed > 0 && <span className="block text-2xs text-rose-600">{formatCount(row.failed)} hỏng</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">{formatCount(row.inputTokens)}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">{formatCount(row.outputTokens)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${(row.totalTokens / max) * 100}%` }} />
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {formatCount(row.totalTokens)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SectionCard>
  );
}
