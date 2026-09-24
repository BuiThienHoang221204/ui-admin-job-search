"use client";

import { X } from "@phosphor-icons/react/ssr";

/**
 * Một bộ lọc ĐANG bật, kèm nút bỏ.
 *
 * Tách ra khỏi `job-filter-bar` để trang việc làm và ngân hàng câu hỏi dùng
 * chung một dáng: hai hàng chip trông khác nhau là dấu hiệu người dùng đọc thấy
 * ngay, dù không gọi tên được.
 */
export function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="bg-primary-50 text-primary-700 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ lọc ${label}`}
        className="cursor-pointer rounded-full p-0.5 transition-colors hover:bg-white/70"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
