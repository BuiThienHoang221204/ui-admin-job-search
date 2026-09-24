"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ErrorGroup } from "@/types";
import { failureMeta, purposeLabel } from "@/constants/constants";
import { SectionCard } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";
import { EmptyHint } from "@/components/ui/empty-state";
import { cn, formatCount, relativeTime } from "@/utils";

// "+49" / "−3" so với kỳ trước; nhóm chưa từng xuất hiện thì ghi "mới" thay vì "+49" từ con số 0.
function trend(group: ErrorGroup, comparable: boolean) {
  if (!comparable) return { text: "—", className: "text-slate-300" };
  if (group.previousCount === 0) return { text: "mới", className: "text-rose-700" };
  const change = group.count - group.previousCount;
  if (change === 0) return { text: "=", className: "text-slate-400" };
  return change > 0
    ? { text: `+${formatCount(change)}`, className: "text-rose-700" }
    : { text: `−${formatCount(-change)}`, className: "text-emerald-700" };
}

// Gom lỗi theo tác vụ và loại: nhìn ra ngay nhóm nào áp đảo, thay vì 5 dòng lặp cùng một câu.
export function ErrorGroupsPanel({
  groups,
  failed,
  comparable,
  className,
}: {
  groups: ErrorGroup[];
  failed: number;
  // Kỳ trước đủ lời gọi để so; không thì mọi nhóm đều thành "mới", là nhiễu chứ không phải tin.
  comparable: boolean;
  className?: string;
}) {
  const router = useRouter();

  return (
    <SectionCard
      title="Lỗi AI theo nhóm"
      description={
        failed > 0
          ? `${formatCount(failed)} lần hỏng · ${groups.length} nhóm lớn nhất${comparable ? "" : " · kỳ trước quá ít lời gọi để so"}`
          : undefined
      }
      actions={
        <Link href="/ai-failures" className="text-xs font-medium text-primary-600 hover:text-primary-700">
          Nhật ký lỗi
        </Link>
      }
      contentClassName="p-0"
      className={className}
    >
      {groups.length === 0 ? (
        <div className="p-4">
          <EmptyHint>Không có lời gọi nào hỏng trong kỳ này.</EmptyHint>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* table-fixed: cột số có bề ngang cố định, cột tác vụ ăn phần còn lại để câu lỗi mẫu đọc được. */}
          <table className="w-full min-w-xl table-fixed text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Tác vụ</th>
                <th className="w-28 px-2 py-2 font-medium">Loại</th>
                <th className="w-20 px-2 py-2 text-right font-medium">Số lần</th>
                <th className="w-20 px-2 py-2 text-right font-medium">Kỳ trước</th>
                <th className="w-28 px-4 py-2 text-right font-medium">Gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => {
                const meta = failureMeta(group.failureKind);
                const change = trend(group, comparable);
                const share = failed > 0 ? Math.round((group.count / failed) * 100) : 0;
                return (
                  <tr
                    key={`${group.purpose}|${group.failureKind}`}
                    onClick={() => router.push("/ai-failures")}
                    className="cursor-pointer align-top transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5">
                      <p className="truncate font-medium text-slate-900">{purposeLabel(group.purpose)}</p>
                      <p className="truncate text-xs text-slate-500" title={group.sample ?? undefined}>
                        {group.sample ?? "Không có thông báo lỗi"}
                      </p>
                    </td>
                    <td className="px-2 py-2.5">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </td>
                    <td className="px-2 py-2.5 text-right whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCount(group.count)}
                      </span>
                      <span className="block text-xs text-slate-400">{share}%</span>
                    </td>
                    <td className={cn("px-2 py-2.5 text-right text-xs tabular-nums", change.className)}>
                      {change.text}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap text-slate-500">
                      {relativeTime(group.lastAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
