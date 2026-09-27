import { formatCount } from "./duration";

export interface TokenBreakdown {
  /** Token thực sự xử lý lần đầu — phần quyết định chi phí. */
  fresh: number | null;
  cached: number;
  output: number | null;
  /** Toàn bộ prompt gửi đi, ĐÃ gồm phần cache. */
  total: number | null;
  /** Bao nhiêu phần trăm prompt đọc lại từ cache; null khi chưa có số liệu. */
  cacheRatio: number | null;
}

// `inputTokens` đã gộp cả phần cache, nên phải trừ ra mới biết lượt gọi tốn gì — đọc thẳng số gộp là hiểu nhầm thành đắt gấp mấy lần.
export function tokenBreakdown(
  inputTokens: number | null,
  outputTokens: number | null,
  cachedTokens: number | null,
): TokenBreakdown {
  const cached = cachedTokens ?? 0;
  if (inputTokens === null) {
    return {
      fresh: null,
      cached,
      output: outputTokens,
      total: null,
      cacheRatio: null,
    };
  }
  // Kẹp về 0: nhà cung cấp báo cache lớn hơn tổng thì thà hiện 0 còn hơn hiện số âm.
  const fresh = Math.max(0, inputTokens - cached);
  return {
    fresh,
    cached,
    output: outputTokens,
    total: inputTokens,
    cacheRatio:
      inputTokens > 0 ? Math.round((cached / inputTokens) * 100) : null,
  };
}

export const tokens = (value: number | null) =>
  value === null ? "—" : formatCount(value);