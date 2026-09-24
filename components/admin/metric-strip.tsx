import Link from "next/link";
import type { Delta } from "@/utils/delta";
import { cn } from "@/utils";
import { Sparkline } from "./sparkline";

export interface Metric {
  label: string;
  value: string;
  // Chỉ bật khi chỉ số đang vượt ngưỡng; màu cảnh báo dành riêng cho chỗ bất thường.
  alert?: boolean;
  delta?: Delta | null;
  hint?: string;
  spark?: number[];
  href?: string;
}

const DELTA_TONE = {
  good: "text-emerald-700",
  bad: "text-rose-700",
  neutral: "text-slate-500",
} as const;

// Lớp tĩnh để Tailwind sinh được; số cột ở màn lớn bằng đúng số chỉ số, không chừa ô xám trống.
const LG_COLS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

// Một dải phẳng chia bằng đường mảnh, thay cho lưới thẻ KPI rời: các chỉ số đọc liền một hàng như bảng điều khiển.
export function MetricStrip({ items }: { items: Metric[] }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-200 gap-px",
        LG_COLS[items.length] ?? "lg:grid-cols-5",
      )}
    >
      {items.map((item, index) => {
        const body = (
          <>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              {item.alert && <span className="size-1.5 rounded-full bg-rose-500" aria-hidden />}
              {item.label}
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-2xl font-semibold tabular-nums",
                item.alert ? "text-rose-600" : "text-slate-900",
              )}
            >
              {item.value}
            </p>
            <p className="mt-0.5 min-h-4 text-xs">
              {item.delta && (
                <span className={cn("font-medium", DELTA_TONE[item.delta.tone])}>
                  {item.delta.text}
                </span>
              )}
              {item.delta && item.hint && <span className="text-slate-300"> · </span>}
              {item.hint && <span className="text-slate-500">{item.hint}</span>}
            </p>
            {item.spark && (
              <Sparkline
                values={item.spark}
                label={`Xu hướng ${item.label.toLowerCase()}`}
                className={cn("mt-2", item.alert ? "text-rose-500" : "text-primary-500")}
              />
            )}
          </>
        );
        // Số ô lẻ thì ô cuối chiếm trọn hàng ở lưới 2 cột, không để lại lỗ xám.
        const lastOdd = items.length % 2 === 1 && index === items.length - 1;
        const cell = cn("block bg-white px-4 py-3", lastOdd && "col-span-2 lg:col-span-1");
        return item.href ? (
          <Link key={item.label} href={item.href} className={cn(cell, "transition-colors hover:bg-slate-50")}>
            {body}
          </Link>
        ) : (
          <div key={item.label} className={cell}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
