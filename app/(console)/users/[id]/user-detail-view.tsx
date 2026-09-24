"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, ShieldSlash } from "@phosphor-icons/react/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/axios";
import { keys } from "@/lib/query-keys";
import { usersService } from "@/services";
import type { UserDetail } from "@/types";
import { useSession } from "@/components/shell/session";
import { PageHeader } from "@/components/shell/page-header";
import { AiCallModal } from "@/components/admin/ai-call-modal";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { MetricStrip } from "@/components/admin/metric-strip";
import { failureMeta, purposeLabel } from "@/constants/constants";
import { Alert, PageError } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyHint } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton, SkeletonPage } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatCount, formatDate, formatDateTime, formatDuration, relativeTime } from "@/utils";
import { RoleBadge } from "../users-view";

export function UserDetailView({ id }: { id: string }) {
  const [openCall, setOpenCall] = useState<string | null>(null);
  const user = useApiQuery(keys.user(id), () => usersService.detail(id), {
    errorMessage: "Không tải được tài khoản",
  });

  if (user.error) return <PageError title="Không mở được tài khoản" message={user.error} />;
  const data = user.data;

  return (
    <div className="space-y-5">
      <Link
        href="/users"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-3.5" />
        Người dùng
      </Link>

      {!data ? (
        <SkeletonPage>
          <Skeleton className="h-14 w-96" />
          <Skeleton className="h-20" />
          <Skeleton className="h-64" />
        </SkeletonPage>
      ) : (
        <>
          <PageHeader
            title={data.name}
            subtitle={`${data.email} · đăng ký ${formatDate(data.createdAt)}`}
            actions={<RoleControl user={data} />}
          />

          <MetricStrip
            items={[
              {
                label: "Token AI",
                value: formatCount(data.usage.inputTokens + data.usage.outputTokens),
                hint: `vào ${formatCount(data.usage.inputTokens)} · ra ${formatCount(data.usage.outputTokens)}`,
              },
              {
                label: "Lời gọi AI",
                value: formatCount(data._count.aiCalls),
                hint: data.usage.lastCallAt
                  ? `gần nhất ${relativeTime(data.usage.lastCallAt)}`
                  : "chưa gọi lần nào",
              },
              {
                label: "Lượt chấm",
                value: formatCount(data._count.matches),
                hint: `${formatCount(data._count.applications)} đơn ứng tuyển`,
              },
              {
                label: "Tài liệu",
                value: formatCount(data._count.documents),
                hint: `${formatCount(data._count.scrapeRuns)} lượt quét tự chạy`,
              },
            ]}
          />

          <SectionCard title="Hồ sơ">
            {!data.profile ? (
              <EmptyHint>Tài khoản chưa có hồ sơ.</EmptyHint>
            ) : (
              <div className="space-y-3 text-sm">
                <p className="text-slate-900">
                  {data.profile.headline ?? <span className="text-slate-400">Chưa có tiêu đề</span>}
                </p>
                <p className="text-xs text-slate-500">
                  Đầy đủ <span className="font-mono text-slate-700">{data.profile.completion}%</span>
                  {data.profile.occupationCode && (
                    <>
                      {" "}· ngành <span className="font-mono">{data.profile.occupationCode}</span>
                    </>
                  )}{" "}
                  · cập nhật {relativeTime(data.profile.updatedAt)}
                </p>
                {data.profile.primarySkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {data.profile.primarySkills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="10 lời gọi AI gần nhất" contentClassName="p-0">
            {data.recentCalls.length === 0 ? (
              <div className="p-4">
                <EmptyHint>Tài khoản chưa gọi model lần nào.</EmptyHint>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Thời điểm</TableHead>
                      <TableHead>Tác vụ</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Kết quả</TableHead>
                      <TableHead className="text-right">Token</TableHead>
                      <TableHead className="text-right">Kéo dài</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentCalls.map((call) => {
                      const meta = failureMeta(call.failureKind);
                      return (
                        <TableRow key={call.id} onClick={() => setOpenCall(call.id)} className="cursor-pointer">
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {formatDateTime(call.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs">{purposeLabel(call.purpose)}</TableCell>
                          <TableCell className="font-mono text-2xs text-slate-500">{call.modelId}</TableCell>
                          <TableCell>
                            {call.ok ? (
                              <Badge variant="success">OK</Badge>
                            ) : (
                              <Badge variant={meta.variant}>{meta.label}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">
                            {call.inputTokens === null
                              ? "—"
                              : formatCount(call.inputTokens + (call.outputTokens ?? 0))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatDuration(call.durationMs)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>

          <p className="text-xs text-slate-400">
            Trang này cố ý không hiện CV, kinh nghiệm hay lương mong muốn của người dùng.
          </p>
        </>
      )}

      <AiCallModal id={openCall} onClose={() => setOpenCall(null)} />
    </div>
  );
}

function RoleControl({ user }: { user: UserDetail }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user: me } = useSession();
  const [error, setError] = useState<string | null>(null);
  const promote = user.role === "USER";
  const isMe = me?.id === user.id;

  const change = async () => {
    setError(null);
    try {
      const next = promote ? "ADMIN" : "USER";
      await usersService.updateRole(user.id, next);
      toast.success(promote ? `Đã nâng ${user.email} lên quản trị viên.` : `Đã hạ ${user.email} về người dùng.`);
      await queryClient.invalidateQueries({ queryKey: ["admin", "user", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err) {
      setError(apiErrorMessage(err, "Không đổi được vai trò"));
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <RoleBadge role={user.role} />
        <ConfirmAction
          title={promote ? "Nâng lên quản trị viên?" : "Hạ về người dùng thường?"}
          tone={promote ? "primary" : "danger"}
          description={
            promote ? (
              <p>
                <span className="font-mono">{user.email}</span> sẽ vào được toàn bộ trang quản trị, kể cả đổi
                vai trò người khác. Có hiệu lực ngay ở request kế tiếp.
              </p>
            ) : (
              <p>
                <span className="font-mono">{user.email}</span> mất quyền quản trị ngay ở request kế tiếp.
              </p>
            )
          }
          confirmLabel={promote ? "Nâng quyền" : "Hạ quyền"}
          onConfirm={change}
        >
          {(open) => (
            <Button
              variant="outline"
              size="sm"
              onClick={open}
              disabled={isMe && !promote}
              title={isMe && !promote ? "Không thể tự hạ quyền chính mình" : undefined}
            >
              {promote ? <ShieldCheck className="size-4.5" /> : <ShieldSlash className="size-4.5" />}
              {promote ? "Nâng quyền" : "Hạ quyền"}
            </Button>
          )}
        </ConfirmAction>
      </div>
      {error && (
        <Alert tone="danger" className="max-w-sm">
          {error}
        </Alert>
      )}
    </div>
  );
}
