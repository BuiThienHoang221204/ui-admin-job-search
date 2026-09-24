"use client";

import { useState } from "react";
import { cn, formatCompact, formatCount } from "@/utils";

export interface BarSeries<K extends string> {
  key: K;
  label: string;
  // Lớp nền của mảng màu, ví dụ "bg-chart-in"; chữ không bao giờ mang màu chuỗi.
  swatch: string;
}

export interface StackedBar<K extends string> {
  id: string;
  label: string;
  title: string;
  values: Record<K, number>;
  note?: string;
}

const TICKS = 4;

// Bước chia "đẹp" 1/2/2,5/5 × 10^k để nhãn trục là số tròn.
function niceStep(max: number): number {
  const raw = max / TICKS;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10;
  return nice * power;
}

// Cột chồng theo thời gian: một trục, lưới mảnh, cột ≤ 24px bo 4px ở đầu, khe 2px giữa các mảng.
export function StackedBars<K extends string>({
  bars,
  series,
  unit,
}: {
  bars: StackedBar<K>[];
  series: BarSeries<K>[];
  unit: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const totals = bars.map((bar) => series.reduce((sum, s) => sum + bar.values[s.key], 0));
  const peak = Math.max(0, ...totals);
  const step = peak > 0 ? niceStep(peak) : 1;
  // Trục dừng ở bước tròn ngay trên đỉnh, không kéo lên đủ 4 bước làm cột cao nhất lùn đi.
  const steps = Math.max(1, Math.ceil(peak / step));
  const top = step * steps;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => step * (steps - i));

  // Nhãn trục X: đủ chỗ thì hiện hết, không thì cách đều và luôn giữ nhãn cuối.
  const every = bars.length <= 12 ? 1 : Math.ceil(bars.length / 8);
  const showLabel = (index: number) => index === bars.length - 1 || index % every === 0;

  const seriesTotals = series.map((s) => bars.reduce((sum, bar) => sum + bar.values[s.key], 0));
  const active = hover === null ? null : bars[hover];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
        {series.map((s, index) => (
          <span key={s.key} className="inline-flex items-center gap-2">
            <span className={cn("size-2.5 rounded-sm", s.swatch)} />
            {s.label}
            <span className="font-mono font-semibold text-slate-900">{formatCount(seriesTotals[index])}</span>
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        {/* Trục Y: số tròn rút gọn, canh phải, nằm đúng trên vạch lưới. */}
        <div className="relative h-56 w-12 shrink-0 font-mono text-2xs text-slate-400">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(1 - tick / top) * 100}%` }}
            >
              {formatCompact(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-56" onMouseLeave={() => setHover(null)}>
            {ticks.map((tick) => (
              <div
                key={tick}
                className={cn(
                  "pointer-events-none absolute inset-x-0 h-px",
                  tick === 0 ? "bg-slate-300" : "bg-slate-100",
                )}
                style={{ top: `${(1 - tick / top) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex">
              {bars.map((bar, index) => {
                const total = totals[index];
                const lastKey = [...series].reverse().find((s) => bar.values[s.key] > 0)?.key;
                return (
                  <button
                    key={bar.id}
                    type="button"
                    onMouseEnter={() => setHover(index)}
                    onFocus={() => setHover(index)}
                    onBlur={() => setHover(null)}
                    aria-label={`${bar.title}: ${formatCount(total)} ${unit}`}
                    className={cn(
                      "flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-300",
                      hover === index && "bg-slate-100/70",
                    )}
                  >
                    {total === 0 ? (
                      <span className="mb-px h-0.5 w-full max-w-6 rounded-full bg-slate-200" />
                    ) : (
                      <span
                        className="flex w-[60%] max-w-6 min-w-1 flex-col-reverse gap-0.5"
                        style={{ height: `${(total / top) * 100}%` }}
                      >
                        {series.map((s) =>
                          bar.values[s.key] > 0 ? (
                            <span
                              key={s.key}
                              className={cn(
                                "w-full min-h-0.5",
                                s.swatch,
                                s.key === lastKey && "rounded-t-sm",
                              )}
                              style={{ flexGrow: bar.values[s.key], flexBasis: 0 }}
                            />
                          ) : null,
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {active && hover !== null && (
              <Tooltip
                bar={active}
                series={series}
                unit={unit}
                total={totals[hover]}
                // Nửa trái neo mép trái của cột, nửa phải neo mép phải: tooltip không tràn khỏi thẻ.
                left={((hover + 0.5) / bars.length) * 100}
                alignRight={hover >= bars.length / 2}
              />
            )}
          </div>

          <div className="mt-2 flex">
            {bars.map((bar, index) => (
              <span
                key={bar.id}
                className={cn(
                  "min-w-0 flex-1 text-center font-mono text-2xs whitespace-nowrap",
                  hover === index ? "font-semibold text-slate-900" : "text-slate-400",
                )}
              >
                {showLabel(index) || hover === index ? bar.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tooltip<K extends string>({
  bar,
  series,
  unit,
  total,
  left,
  alignRight,
}: {
  bar: StackedBar<K>;
  series: BarSeries<K>[];
  unit: string;
  total: number;
  left: number;
  alignRight: boolean;
}) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none absolute top-2 z-10 w-52 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg",
        alignRight ? "-translate-x-[calc(100%+12px)]" : "translate-x-3",
      )}
      style={{ left: `${left}%` }}
    >
      <p className="mb-2 font-semibold text-slate-900">{bar.title}</p>
      <dl className="space-y-1">
        {[...series].reverse().map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-slate-600">
              <span className={cn("size-2 rounded-sm", s.swatch)} />
              {s.label}
            </dt>
            <dd className="font-mono text-slate-900">{formatCount(bar.values[s.key])}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-1">
          <dt className="text-slate-500">Tổng</dt>
          <dd className="font-mono font-semibold text-slate-900">
            {formatCount(total)} {unit}
          </dd>
        </div>
      </dl>
      {bar.note && <p className="mt-2 text-2xs text-slate-500">{bar.note}</p>}
    </div>
  );
}
