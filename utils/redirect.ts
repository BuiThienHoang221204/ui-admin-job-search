const BASE = "http://careelot.invalid";

/** Tham số `next` sau đăng nhập -> đường dẫn nội bộ an toàn, không thì trả `fallback`. */
// Giải bằng chính URL parser mà router dùng: kiểm chuỗi kiểu startsWith("/") để lọt "/\evil.com" và "/<TAB>/evil.com".
export function safeNextPath(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(raw))
    return fallback;
  try {
    const url = new URL(raw, BASE);
    return url.origin === BASE
      ? url.pathname + url.search + url.hash
      : fallback;
  } catch {
    return fallback;
  }
}
