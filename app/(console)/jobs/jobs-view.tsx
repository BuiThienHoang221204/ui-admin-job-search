"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagedFilters } from "@/hooks/use-paged-filters";
import { SEARCH_DEBOUNCE_MS } from "@/constants/constants";
import { keys } from "@/lib/query-keys";
import { jobsService } from "@/services";
import type { RequirementFilter } from "@/types";
import { PageHeader } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { SectionCard } from "@/components/ui/section-card";
import { SelectMenu } from "@/components/ui/select-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCount, formatDate } from "@/utils";
import { RequirementBadge } from "./requirement-badge";

const PAGE_SIZE = 25;

const REQUIREMENT_OPTIONS: Array<{ value: "" | RequirementFilter; label: string }> = [
  { value: "", label: "Mọi trạng thái rút" },
  { value: "NONE", label: "Chưa rút yêu cầu" },
  { value: "DONE", label: "Đã rút xong" },
  { value: "FAILED", label: "Rút hỏng" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "RUNNING", label: "Đang rút" },
];

export function JobsView() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [source, setSource] = useState("");
  const [requirement, setRequirement] = useState<"" | RequirementFilter>("");
  const [canonicalOnly, setCanonicalOnly] = useState(false);
  const q = useDebounce(term.trim(), SEARCH_DEBOUNCE_MS);

  const sources = useApiQuery(keys.jobSources(), () => jobsService.sources({ limit: 100 }), {
    errorMessage: "Không tải được danh sách nguồn",
    staleTime: 5 * 60_000,
  });

  const filters = {
    q: q || undefined,
    source: source || undefined,
    requirement: requirement || undefined,
    canonicalOnly: canonicalOnly || undefined,
  };
  // Bộ lọc đổi thì tự về trang đầu, tránh đứng ở trang 9 của một tập chỉ còn 2 trang.
  const [offset, setOffset] = usePagedFilters(filters);
  const query = { ...filters, limit: PAGE_SIZE, offset };
  const page = useApiQuery(keys.jobs(query), () => jobsService.list(query), {
    errorMessage: "Không tải được danh sách tin",
    keepPrevious: true,
  });
  const data = page.data;

  const sourceOptions = [
    { value: "", label: "Mọi nguồn" },
    ...(sources.data?.items ?? []).map((row) => ({
      value: row.source,
      label: row.source,
      hint: `${formatCount(row.count)} tin`,
    })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Tin tuyển dụng" subtitle="Toàn bộ kho tin đã quét về" />

      {page.error && <Alert tone="danger">{page.error}</Alert>}

      <SectionCard
        title={data ? `${formatCount(data.total)} tin` : "Tin"}
        contentClassName="p-0"
        actions={
          <>
            <SearchInput
              value={term}
              onChange={setTerm}
              placeholder="Chức danh, công ty…"
              className="w-64"
            />
            <SelectMenu value={source} options={sourceOptions} onChange={setSource} label="Nguồn" />
            <SelectMenu
              value={requirement}
              options={REQUIREMENT_OPTIONS}
              onChange={setRequirement}
              label="Rút yêu cầu"
              align="right"
            />
            <button
              type="button"
              role="switch"
              aria-checked={canonicalOnly}
              onClick={() => setCanonicalOnly(!canonicalOnly)}
              className={cn(
                "inline-flex h-10 cursor-pointer items-center rounded-lg border px-3 text-xs font-medium transition-colors",
                canonicalOnly
                  ? "border-primary-200 bg-primary-50 text-primary-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              Bỏ tin trùng
            </button>
          </>
        }
      >
        {!data ? (
          <div className="p-4">
            <Skeleton className="h-96" />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Không có tin nào khớp"
            description="Thử bỏ bớt bộ lọc."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Tin</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Rút yêu cầu</TableHead>
                    <TableHead>Phân loại</TableHead>
                    <TableHead className="text-right">Lượt chấm</TableHead>
                    <TableHead>Quét về</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((job) => (
                    <TableRow
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell className="max-w-md">
                        <Link
                          href={`/jobs/${job.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="line-clamp-1 font-medium text-slate-900 hover:text-primary-600"
                        >
                          {job.title}
                        </Link>
                        <p className="truncate text-xs text-slate-500">
                          {job.company}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                        {(job.duplicateOfId || job._count.duplicates > 0) && (
                          <p className="mt-0.5 text-2xs text-slate-400">
                            {job.duplicateOfId
                              ? "Trùng với một tin khác"
                              : `Tin gốc của ${job._count.duplicates} tin trùng`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {job.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RequirementBadge status={job.requirements?.status} />
                      </TableCell>
                      <TableCell className="font-mono text-2xs text-slate-500">
                        {job.provinceCode ?? "—"} · {job.occupationCode ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {formatCount(job._count.matches)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                        {formatDate(job.scrapedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination
              offset={data.offset}
              limit={data.limit}
              total={data.total}
              onOffsetChange={setOffset}
              noun="tin"
              disabled={page.loading}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
