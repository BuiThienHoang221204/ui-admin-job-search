import { WORK_STATUS } from "@/constants/constants";
import type { WorkStatus } from "@/types";

// Portal bị chặn là một TRẠNG THÁI, không phải lỗi mạng: backend gắn mã (BLOCKED) ở cuối câu lỗi rồi tạm ngừng gọi portal đó 30 phút.
export const isBlocked = (error: string | null): boolean => /\(BLOCKED\)\s*$/.test(error ?? "");

// Lỗi portal dài vài dòng; ô ma trận chỉ cần mã nhận diện: bị chặn xét TRƯỚC (câu chặn có kèm số 403 nên xét sau sẽ ra "403"), rồi HTTP code, rồi mã lỗi cuối câu.
export function shortError(error: string | null): string {
  if (!error) return "lỗi";
  if (isBlocked(error)) return "bị chặn";
  const http = error.match(/\b([45]\d{2})\b/);
  if (http) return http[1];
  const code = error.match(/\(([A-Z_]{3,})\)\s*$/);
  if (code) return code[1].replace(/_FAILED$/, "").toLowerCase();
  return "lỗi";
}

// Nhãn trạng thái của lượt gần nhất trên thẻ sức khoẻ portal: "Bị chặn" đứng riêng, không đọc thành "Hỏng · bị chặn".
export function lastRunLabel(status: WorkStatus, error: string | null): string {
  if (status !== "FAILED") return WORK_STATUS[status].label;
  if (isBlocked(error)) return "Bị chặn";
  return `Hỏng · ${shortError(error)}`;
}

export const isBusy = (status: WorkStatus) => status === "PENDING" || status === "RUNNING";
