"use client";

import { useEffect, useState } from "react";
import { ArrowsClockwise, Play } from "@phosphor-icons/react/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/axios";
import { keys } from "@/lib/query-keys";
import { adminService } from "@/services";
import type { ModelHealthInfo } from "@/types";
import { MetricStrip, type Metric } from "@/components/admin/metric-strip";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/toast";
import { formatCount, formatDuration, relativeTime } from "@/utils";

const POLL_WHILE_REFRESHING_MS = 3000;

/** Vị trí (bắt đầu từ 1) của model trong một bể; không có thì "—". */
function positionIn(chain: string[], modelId: string): string {
  const index = chain.indexOf(modelId);
  return index === -1 ? "—" : String(index + 1);
}

/** Nhãn trạng thái: cách ly > chưa kiểm tra > trượt probe > khả dụng. */
function badgeOf(
  model: ModelHealthInfo | undefined,
  now: number,
): { variant: "danger" | "warning" | "success" | "neutral"; label: string } {
  if (model?.cooldownUntil && model.cooldownUntil > now) {
    return {
      variant: "danger",
      label: `Cách ly (còn ${Math.ceil((model.cooldownUntil - now) / 60_000)} phút)`,
    };
  }
  if (!model) return { variant: "neutral", label: "Chưa kiểm tra" };
  if (!model.healthy) return { variant: "warning", label: "Trượt probe" };
  return { variant: "success", label: "Khả dụng" };
}

export function ModelPoolTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [starting, setStarting] = useState(false);
  // Date.now() không được gọi trong lúc render; nhịp một phút đủ cho đồng hồ đếm ngược cách ly.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const pool = useApiQuery(keys.modelPoolHealth(), () => adminService.modelPoolHealth(), {
    errorMessage: "Không tải được trạng thái bể model",
    refetchInterval: (data) => (data?.isRefreshing ? POLL_WHILE_REFRESHING_MS : false),
  });

  const startCheck = async () => {
    setStarting(true);
    try {
      const status = await adminService.triggerModelHealthCheck();
      queryClient.setQueryData(keys.modelPoolHealth(), status);
      toast.success("Đã bắt đầu kiểm tra model ở nền.");
    } catch (err) {
      toast.danger(apiErrorMessage(err, "Không bắt đầu được lượt kiểm tra model"));
    } finally {
      setStarting(false);
    }
  };

  if (pool.error) return <Alert tone="danger">{pool.error}</Alert>;

  const status = pool.data;
  if (!status) {
    return (
      <SkeletonPage>
        <Skeleton className="h-20" />
        <Skeleton className="h-44" />
        <Skeleton className="h-64" />
      </SkeletonPage>
    );
  }

  const models = new Map(status.models.map((m) => [m.modelId, m]));
  const rows = [...new Set([...status.mainPool, ...status.fastPool])];
  const coolingCount = status.models.filter((m) => (m.cooldownUntil ?? 0) > now).length;
  const cooldownMinutes = Math.round(status.cooldownMs / 60_000);
  const usable = (modelId: string) =>
    badgeOf(models.get(modelId), now).variant === "success";
  const chains = [
    {
      title: "Bể main — tác vụ chạy nền",
      providers: status.mainProviders,
      pool: status.mainPool.filter(usable),
    },
    {
      title: "Bể fast — người dùng đang chờ",
      providers: status.fastProviders,
      pool: status.fastPool.filter(usable),
    },
  ];

  const metrics: Metric[] = [
    { label: "Model đang theo dõi", value: formatCount(status.models.length) },
    {
      label: "Qua probe",
      value: formatCount(status.models.filter((m) => m.healthy).length),
    },
    {
      label: "Đang cách ly",
      value: formatCount(coolingCount),
      alert: coolingCount > 0,
      hint: `Tự mở lại sau ${cooldownMinutes} phút`,
    },
    {
      label: "Kiểm tra gần nhất",
      value:
        status.lastRefreshedAt > 0
          ? relativeTime(new Date(status.lastRefreshedAt).toISOString())
          : "Chưa chạy",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status.isRefreshing && (
          <Badge variant="warning" dot>
            Đang kiểm tra…
          </Badge>
        )}
        <Button variant="outline" size="sm" onClick={pool.reload} loading={pool.loading}>
          <ArrowsClockwise className="size-4" />
          Làm mới
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => void startCheck()}
          loading={starting || status.isRefreshing}
        >
          <Play className="size-4" />
          Kiểm tra ngay
        </Button>
      </div>

      <MetricStrip items={metrics} />

      <div className="grid gap-5 lg:grid-cols-2">
        {chains.map((chain) => (
          <SectionCard
            key={chain.title}
            title={chain.title}
            description={`Lõi: ${chain.providers.join(" → ")}`}
          >
            {chain.pool.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có model khả dụng. Bấm &quot;Kiểm tra ngay&quot; để kiểm tra lại.
              </p>
            ) : (
              <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2 font-mono text-xs">
                {chain.pool.map((modelId, index) => (
                  <li key={modelId} className="flex items-center gap-1.5">
                    {index > 0 && <span className="text-slate-400">→</span>}
                    <Badge variant="success">{modelId}</Badge>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Thứ tự model trong chuỗi"
        description={'Vị trí của từng model trong mỗi bể; "—" là model không thuộc bể đó.'}
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-center">Bể main</TableHead>
                <TableHead className="text-center">Bể fast</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Độ trễ probe</TableHead>
                <TableHead className="text-center">Lỗi liên tiếp</TableHead>
                <TableHead>Kiểm tra cuối</TableHead>
                <TableHead>Lỗi gần nhất</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((modelId) => {
                const model = models.get(modelId);
                const badge = badgeOf(model, now);
                return (
                  <TableRow key={modelId}>
                    <TableCell className="font-mono text-xs">{modelId}</TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {positionIn(status.mainPool, modelId)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {positionIn(status.fastPool, modelId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant} dot>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {model && model.latencyMs > 0 ? formatDuration(model.latencyMs) : "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      {model?.consecutiveFailures ?? 0}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {model && model.lastCheckedAt > 0
                        ? relativeTime(new Date(model.lastCheckedAt).toISOString())
                        : "—"}
                    </TableCell>
                    <TableCell
                      className="max-w-xs truncate text-xs text-slate-500"
                      title={model?.error}
                    >
                      {model?.error ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
