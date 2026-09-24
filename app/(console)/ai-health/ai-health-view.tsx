"use client";

import { useState } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { keys } from "@/lib/query-keys";
import { adminService } from "@/services";
import { PageHeader } from "@/components/shell/page-header";
import { FailureKindsCard } from "@/components/admin/failure-kinds";
import { RANGE_TABS } from "@/constants/constants";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonPage } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { HealthStats } from "./health-stats";
import { ModelTable, PurposeTable } from "./health-tables";

export function AiHealthView() {
  const [days, setDays] = useState(1);

  // `days` nằm trong key nên đổi tab là một truy vấn khác, quay lại mốc cũ thì dùng cache.
  const health = useApiQuery(keys.aiHealth(days), () => adminService.aiHealth(days), {
    errorMessage: "Không tải được số liệu AI gateway",
    keepPrevious: true,
  });

  const data = health.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sức khoẻ AI"
        subtitle="Tỷ lệ thành công, độ trễ và nguyên nhân hỏng của lời gọi model"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={health.reload}
            loading={data !== null && health.loading}
          >
            <ArrowsClockwise className="size-4.5" />
            Tải lại
          </Button>
        }
      />

      <Tabs
        tabs={RANGE_TABS}
        value={String(days)}
        onChange={(value) => setDays(Number(value))}
        className="max-w-sm"
      />

      {health.error ? (
        <Alert tone="danger">{health.error}</Alert>
      ) : !data ? (
        <SkeletonPage>
          <Skeleton className="h-24" />
          <Skeleton className="h-44" />
          <Skeleton className="h-64" />
        </SkeletonPage>
      ) : data.total === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmptyState
            title="Chưa có lời gọi model nào trong khoảng này"
            description="Chọn khoảng thời gian rộng hơn."
          />
        </div>
      ) : (
        <div className="space-y-5">
          <HealthStats health={data} />
          <FailureKindsCard failures={data.failures} />
          <PurposeTable rows={data.byPurpose} />
          <ModelTable rows={data.byModel} />
          <p className="text-xs text-slate-500">
            Độ trễ đọc theo phân vị vì đuôi rất dài · tính trên tối đa 5.000 lời gọi gần nhất.
          </p>
        </div>
      )}
    </div>
  );
}
