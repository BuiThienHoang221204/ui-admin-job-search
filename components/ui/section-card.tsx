import type { ReactNode } from "react";
import { cn } from "@/utils";

interface SectionCardProps {
  title: ReactNode;
  /** Thông tin phụ ngắn, hiện cùng dòng tiêu đề; đừng dùng để giải thích dài. */
  description?: ReactNode;
  /** Nội dung căn phải trên cùng hàng với tiêu đề (nút, bộ lọc, huy hiệu trạng thái). */
  actions?: ReactNode;
  className?: string;
  /** Mặc định `p-4`; bảng tràn sát mép thì truyền `p-0`. */
  contentClassName?: string;
  children: ReactNode;
}

// Bản admin theo kiểu Workbench: viền mảnh, không bóng, không icon trang trí, tiêu đề một dòng.
export function SectionCard({
  title,
  description,
  actions,
  className,
  contentClassName,
  children,
}: SectionCardProps) {
  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white", className)}>
      <header className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 px-4 py-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-500">{description}</p>}
        {actions && (
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>
      <div className={cn("space-y-4 p-4", contentClassName)}>{children}</div>
    </section>
  );
}
