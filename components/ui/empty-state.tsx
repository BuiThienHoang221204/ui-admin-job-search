import type { ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { cn } from "@/utils";

interface EmptyStateProps {
  icon?: PhosphorIcon;
  title: string;
  description?: ReactNode;
  /** Nút dẫn người dùng tới việc tiếp theo làm được. */
  action?: ReactNode;
  className?: string;
}

// Bản admin: "chưa có gì" là tin bình thường, nên gọn trong vài dòng canh trái thay vì khối lớn giữa khung.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex items-start gap-3 px-4 py-4", className)}>
      {Icon && <Icon className="mt-0.5 size-4.5 shrink-0 text-slate-400" />}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

/** Một dòng chữ mờ, dùng khi bộ lọc không khớp gì hoặc danh sách trống. */
export function EmptyHint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("text-sm text-slate-500", className)}>{children}</p>;
}
