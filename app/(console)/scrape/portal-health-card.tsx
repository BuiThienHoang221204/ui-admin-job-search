"use client";

import { Fragment, useState } from "react";
import { ArrowsClockwise, CaretDown } from "@phosphor-icons/react/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { apiErrorMessage } from "@/lib/axios";
import { scraperService } from "@/services";
import type { PortalHealth } from "@/types";
import { WORK_STATUS } from "@/constants/constants";
import { Sparkline } from "@/components/admin/sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn, formatCount, formatDateTime, relativeTime } from "@/utils";
import { shortError } from "./scrape-format";

const DOT = {
  PENDING: "bg-sky-500",
  RUNNING: "bg-amber-500 animate-pulse",
  DONE: "bg-emerald-500",
  FAILED: "bg-rose-500",
} as const;

// Portal là thực thể vận hành chính (chỉ vài cái): mỗi dòng trả lời "portal này có ổn không" trước khi xem lịch sử.
export function PortalHealthCard({
  portals,
  cap,
}: {
  portals: PortalHealth[] | null;
  cap: number;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  const reload = async () => {
    setReloading(true);
    try {
      const fresh = await scraperService.reloadPortals();
      toast.success(`Đã nạp lại ${fresh.length} portal từ đĩa.`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "scrape"] });
    } catch (err) {
      toast.danger(apiErrorMessage(err, "Không nạp lại được portal"));
    } finally {
      setReloading(false);
    }
  };

  const enabled = portals?.filter((portal) => portal.enabled).length ?? 0;

  return (
    <SectionCard
      title="Portal"
      description={portals ? `${enabled}/${portals.length} đang bật · trần ${cap} tin mỗi lượt` : undefined}
      contentClassName="p-0"
      actions={
        <Button variant="outline" size="sm" onClick={() => void reload()} loading={reloading}>
          <ArrowsClockwise className="size-4" />
          Nạp lại từ đĩa
        </Button>
      }
    >
      {!portals ? (
        <div className="p-4">
          <Skeleton className="h-40" />
        </div>
      ) : portals.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">
          Chưa có portal nào. Thêm thư mục portal vào <span className="font-mono">.agents/skills/</span> rồi nạp lại.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Portal</th>
                <th className="px-2 py-2 font-medium">Lượt gần nhất</th>
                <th className="px-2 py-2 text-right font-medium">Tin mới</th>
                <th className="w-36 px-2 py-2 font-medium">Xu hướng</th>
                <th className="px-2 py-2 font-medium">Hỏng</th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {portals.map((portal) => {
                const last = portal.lastRun;
                const expanded = open === portal.key;
                return (
                  <Fragment key={portal.key}>
                    <tr
                      onClick={() => setOpen(expanded ? null : portal.key)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn("size-2 shrink-0 rounded-full", last ? DOT[last.status] : "bg-slate-300")}
                            aria-hidden
                          />
                          <span className="font-mono text-xs font-semibold text-slate-900">{portal.key}</span>
                          {!portal.enabled && <Badge variant="neutral">tắt</Badge>}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-xs">
                        {last ? (
                          <>
                            <span className={last.status === "FAILED" ? "font-medium text-rose-700" : "text-slate-700"}>
                              {last.status === "FAILED" ? `Hỏng · ${shortError(last.error)}` : WORK_STATUS[last.status].label}
                            </span>
                            <span className="text-slate-400"> · {relativeTime(last.createdAt)}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">Không có lượt trong khoảng này</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        {last?.status === "DONE" ? (
                          <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                            +{formatCount(last.jobsNew)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        {portal.newSeries.length > 1 ? (
                          <Sparkline
                            values={portal.newSeries}
                            label={`Tin mới ${portal.newSeries.length} lượt gần nhất của ${portal.key}`}
                            className="h-6 w-28 text-primary-500"
                          />
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-xs">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className={portal.failed ? "text-slate-700" : "text-slate-400"}>
                            <span className="font-mono tabular-nums">{portal.failed}</span>/
                            <span className="font-mono tabular-nums">{portal.runs}</span> lượt
                          </span>
                          {portal.failStreak > 1 && (
                            <Badge variant="danger">hỏng {portal.failStreak} lượt liền</Badge>
                          )}
                          {portal.hitCap && (
                            <Badge variant="warning" title={`Lượt xong gần nhất lấy đủ ${cap} tin: portal còn tin nhưng bị cắt`}>
                              chạm trần
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        <CaretDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={6} className="px-4 py-3">
                          <dl className="grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-[8rem_minmax(0,1fr)]">
                            <dt className="text-slate-500">Mô tả</dt>
                            <dd className="text-slate-700">{portal.description || "—"}</dd>
                            <dt className="text-slate-500">CLI</dt>
                            <dd className="font-mono break-all text-slate-700">{portal.cliPath}</dd>
                            <dt className="text-slate-500">Lọc theo ngày đăng</dt>
                            <dd className="text-slate-700">{portal.supportsJobAge ? "Có" : "Không"}</dd>
                            <dt className="text-slate-500">Thành công gần nhất</dt>
                            <dd className="font-mono text-slate-700">
                              {portal.lastSuccessAt ? formatDateTime(portal.lastSuccessAt) : "—"}
                            </dd>
                            {last?.status === "FAILED" && last.error && (
                              <>
                                <dt className="text-slate-500">Lỗi gần nhất</dt>
                                <dd className="text-rose-700">{last.error}</dd>
                              </>
                            )}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
