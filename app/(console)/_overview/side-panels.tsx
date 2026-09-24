import Link from "next/link";
import type { Overview } from "@/types";
import { purposeLabel, WORK_STATUS } from "@/constants/constants";
import { SectionCard } from "@/components/ui/section-card";
import { cn, formatCount, relativeTime } from "@/utils";

const STATUS_DOT = {
  PENDING: "bg-sky-500",
  RUNNING: "bg-amber-500 animate-pulse",
  DONE: "bg-emerald-500",
  FAILED: "bg-rose-500",
} as const;

// Hàng đợi trống là tin tốt: một dòng là đủ, chỉ hàng đang có việc mới được liệt kê.
export function QueuePanel({
  queues,
  total,
}: {
  queues: Overview["queues"];
  total: number;
}) {
  return (
    <SectionCard
      title="Hàng đợi"
      description={queues.length ? `${queues.length}/${total} hàng có việc` : undefined}
      actions={
        <Link href="/queues" className="text-xs font-medium text-primary-600 hover:text-primary-700">
          Chi tiết
        </Link>
      }
      contentClassName="p-0"
    >
      {queues.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500">
          Cả {total} hàng đợi đều trống.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {queues.map((queue) => (
            <li key={queue.name} className="flex items-center justify-between gap-3 px-4 py-2">
              <span className="min-w-0 truncate text-sm text-slate-800">{purposeLabel(queue.name)}</span>
              <span className="shrink-0 text-xs text-slate-500">
                <span className={cn("font-mono tabular-nums", queue.size > 0 && "font-semibold text-amber-700")}>
                  {formatCount(queue.size)}
                </span>{" "}
                chờ ·{" "}
                <span className={cn("font-mono tabular-nums", queue.active > 0 && "font-semibold text-slate-900")}>
                  {formatCount(queue.active)}
                </span>{" "}
                chạy
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

// Lượt quét mới nhất của từng portal đang đăng ký: portal nào hỏng hoặc lâu không chạy lộ ra ngay.
export function ScrapePanel({ portals }: { portals: Overview["portals"] }) {
  return (
    <SectionCard
      title="Quét tin"
      description="lượt gần nhất mỗi portal"
      actions={
        <Link href="/scrape" className="text-xs font-medium text-primary-600 hover:text-primary-700">
          Chi tiết
        </Link>
      }
      contentClassName="p-0"
    >
      {portals.length === 0 ? (
        <p className="px-4 py-3 text-sm text-slate-500">Chưa có lượt quét nào.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {portals.map((run) => (
            <li key={run.portal} className="flex items-center gap-3 px-4 py-2">
              <span
                className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[run.status])}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-800">{run.portal}</span>
              <span className="shrink-0 text-xs text-slate-500">
                {run.status === "DONE" ? (
                  <>
                    <span className="font-mono text-slate-900 tabular-nums">+{formatCount(run.jobsNew)}</span> tin
                  </>
                ) : (
                  WORK_STATUS[run.status].label
                )}{" "}
                · {relativeTime(run.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
