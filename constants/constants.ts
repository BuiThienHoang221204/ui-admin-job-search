import type { AiFailureKind, WorkStatus } from "@/types";

// Backend chặn `days` trong khoảng 1–90.
export const RANGE_TABS = [
  { value: "1", label: "24 giờ" },
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
];

export type BadgeTone = "warning" | "danger" | "info" | "neutral" | "success";

export interface FailureKindMeta {
  kind: AiFailureKind;
  label: string;
  meaning: string;
  action: string;
  variant: BadgeTone;
  accent: string;
}

// Không gộp thành một con số "lỗi": SCHEMA đòi đổi model, UPSTREAM đòi đổi nhà cung cấp — hai hành động ngược nhau.
export const FAILURE_KINDS: FailureKindMeta[] = [
  {
    kind: "SCHEMA",
    label: "SCHEMA",
    meaning: "Model trả về dữ liệu không khớp schema — nó quá yếu cho tác vụ.",
    action: "Siết schema, viết lại mô tả trường, hoặc đổi sang model mạnh hơn.",
    variant: "warning",
    accent: "text-amber-600",
  },
  {
    kind: "TIMEOUT",
    label: "TIMEOUT",
    meaning: "Lời gọi vượt hạn chờ và bị huỷ.",
    action: "Gateway đang có vấn đề — kiểm tra tình trạng nhà cung cấp.",
    variant: "danger",
    accent: "text-rose-600",
  },
  {
    kind: "UPSTREAM",
    label: "UPSTREAM",
    meaning: "Gateway trả về lỗi (401/403, 429 quá tải, hoặc 5xx).",
    action: "Đổi nhà cung cấp hoặc giảm tải cho gateway hiện tại.",
    variant: "info",
    accent: "text-sky-600",
  },
  {
    kind: "OTHER",
    label: "OTHER",
    meaning: "Những nguyên nhân còn lại chưa phân loại được.",
    action: "Đọc thông báo lỗi ở Nhật ký lỗi AI để biết thêm.",
    variant: "neutral",
    accent: "text-slate-600",
  },
];

export const failureMeta = (kind: AiFailureKind | null): FailureKindMeta =>
  FAILURE_KINDS.find((entry) => entry.kind === (kind ?? "OTHER")) ??
  FAILURE_KINDS[FAILURE_KINDS.length - 1];

// Khoá kỹ thuật do backend ghi vào AiCall.purpose và tên hàng đợi pg-boss.
const PURPOSE_LABELS: Record<string, string> = {
  "match.evaluate": "Chấm điểm phù hợp",
  "match.requirements": "Đối chiếu yêu cầu",
  "match.shortlist": "Phát suất chấm AI",
  "job.requirements": "Rút yêu cầu từ JD",
  "job.fromUrl": "Đọc tin từ URL",
  "skill.canonicalize": "Chuẩn hoá kỹ năng",
  "document.cv": "Tối ưu CV",
  "document.coverLetter": "Viết cover letter",
  "document.applicationEmail": "Viết email ứng tuyển",
  "document.formAnswer": "Trả lời câu hỏi ứng tuyển",
  "document.generate": "Sinh tài liệu",
  "interview.prep": "Chuẩn bị phỏng vấn",
  "interview.open": "Mở phỏng vấn thử",
  "interview.turn": "Lượt phỏng vấn thử",
  "question.answer": "Gợi ý trả lời câu hỏi",
  "upskill.report": "Báo cáo nâng cấp kỹ năng",
  "upskill.gaps": "Phân tích thiếu hụt kỹ năng",
  "upskill.plan": "Lập lộ trình học",
  "profile.synthesize": "Dựng hồ sơ từ CV",
  "company.brief": "Tìm hiểu công ty",
  "scrape.plan": "Lập kế hoạch quét tin",
  "scrape.run": "Quét tin tuyển dụng",
};

// Khoá lạ hiện nguyên văn thay vì bị nuốt thành ô trống.
export const purposeLabel = (purpose: string): string =>
  PURPOSE_LABELS[purpose] ??
  // `probe.*` do script đo model ghi thẳng vào ai_calls, không phải tác vụ của app.
  (purpose.startsWith("probe.") ? "Chạy thử model (script)" : purpose);

export const WORK_STATUS: Record<WorkStatus, { label: string; variant: BadgeTone }> = {
  PENDING: { label: "Chờ", variant: "info" },
  RUNNING: { label: "Đang chạy", variant: "warning" },
  DONE: { label: "Xong", variant: "success" },
  FAILED: { label: "Hỏng", variant: "danger" },
};

// Độ trễ chung cho mọi ô tìm kiếm gọi API: gõ liên tục không bắn request mỗi phím.
export const SEARCH_DEBOUNCE_MS = 300;
