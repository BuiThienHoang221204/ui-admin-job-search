"use client";

import { Fragment, useState } from "react";
import { ArrowsClockwise, CaretDown, Files } from "@phosphor-icons/react/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/axios";
import { keys } from "@/lib/query-keys";
import { skillsService } from "@/services";
import { PageHeader } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type { SkillManifest } from "@/types";
import { cn, formatBytes } from "@/utils";

export function SkillsView() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [reloading, setReloading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const skills = useApiQuery(keys.skills(), skillsService.list, {
    errorMessage: "Không tải được danh sách skill",
  });

  const reload = async () => {
    setReloading(true);
    try {
      const fresh = await skillsService.reload();
      queryClient.setQueryData(keys.skills(), fresh);
      toast.success(`Đã nạp lại ${fresh.length} skill từ SKILL.md.`);
    } catch (err) {
      toast.danger(apiErrorMessage(err, "Không nạp lại được skill"));
    } finally {
      setReloading(false);
    }
  };

  const data = skills.data;
  const fileCount =
    data?.reduce((sum, skill) => sum + skill.references.length + 1, 0) ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prompt skills"
        subtitle="Đọc từ SKILL.md; sửa xong bấm Nạp lại, không cần khởi động lại máy chủ"
        actions={
          <Button size="sm" onClick={() => void reload()} loading={reloading}>
            <ArrowsClockwise className="size-4.5" />
            Nạp lại từ đĩa
          </Button>
        }
      />

      {skills.error && <Alert tone="danger">{skills.error}</Alert>}

      <SectionCard
        title="Skill đang nạp"
        description={
          data
            ? `${data.length} skill · ${fileCount} file · lời gọi đang chạy dở vẫn dùng bản cũ`
            : undefined
        }
        contentClassName="p-0"
      >
        {!data ? (
          <div className="p-4">
            <Skeleton className="h-64" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title="Không có skill nào"
            description="Máy chủ không đọc được SKILL.md nào; kiểm tra thư mục skill rồi nạp lại."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Tên</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Tool cho phép</TableHead>
                  <TableHead>Phiên bản khung</TableHead>
                  <TableHead>Tài liệu kèm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((skill) => {
                  const open = expanded === skill.name;
                  return (
                    <Fragment key={skill.name}>
                      <TableRow
                        className={cn(open && "border-b-0 bg-slate-50/60")}
                      >
                        <TableCell className="font-mono text-xs font-semibold whitespace-nowrap text-slate-900">
                          {skill.name}
                        </TableCell>
                        <TableCell className="max-w-xl text-xs leading-relaxed text-slate-600">
                          {skill.description}
                        </TableCell>
                        <TableCell>
                          {skill.allowedTools.length ? (
                            <div className="flex flex-wrap gap-1">
                              {skill.allowedTools.map((tool) => (
                                <Badge
                                  key={tool}
                                  variant="outline"
                                  className="font-mono"
                                >
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {skill.frameworkVersion ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded(open ? null : skill.name)
                            }
                            aria-expanded={open}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                              open
                                ? "border-primary-200 bg-primary-50 text-primary-700"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50",
                            )}
                          >
                            <Files className="size-3.5" />
                            {skill.references.length + 1} file ·{" "}
                            {formatBytes(totalBytes(skill))}
                            <CaretDown
                              className={cn(
                                "size-3.5 transition-transform",
                                open && "rotate-180",
                              )}
                            />
                          </button>
                        </TableCell>
                      </TableRow>
                      {open && (
                        <TableRow className="bg-slate-50/60 hover:bg-slate-50/60">
                          <TableCell colSpan={5} className="pt-0 pb-4">
                            <SkillFiles skill={skill} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

const totalBytes = (skill: SkillManifest) =>
  skill.references.reduce((sum, file) => sum + file.bytes, skill.bodyBytes);

// Cột hẹp cố định để tên file và dung lượng nằm sát nhau, không bị đẩy ra hai mép bảng.
function SkillFiles({ skill }: { skill: SkillManifest }) {
  const files = [
    { name: "SKILL.md", bytes: skill.bodyBytes },
    ...skill.references,
  ];
  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-100 px-3 py-2 text-xs">
        <span className="font-medium text-slate-700">
          {files.length} file · {formatBytes(totalBytes(skill))}
        </span>
        <span
          className="font-mono text-slate-400"
          title="Mã băm gộp SKILL.md và mọi file kèm; đổi sau khi Nạp lại nghĩa là máy chủ đã nhận bản mới"
        >
          #{skill.contentHash}
        </span>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,17rem))] gap-x-8 px-3 py-1.5 text-xs">
        {files.map((file, index) => (
          <li
            key={file.name}
            className="flex items-baseline justify-between gap-3 py-1"
          >
            <span
              className="truncate font-mono text-slate-700"
              title={file.name}
            >
              {file.name}
              {index === 0 && (
                <span className="ml-1.5 font-sans text-slate-400">chính</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {formatBytes(file.bytes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
