import Link from "next/link";
import { CheckCircle, Warning, WarningOctagon } from "@phosphor-icons/react/ssr";
import type { AttentionItem } from "@/types";
import { cn } from "@/utils";

const SEVERITY = {
  danger: {
    icon: WarningOctagon,
    stripe: "bg-rose-500",
    iconClass: "text-rose-600",
    label: "Sự cố",
  },
  warning: {
    icon: Warning,
    stripe: "bg-amber-500",
    iconClass: "text-amber-600",
    label: "Cảnh báo",
  },
} as const;

// Thứ đang hỏng đứng đầu trang; không có gì thì thu còn một dòng, tin tốt không cần chiếm chỗ.
export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600">
        <CheckCircle className="size-4.5 text-emerald-600" weight="fill" />
        Không có gì cần xử lý.
      </p>
    );
  }

  return (
    <section
      aria-label="Cần xử lý"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white"
    >
      <h2 className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
        Cần xử lý <span className="font-mono text-slate-400">{items.length}</span>
      </h2>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => {
          const meta = SEVERITY[item.severity];
          const Icon = meta.icon;
          return (
            <li key={item.id} className="relative flex items-start gap-3 py-3 pr-4 pl-5">
              <span className={cn("absolute inset-y-0 left-0 w-1", meta.stripe)} aria-hidden />
              <Icon className={cn("mt-0.5 size-4.5 shrink-0", meta.iconClass)} weight="fill" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  <span className="sr-only">{meta.label}: </span>
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">{item.detail}</p>
              </div>
              <Link
                href={item.href}
                className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                {item.action}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
