"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCircle } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { useDebounce } from "@/hooks/use-debounce";
import { usePagedFilters } from "@/hooks/use-paged-filters";
import { SEARCH_DEBOUNCE_MS } from "@/constants/constants";
import { keys } from "@/lib/query-keys";
import { usersService } from "@/services";
import type { Role } from "@/types";
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
import { formatCount, formatDate } from "@/utils";

const PAGE_SIZE = 25;

const ROLE_OPTIONS: Array<{ value: "" | Role; label: string }> = [
  { value: "", label: "Mọi vai trò" },
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "USER", label: "Người dùng" },
];

export function RoleBadge({ role }: { role: Role }) {
  return role === "ADMIN" ? (
    <Badge variant="warning">Quản trị viên</Badge>
  ) : (
    <Badge variant="neutral">Người dùng</Badge>
  );
}

export function UsersView() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [role, setRole] = useState<"" | Role>("");
  const q = useDebounce(term.trim(), SEARCH_DEBOUNCE_MS);
  const filters = { q: q || undefined, role: role || undefined };
  const [offset, setOffset] = usePagedFilters(filters);

  const query = { ...filters, limit: PAGE_SIZE, offset };
  const page = useApiQuery(keys.users(query), () => usersService.list(query), {
    errorMessage: "Không tải được danh sách người dùng",
    keepPrevious: true,
  });
  const data = page.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Người dùng"
        subtitle="Mọi tài khoản trong hệ thống"
      />

      {page.error && <Alert tone="danger">{page.error}</Alert>}

      <SectionCard
        title={data ? `${formatCount(data.total)} tài khoản` : "Tài khoản"}
        contentClassName="p-0"
        actions={
          <>
            <SearchInput
              value={term}
              onChange={setTerm}
              placeholder="Tìm email hoặc tên…"
              className="w-64"
            />
            <SelectMenu
              value={role}
              options={ROLE_OPTIONS}
              onChange={setRole}
              label="Vai trò"
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
          <EmptyState
            icon={UserCircle}
            title="Không có tài khoản nào khớp"
            description="Thử bỏ bớt bộ lọc."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Hồ sơ</TableHead>
                    <TableHead className="text-right">Lượt chấm</TableHead>
                    <TableHead className="text-right">Tài liệu</TableHead>
                    <TableHead className="text-right">Ứng tuyển</TableHead>
                    <TableHead className="text-right">Gọi AI</TableHead>
                    <TableHead>Đăng ký</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((user) => (
                    <TableRow
                      key={user.id}
                      onClick={() => router.push(`/users/${user.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <Link
                          href={`/users/${user.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="font-medium text-slate-900 hover:text-primary-600"
                        >
                          {user.name}
                        </Link>
                        <p className="font-mono text-2xs text-slate-400">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="max-w-56">
                        {user.profile?.headline ? (
                          <p className="truncate text-xs text-slate-600">{user.profile.headline}</p>
                        ) : (
                          <span className="text-xs text-slate-400">Chưa có</span>
                        )}
                        {user.profile && (
                          <p className="text-2xs text-slate-400">
                            đầy đủ <span className="font-mono">{user.profile.completion}%</span>
                          </p>
                        )}
                      </TableCell>
                      <Num value={user._count.matches} />
                      <Num value={user._count.documents} />
                      <Num value={user._count.applications} />
                      <Num value={user._count.aiCalls} />
                      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                        {formatDate(user.createdAt)}
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
              noun="tài khoản"
              disabled={page.loading}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}

function Num({ value }: { value: number }) {
  return (
    <TableCell
      className={`text-right font-mono text-xs tabular-nums ${value ? "text-slate-900" : "text-slate-300"}`}
    >
      {formatCount(value)}
    </TableCell>
  );
}
