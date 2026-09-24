"use client";

import { useState } from "react";
import { Play } from "@phosphor-icons/react/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/axios";
import { keys } from "@/lib/query-keys";
import { adminService, scraperService } from "@/services";
import { PageHeader } from "@/components/shell/page-header";
import { DateRangeFilter, initialRange, type RangeState } from "@/components/admin/date-range-filter";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BatchMatrixCard } from "./batch-matrix-card";
import { PortalHealthCard } from "./portal-health-card";

export function ScrapeView() {
  const [starting, setStarting] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Mặc định 24 giờ như mọi bộ lọc thời gian khác trong admin.
  const [range, setRange] = useState<RangeState>(() => initialRange("24h"));
  const health = useApiQuery(
    keys.portalHealth(range.range),
    () => scraperService.portalHealth({ limit: 100, ...range.range }),
    { errorMessage: "Không tải được tình trạng portal", keepPrevious: true },
  );
  const cap = health.data?.cap ?? 50;

  const runNow = async () => {
    setStarting(true);
    setError(null);
    setReceipt(null);
    try {
      const result = await adminService.scrapeNow();
      setReceipt(
        result.queued > 0
          ? `Đã xếp hàng ${result.queued} lượt quét: ${result.runs.map((run) => run.portal).join(", ")}. Mỗi portal mất vài phút; bảng tự làm mới.`
          : result.note,
      );
      // Nạp lại cả portal lẫn lịch sử để thấy lượt vừa xếp; chính việc đó bật tự làm mới.
      await queryClient.invalidateQueries({ queryKey: ["admin", "scrape"] });
    } catch (err) {
      setError(apiErrorMessage(err, "Không chạy được lượt quét"));
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quét tin tuyển dụng"
        subtitle="Cron hằng đêm 23:00 quét mọi portal đang bật"
        actions={
          <Button size="sm" onClick={() => void runNow()} loading={starting}>
            <Play className="size-4.5" />
            Quét ngay
          </Button>
        }
      />

      {/* Một bộ lọc cho cả trang: số liệu portal và lịch sử luôn nói về cùng một khoảng thời gian. */}
      <DateRangeFilter value={range} onChange={setRange} />

      {receipt && <Alert tone="info">{receipt}</Alert>}
      {(error || health.error) && <Alert tone="danger">{error ?? health.error}</Alert>}

      <PortalHealthCard portals={health.data?.items ?? null} cap={cap} />
      <BatchMatrixCard
        portals={(health.data?.items ?? []).map((portal) => portal.key)}
        cap={cap}
        range={range.range}
      />
    </div>
  );
}
