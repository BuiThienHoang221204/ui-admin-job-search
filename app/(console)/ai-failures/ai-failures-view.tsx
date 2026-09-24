"use client";

import { useState } from "react";
import { ArrowsClockwise, CheckCircle } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { usePagedFilters } from "@/hooks/use-paged-filters";
import { keys } from "@/lib/query-keys";
import { adminService } from "@/services";
import type { AiFailureKind } from "@/types";
import { AiCallModal } from "@/components/admin/ai-call-modal";
import { PageHeader } from "@/components/shell/page-header";
import { DateRangeFilter, initialRange, type RangeState } from "@/components/admin/date-range-filter";
import { FAILURE_KINDS, failureMeta, purposeLabel } from "@/constants/constants";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
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
import { formatCount, formatDateTime, formatDuration } from "@/utils";

const PAGE_SIZE = 25;

const KIND_OPTIONS: Array<{ value: "" | AiFailureKind; label: string; hint?: string }> = [
  { value: "", label: "Mọi loại lỗi" },
  ...FAILURE_KINDS.map((kind) => ({ value: kind.kind, label: kind.label, hint: kind.meaning })),
];

export function AiFailuresView() {
  const [selected, setSelected] = useState<string | null>(null);
  const [range, setRange] = useState<RangeState>(() => initialRange("24h"));
  const [kind, setKind] = useState<"" | AiFailureKind>("");
  const [purpose, setPurpose] = useState("");
  const [model, setModel] = useState("");

  const filters = {
    ...range.range,
    failureKind: kind || undefined,
    purpose: purpose || undefined,
    model: model || undefined,
  };
  // Bộ lọc đổi thì tự về trang đầu.
  const [offset, setOffset] = usePagedFilters(filters);
  const query = { ...filters, limit: PAGE_SIZE, offset };

  const page = useApiQuery(keys.aiFailures(query), () => adminService.aiFailures(query), {
    errorMessage: "Không tải được nhật ký lỗi",
    keepPrevious: true,
  });
  const facets = useApiQuery(
    keys.aiFailureFacets(range.range),
    () => adminService.aiFailureFacets(range.range),
    { errorMessage: "Không tải được danh sách tác vụ và model", keepPrevious: true },
  );

  const data = page.data;
  const filtered = Boolean(kind || purpose || model);
  const clear = () => {
    setKind("");
    setPurpose("");
    setModel("");
  };

  const purposeOptions = [
    { value: "", label: "Mọi tác vụ" },
    ...(facets.data?.purposes ?? []).map((row) => ({
      value: row.purpose,
      label: purposeLabel(row.purpose),
      hint: `${row.purpose} · ${formatCount(row.count)} lần`,
    })),
  ];
  // Cùng model có thể đi qua nhiều provider; gộp theo tên model vì server lọc theo chuỗi con.
  const modelCounts = new Map<string, number>();
  for (const row of facets.data?.models ?? []) {
    modelCounts.set(row.modelId, (modelCounts.get(row.modelId) ?? 0) + row.count);
  }
  const modelOptions = [
    { value: "", label: "Mọi model" },
    ...[...modelCounts].map(([modelId, count]) => ({
      value: modelId,
      label: modelId,
      hint: `${formatCount(count)} lần`,
    })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nhật ký lỗi AI"
        subtitle="Lời gọi model không cho ra kết quả dùng được, mới nhất trước"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={page.reload}
            loading={data !== null && page.loading}
          >
            <ArrowsClockwise className="size-4.5" />
            Tải lại
          </Button>
        }
      />

      <DateRangeFilter value={range} onChange={setRange} />

      {(page.error || facets.error) && <Alert tone="danger">{page.error ?? facets.error}</Alert>}

      <SectionCard
        title="Lời gọi hỏng"
        description={data ? `${formatCount(data.total)} lần hỏng` : undefined}
        contentClassName="p-0"
        actions={
          <>
            <SelectMenu value={kind} options={KIND_OPTIONS} onChange={setKind} label="Loại lỗi" />
            <SelectMenu
              value={purpose}
              options={purposeOptions}
              onChange={setPurpose}
              label="Tác vụ"
              searchPlaceholder="Tìm tác vụ…"
            />
            <SelectMenu
              value={model}
              options={modelOptions}
              onChange={setModel}
              label="Model"
              searchPlaceholder="Tìm model…"
              align="right"
            />
            {filtered && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Xoá lọc
              </Button>
            )}
          </>
        }
      >
        {!data ? (
          <div className="p-4">
            <Skeleton className="h-72" />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title={filtered ? "Không có lần hỏng nào khớp bộ lọc" : "Không có lần hỏng nào trong khoảng này"}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời điểm</TableHead>
                    <TableHead>Tác vụ</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead className="text-right">Kéo dài</TableHead>
                    <TableHead>Thông báo lỗi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((record) => {
                    const meta = failureMeta(record.failureKind);
                    return (
                      <TableRow
                        key={record.id}
                        onClick={() => setSelected(record.id)}
                        className="cursor-pointer"
                      >
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {formatDateTime(record.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs">{purposeLabel(record.purpose)}</TableCell>
                        <TableCell className="font-mono text-2xs text-slate-500">
                          {record.provider} · {record.modelId}
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatDuration(record.durationMs)}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-xs text-slate-500">
                          {record.errorMessage ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Pagination
              offset={data.offset}
              limit={data.limit}
              total={data.total}
              onOffsetChange={setOffset}
              noun="lần hỏng"
              disabled={page.loading}
            />
          </>
        )}
      </SectionCard>

      <AiCallModal id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
