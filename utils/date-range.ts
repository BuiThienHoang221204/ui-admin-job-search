export type RangePreset = "24h" | "yesterday" | "7d" | "30d" | "all" | "custom";

export interface TimeRange {
  from?: string;
  to?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

// 00:00 giờ Việt Nam của ngày chứa `date`, trả về mốc UTC.
function vnDayStart(date: Date): Date {
  const local = new Date(date.getTime() + VN_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - VN_OFFSET_MS,
  );
}

// "2026-09-24" (ô chọn ngày) → 00:00 giờ Việt Nam ngày đó.
function vnDateStart(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]) - VN_OFFSET_MS);
}

/** Khoảng thời gian của một mốc, theo lịch Việt Nam; `to` là mốc loại trừ. */
export function rangeFor(
  preset: RangePreset,
  custom: { from: string; to: string } = { from: "", to: "" },
  now = new Date(),
): TimeRange | null {
  const today = vnDayStart(now);
  switch (preset) {
    case "24h":
      return { from: new Date(now.getTime() - DAY_MS).toISOString() };
    case "yesterday":
      return {
        from: new Date(today.getTime() - DAY_MS).toISOString(),
        to: today.toISOString(),
      };
    case "7d":
      return { from: new Date(today.getTime() - 6 * DAY_MS).toISOString() };
    case "30d":
      return { from: new Date(today.getTime() - 29 * DAY_MS).toISOString() };
    case "all":
      return {};
    case "custom": {
      const from = vnDateStart(custom.from);
      const to = vnDateStart(custom.to);
      // Chưa chọn đủ hoặc chọn ngược thì chưa áp, tránh gọi API với khoảng vô nghĩa.
      if (!from || !to || to < from) return null;
      return { from: from.toISOString(), to: new Date(to.getTime() + DAY_MS).toISOString() };
    }
  }
}

/** Ngày hôm nay theo giờ Việt Nam dạng YYYY-MM-DD, làm `max` cho ô chọn ngày. */
export function vnToday(now = new Date()): string {
  return new Date(now.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}
