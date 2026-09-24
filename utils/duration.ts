/**
 * Đọc được ở cả hai đầu thang: 340 ms và 517 giây đều xuất hiện thật trong dữ
 * liệu độ trễ của AI gateway, nên một đơn vị cố định sẽ hoặc mất độ chính xác
 * hoặc khó đọc.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} giây`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} phút ${Math.round(seconds % 60)} giây`;
}

/** Số nguyên theo cách viết tiếng Việt, ví dụ "1.234". */
export function formatCount(value: number): string {
  return value.toLocaleString("vi-VN");
}

const compact = new Intl.NumberFormat("vi-VN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Số rút gọn cho nhãn trục, ví dụ "575,3 N", "1,3 Tr". */
export function formatCompact(value: number): string {
  return compact.format(value);
}

/** Dung lượng file cho người đọc: 812 B, 4,2 KB, 1,3 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} KB`;
  return `${(kb / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
}
