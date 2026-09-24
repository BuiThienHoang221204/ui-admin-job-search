"use client";

import { useState } from "react";
import { ArrowsClockwise, PencilSimple, Wrench } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/axios";
import { keys } from "@/lib/query-keys";
import { adminService, queueService } from "@/services";
import type { QueueConfigItem } from "@/types";
import { PageHeader } from "@/components/shell/page-header";
import { MetricStrip } from "@/components/admin/metric-strip";
import { purposeLabel } from "@/constants/constants";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { cn, formatCount } from "@/utils";
import { QueueConfigModal } from "./queue-config-modal";

const LIVE_INTERVAL_MS = 5_000;

export interface QueueRow {
  name: string;
  size: number;
  active: number;
  total: number;
  concurrency: number;
  serial: boolean;
  note: string | null;
}

export function QueuesView() {
  const toast = useToast();
  const [live, setLive] = useState(true);
  const [editing, setEditing] = useState<QueueRow | null>(null);
  const [reconciling, setReconciling] = useState(false);

  const stats = useApiQuery(keys.queueStats(), queueService.stats, {
    errorMessage: "Không tải được số liệu hàng đợi",
    refetchInterval: live ? LIVE_INTERVAL_MS : false,
    staleTime: 0,
  });
  const config = useApiQuery(keys.queueConfig(), () => adminService.queueConfig(), {
    errorMessage: "Không tải được cấu hình hàng đợi",
  });

  const configByName = new Map<string, QueueConfigItem>(
    (config.data?.items ?? []).map((item) => [item.queueName, item]),
  );
  const rows: QueueRow[] | null = stats.data
    ? stats.data.queues.map((queue) => {
      const cfg = configByName.get(queue.name);
      return {
        ...queue,
        concurrency: cfg?.concurrency ?? queue.concurrency,
        serial: cfg?.serial ?? false,
        note: cfg?.note ?? null,
      };
    })
    : null;

  const totalConcurrency = rows?.reduce((sum, row) => sum + row.concurrency, 0) ?? 0;

  const reconcile = async () => {
    setReconciling(true);
    try {
      const result = await adminService.reconcileNow();
      const failed =
        result.agentRuns +
        result.upskillReports +
        result.interviewPreps +
        result.profileDrafts +
        result.jobRequirements;
      toast.success(
        `${result.note} Xếp lại ${result.documents} tài liệu, ${result.matches} lượt chấm; đánh hỏng ${failed} bản ghi kẹt${result.deferred ? `; ${result.deferred} việc để lượt sau` : ""
        }.`,
      );
      stats.reload();
    } catch (err) {
      toast.danger(apiErrorMessage(err, "Không chạy được reconcile"));
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hàng đợi"
        subtitle="Việc chờ, việc chạy và mức song song trong pg-boss"
        actions={
          <>
            <Button
              variant={live ? "secondary" : "outline"}
              size="sm"
              onClick={() => setLive((value) => !value)}
              aria-pressed={live}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  live ? "animate-pulse bg-emerald-500" : "bg-slate-300",
                )}
              />
              {live ? "Đang tự làm mới" : "Đã tạm dừng"}
            </Button>
            <Button size="sm" onClick={() => void reconcile()} loading={reconciling}>
              <Wrench className="size-4.5" />
              Nhặt việc kẹt
            </Button>
          </>
        }
      />

      {(stats.error || config.error) && (
        <Alert tone="danger">{stats.error ?? config.error}</Alert>
      )}

      <MetricStrip
        items={[
          {
            label: "Đang chờ",
            value: stats.data ? formatCount(stats.data.totalWaiting) : "—",
            hint: "Mọi hàng đợi",
          },
          {
            label: "Đang chạy",
            value: stats.data ? formatCount(stats.data.totalActive) : "—",
          },
          {
            label: "Tổng song song",
            value: rows ? formatCount(totalConcurrency) : "—",
            hint: "Trần việc chạy cùng lúc",
          },
        ]}
      />

      <SectionCard
        title="Từng hàng đợi"
        description={rows ? `${rows.length} hàng · đổi cấu hình ăn sau ≤30 giây` : undefined}
        contentClassName="p-0"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              stats.reload();
              config.reload();
            }}
            loading={rows !== null && (stats.loading || config.loading) && !live}
            aria-label="Tải lại số liệu hàng đợi"
          >
            <ArrowsClockwise className="size-4.5" />
          </Button>
        }
      >
        {!rows ? (
          <div className="p-4">
            <Skeleton className="h-80" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hàng đợi</TableHead>
                  <TableHead className="text-right">Chờ</TableHead>
                  <TableHead className="text-right">Đang chạy</TableHead>
                  <TableHead className="text-right">Tổng</TableHead>
                  <TableHead className="text-right">Song song</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{purposeLabel(row.name)}</p>
                      <p className="font-mono text-2xs text-slate-400">{row.name}</p>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono tabular-nums",
                        row.size > 0 ? "font-bold text-amber-600" : "text-slate-400",
                      )}
                    >
                      {formatCount(row.size)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono tabular-nums",
                        row.active > 0 ? "font-bold text-primary-600" : "text-slate-400",
                      )}
                    >
                      {formatCount(row.active)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-500 tabular-nums">
                      {formatCount(row.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-semibold text-slate-900">
                        {row.concurrency}
                      </span>
                      {row.serial && (
                        <Badge variant="info" className="ml-2">
                          serial
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-slate-500">
                      {row.note ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(row)}
                        aria-label={`Sửa cấu hình ${row.name}`}
                        title="Sửa cấu hình"
                      >
                        <PencilSimple className="size-4.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {editing && (
        <QueueConfigModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            config.reload();
            stats.reload();
          }}
        />
      )}
    </div>
  );
}
