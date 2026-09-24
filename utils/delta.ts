export type DeltaTone = "good" | "bad" | "neutral";

export interface Delta {
  text: string;
  tone: DeltaTone;
}

// Kỳ trước quá nhỏ thì phần trăm thay đổi là nhiễu (2 → 198 là "+9800%"), nên không so.
const MIN_BASE = 10;

/** Chênh lệch theo phần trăm; `better` nói hướng nào là tốt, "neutral" thì chỉ báo không tô màu. */
export function countDelta(
  current: number,
  previous: number,
  better: "up" | "down" | "neutral",
): Delta | null {
  if (previous < MIN_BASE) return null;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return { text: "không đổi", tone: "neutral" };
  const up = change > 0;
  const tone: DeltaTone =
    better === "neutral" ? "neutral" : up === (better === "up") ? "good" : "bad";
  return { text: `${up ? "▲" : "▼"} ${Math.abs(change)}%`, tone };
}

/** Chênh lệch theo điểm phần trăm, dùng cho tỷ lệ (51% so với 78% là "▼ 27 điểm", không phải "▼ 35%"). */
export function pointDelta(current: number | null, previous: number | null): Delta | null {
  if (current === null || previous === null) return null;
  const change = Math.round((current - previous) * 10) / 10;
  if (change === 0) return { text: "không đổi", tone: "neutral" };
  return {
    text: `${change > 0 ? "▲" : "▼"} ${Math.abs(change).toLocaleString("vi-VN")} điểm`,
    tone: change > 0 ? "good" : "bad",
  };
}
