"use client";

import Link from "next/link";
import { LockSimple } from "@phosphor-icons/react/ssr";
import { useApiQuery } from "@/hooks/use-api-query";
import { keys } from "@/lib/query-keys";
import { adminService } from "@/services";
import { failureMeta, purposeLabel } from "@/constants/constants";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDateTime,
  formatDuration,
  tokenBreakdown,
} from "@/utils";
import { tokens } from "@/utils/tokens";

// Nạp chi tiết theo id khi mở, để danh sách không phải kéo phản hồi thô của mọi dòng.
export function AiCallModal({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  if (!id) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title="Chi tiết lời gọi AI"
      className="max-w-2xl"
    >
      <AiCallBody id={id} />
    </Modal>
  );
}

function AiCallBody({ id }: { id: string }) {
  const call = useApiQuery(keys.aiCall(id), () => adminService.aiCall(id), {
    errorMessage: "Không tải được lời gọi AI",
  });

  if (call.error) return <Alert tone="danger">{call.error}</Alert>;
  const data = call.data;
  if (!data) return <Skeleton className="h-72" />;

  const meta = failureMeta(data.failureKind);

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
        <dt className="text-slate-500">Thời điểm</dt>
        <dd className="font-mono text-xs text-slate-900">
          {formatDateTime(data.createdAt)}
        </dd>
        <dt className="text-slate-500">Tác vụ</dt>
        <dd className="text-slate-900">
          {purposeLabel(data.purpose)}{" "}
          <span className="font-mono text-2xs text-slate-400">
            {data.purpose}
          </span>
        </dd>
        <dt className="text-slate-500">Model</dt>
        <dd className="font-mono text-xs break-all text-slate-900">
          {data.provider} · {data.modelId}
        </dd>
        <dt className="text-slate-500">Kết quả</dt>
        <dd>
          {data.ok ? (
            <Badge variant="success">Thành công</Badge>
          ) : (
            <>
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <p className="mt-1 text-xs text-slate-500">{meta.action}</p>
            </>
          )}
        </dd>
        <dt className="text-slate-500">Kéo dài</dt>
        <dd className="font-mono text-xs text-slate-900">
          {formatDuration(data.durationMs)}
        </dd>
        <dt className="text-slate-500">Token</dt>
        <dd className="font-mono text-xs text-slate-900">
          <TokenLine {...data} />
        </dd>
        {data.finishReason && (
          <>
            <dt className="text-slate-500">Lý do dừng</dt>
            <dd className="font-mono text-xs text-slate-900">
              {data.finishReason}
            </dd>
          </>
        )}
        <dt className="text-slate-500">Người dùng</dt>
        <dd className="text-xs">
          {data.user ? (
            <Link
              href={`/users/${data.user.id}`}
              className="text-primary-600 hover:underline"
            >
              {data.user.email}
            </Link>
          ) : (
            <span className="text-slate-400">Hệ thống</span>
          )}
        </dd>
      </dl>

      {data.errorMessage && (
        <Block title="Thông báo lỗi">{data.errorMessage}</Block>
      )}

      {data.responseRedacted ? (
        <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <LockSimple className="mt-px size-4 shrink-0" />
          Phản hồi thô đã bị che vì lời gọi này gắn với một người dùng: đầu ra
          của model tả lại hồ sơ, kinh nghiệm hoặc CV của họ. Chỉ lời gọi không
          thuộc về ai (chuẩn hoá kỹ năng, rút yêu cầu từ JD…) mới hiện phản hồi
          thô.
        </p>
      ) : (
        data.responseText && (
          <Block title="Phản hồi thô của model">{data.responseText}</Block>
        )
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-600">{title}</p>
      <pre className="scrollbar-thin max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs whitespace-pre-wrap wrap-break-word text-slate-800">
        {children}
      </pre>
    </div>
  );
}

function TokenLine({
  inputTokens,
  outputTokens,
  cachedTokens,
}: {
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
}) {
  const t = tokenBreakdown(inputTokens, outputTokens, cachedTokens);

  if (t.cached === 0) {
    return (
      <span title="Lượt gọi này không đọc được gì từ cache">
        vào {tokens(t.total)} · ra {tokens(t.output)}
      </span>
    );
  }

  return (
    <span
      title={`Tổng prompt ${tokens(t.total)} token, trong đó ${tokens(t.cached)} đọc lại từ cache`}
    >
      mới {tokens(t.fresh)} ·{" "}
      <span className="text-teal-700">cache {tokens(t.cached)}</span>
      {t.cacheRatio !== null && (
        <span className="text-slate-500"> ({t.cacheRatio}%)</span>
      )}{" "}
      · ra {tokens(t.output)}
    </span>
  );
}
