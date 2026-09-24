"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowsClockwise, BookOpenText } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagedFilters } from "@/hooks/use-paged-filters";
import { SEARCH_DEBOUNCE_MS } from "@/constants/constants";
import { apiErrorMessage } from "@/lib/axios";
import { keys } from "@/lib/query-keys";
import { dictionaryService } from "@/services";
import type { AliasSource } from "@/types";
import { PageHeader } from "@/components/shell/page-header";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { MetricStrip } from "@/components/admin/metric-strip";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/toast";
import { formatCount, formatDateTime } from "@/utils";
import { SourceBadge, SOURCE_META } from "./source-badge";

const PAGE_SIZE = 30;

const SOURCE_OPTIONS: Array<{ value: "" | AliasSource; label: string; hint?: string }> = [
  { value: "", label: "Mọi nguồn" },
  ...(Object.keys(SOURCE_META) as AliasSource[]).map((source) => ({
    value: source,
    label: source,
    hint: SOURCE_META[source].hint,
  })),
];

export function DictionaryView() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [source, setSource] = useState<"" | AliasSource>("");
  const q = useDebounce(term.trim(), SEARCH_DEBOUNCE_MS);
  const filters = { q: q || undefined, source: source || undefined };
  const [offset, setOffset] = usePagedFilters(filters);

  const summary = useApiQuery(keys.dictionarySummary(), dictionaryService.summary, {
    errorMessage: "Không tải được số liệu danh bạ",
  });
  const query = { ...filters, limit: PAGE_SIZE, offset };
  const page = useApiQuery(keys.dictionaryList(query), () => dictionaryService.list(query), {
    errorMessage: "Không tải được danh bạ kỹ năng",
    keepPrevious: true,
  });
  const data = page.data;
  const s = summary.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Từ điển kỹ năng"
        subtitle="Sửa tay được đánh dấu MANUAL, máy không ghi đè"
        actions={<RematchButton />}
      />

      {(page.error || summary.error) && <Alert tone="danger">{page.error ?? summary.error}</Alert>}

      {!s ? (
        <Skeleton className="h-20" />
      ) : (
        <MetricStrip
          items={[
            { label: "Kỹ năng chuẩn", value: formatCount(s.skills) },
            {
              label: "EXACT",
              value: formatCount(s.aliases.EXACT ?? 0),
              hint: "trùng chữ; lẫn lô model bỏ cuộc cũ",
            },
            { label: "LLM", value: formatCount(s.aliases.LLM ?? 0), hint: "model quyết" },
            { label: "MANUAL", value: formatCount(s.aliases.MANUAL ?? 0), hint: "người sửa tay" },
          ]}
        />
      )}

      <SectionCard
        title={data ? `${formatCount(data.total)} kỹ năng` : "Kỹ năng"}
        contentClassName="p-0"
        actions={
          <>
            <SearchInput
              value={term}
              onChange={setTerm}
              placeholder="Tìm tên hoặc cách viết…"
              className="w-64"
            />
            <SelectMenu
              value={source}
              options={SOURCE_OPTIONS}
              onChange={setSource}
              label="Nguồn"
              align="right"
            />
          </>
        }
      >
        {!data ? (
          <div className="p-4">
            <Skeleton className="h-96" />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={BookOpenText} title="Không có kỹ năng nào khớp" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Kỹ năng chuẩn</TableHead>
                    <TableHead>Cách viết</TableHead>
                    <TableHead className="text-right">Số cách viết</TableHead>
                    <TableHead>Tạo lúc</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((skill) => (
                    <TableRow
                      key={skill.id}
                      onClick={() => router.push(`/dictionary/${skill.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <Link
                          href={`/dictionary/${skill.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="font-medium text-slate-900 hover:text-primary-600"
                        >
                          {skill.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-lg">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {skill.aliases.map((alias) => (
                            <span key={alias.key} className="inline-flex items-center gap-1 text-xs text-slate-600">
                              {alias.raw}
                              <SourceBadge source={alias.source} />
                            </span>
                          ))}
                          {skill._count.aliases > skill.aliases.length && (
                            <span className="text-2xs text-slate-400">
                              +{skill._count.aliases - skill.aliases.length}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums">
                        {formatCount(skill._count.aliases)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                        {formatDateTime(skill.createdAt)}
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
              noun="kỹ năng"
              disabled={page.loading}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}

function RematchButton() {
  const toast = useToast();
  return (
    <ConfirmAction
      title="Đối chiếu lại toàn kho?"
      description={
        <>
          <p>
            Tính lại độ khớp kỹ năng giữa mọi hồ sơ và mọi tin theo danh bạ hiện tại. Bước này không gọi
            model, nhưng chặng sau nó tự phát suất chấm AI trong hạn mức.
          </p>
          <p>Nên chạy sau khi đã gộp hoặc chuyển xong một đợt kỹ năng, chứ không phải sau mỗi lần sửa.</p>
        </>
      }
      confirmLabel="Xếp hàng"
      onConfirm={async () => {
        try {
          const result = await dictionaryService.rematch();
          toast.success(
            result.queued
              ? "Đã xếp hàng đối chiếu lại. Theo dõi ở trang Hàng đợi, dòng match.requirements."
              : "Đã có một lượt đối chiếu toàn kho đang chờ; không xếp thêm.",
          );
        } catch (err) {
          toast.danger(apiErrorMessage(err, "Không xếp hàng được"));
        }
      }}
    >
      {(open) => (
        <Button size="sm" onClick={open}>
          <ArrowsClockwise className="size-4.5" />
          Đối chiếu lại toàn kho
        </Button>
      )}
    </ConfirmAction>
  );
}
