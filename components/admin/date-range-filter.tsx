"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { rangeFor, vnToday, type RangePreset, type TimeRange } from "@/utils/date-range";

const PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: "24h", label: "24 giờ" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "all", label: "Tất cả" },
  { value: "custom", label: "Tuỳ chọn" },
];

export interface RangeState {
  preset: RangePreset;
  // Tính một lần lúc chọn và giữ nguyên: tính lại mỗi lần render thì "24 giờ" đổi từng mili-giây, khoá cache đổi theo và query gọi lại không ngừng.
  range: TimeRange;
}

export const initialRange = (preset: RangePreset): RangeState => ({
  preset,
  range: rangeFor(preset) ?? {},
});

// Bộ lọc thời gian dùng chung: các mốc có sẵn và khoảng tuỳ chọn theo ngày (giờ Việt Nam).
export function DateRangeFilter({
  value,
  onChange,
}: {
  value: RangeState;
  onChange: (next: RangeState) => void;
}) {
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [customOpen, setCustomOpen] = useState(value.preset === "custom");
  const today = vnToday();

  const pick = (preset: RangePreset) => {
    if (preset === "custom") {
      setCustomOpen(true);
      const range = rangeFor("custom", custom);
      if (range) onChange({ preset, range });
      return;
    }
    setCustomOpen(false);
    onChange({ preset, range: rangeFor(preset) ?? {} });
  };

  const setDay = (key: "from" | "to", day: string) => {
    const next = { ...custom, [key]: day };
    setCustom(next);
    const range = rangeFor("custom", next);
    if (range) onChange({ preset: "custom", range });
  };

  const invalid = customOpen && custom.from && custom.to && custom.to < custom.from;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Cùng component Tabs với mọi bộ lọc thời gian khác trong admin, để các trang trông và bấm như nhau. */}
      <Tabs
        tabs={PRESETS}
        value={customOpen ? "custom" : value.preset}
        onChange={(next) => pick(next as RangePreset)}
      />
      {customOpen && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <input
            type="date"
            aria-label="Từ ngày"
            value={custom.from}
            max={custom.to || today}
            onChange={(event) => setDay("from", event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-800"
          />
          <span>đến</span>
          <input
            type="date"
            aria-label="Đến ngày"
            value={custom.to}
            min={custom.from || undefined}
            max={today}
            onChange={(event) => setDay("to", event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-800"
          />
          {invalid && <span className="text-rose-600">Ngày kết thúc phải sau ngày bắt đầu</span>}
          {!custom.from || !custom.to ? <span>chọn đủ hai ngày để áp dụng</span> : null}
        </div>
      )}
    </div>
  );
}
