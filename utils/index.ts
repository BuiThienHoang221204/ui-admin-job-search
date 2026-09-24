// Chỉ chép những nhóm hàm màn quản trị dùng; lương, địa điểm, blob ở lại app người dùng.
export { cn } from "./cn";
export { companyColor, companyInitials, personInitials } from "./company";
export { formatDate, formatDateTime, relativeDay, relativeTime } from "./date";
export { formatBytes, formatCompact, formatCount, formatDuration } from "./duration";
export {
  matchTone,
  matchToneClasses,
  scoreBarClass,
  successRateTone,
  type ScoreTone,
  type ToneClasses,
} from "./score";
export { fold, isJsonText, joinList, parseList, toJsonText } from "./text";
