import type { WorkStatus } from "@/types";

// Lỗi portal dài vài dòng; ô ma trận chỉ cần mã nhận diện: HTTP code, rồi mã lỗi cuối câu, không có thì "lỗi".
export function shortError(error: string | null): string {
  if (!error) return "lỗi";
  const http = error.match(/\b([45]\d{2})\b/);
  if (http) return http[1];
  const code = error.match(/\(([A-Z_]{3,})\)\s*$/);
  if (code) return code[1].replace(/_FAILED$/, "").toLowerCase();
  return "lỗi";
}

export const isBusy = (status: WorkStatus) => status === "PENDING" || status === "RUNNING";
