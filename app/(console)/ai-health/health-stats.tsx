import type { AiHealth } from "@/types";
import { MetricStrip } from "@/components/admin/metric-strip";
import { formatCount, formatDuration } from "@/utils";

// Ngưỡng báo động khớp successRateTone: gateway hỏng quá một phần năm lời gọi.
const ALERT_RATE = 80;

export function HealthStats({ health }: { health: AiHealth }) {
  const failed = health.total - health.ok;

  return (
    <MetricStrip
      items={[
        {
          label: "Tổng lời gọi",
          value: formatCount(health.total),
          hint: `${formatCount(health.ok)} thành công`,
        },
        {
          label: "Tỷ lệ thành công",
          value: `${health.successRate}%`,
          alert: health.successRate < ALERT_RATE,
          hint: failed > 0 ? `${formatCount(failed)} hỏng` : "Không hỏng lần nào",
        },
        { label: "Độ trễ p50", value: formatDuration(health.p50Ms) },
        { label: "Độ trễ p95", value: formatDuration(health.p95Ms) },
      ]}
    />
  );
}
