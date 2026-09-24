"use client";

import { useState, type ReactNode } from "react";
import { apiErrorMessage } from "@/lib/axios";
import { adminService, matchingService } from "@/services";
import { PageHeader } from "@/components/shell/page-header";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Alert, type AlertTone } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { SectionCard } from "@/components/ui/section-card";
import { formatCount } from "@/utils";

interface Outcome {
  tone: AlertTone;
  text: ReactNode;
}

// Chạy một thao tác và giữ lại kết quả hoặc lỗi để hiện ngay dưới dòng thao tác.
function useOutcome() {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const run = async (task: () => Promise<ReactNode>, fallback: string) => {
    setOutcome(null);
    try {
      setOutcome({ tone: "success", text: await task() });
    } catch (err) {
      setOutcome({ tone: "danger", text: apiErrorMessage(err, fallback) });
    }
  };
  return { outcome, run };
}

export function MaintenanceView() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Bảo trì dữ liệu"
        subtitle="Ghi hàng loạt lên kho tin và danh bạ kỹ năng; mỗi nút đều hỏi lại"
      />
      <SectionCard title="Thao tác" contentClassName="p-0 space-y-0 divide-y divide-slate-100">
        <BackfillRow />
        <DictionaryRow />
        <ShortlistRow />
      </SectionCard>
    </div>
  );
}

function ActionRow({
  title,
  consequence,
  outcome,
  children,
}: {
  title: string;
  consequence: ReactNode;
  outcome: Outcome | null;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{consequence}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
      {outcome && (
        <Alert tone={outcome.tone} className="mt-3">
          {outcome.text}
        </Alert>
      )}
    </div>
  );
}

function BackfillRow() {
  const { outcome, run } = useOutcome();

  const backfill = (all: boolean) =>
    run(async () => {
      const result = await adminService.backfillTaxonomy(all);
      return (
        <>
          Đã xử lý <strong className="font-mono">{formatCount(result.processed)}</strong> tin.{" "}
          {formatCount(result.missingProvince)} tin chưa suy ra được tỉnh/thành,{" "}
          {formatCount(result.missingDedupeKey)} tin thiếu khoá gộp trùng (phần lớn là tin ẩn tên
          công ty).
        </>
      );
    }, "Không chạy được backfill");

  return (
    <ActionRow
      title="Tính lại phân loại tin"
      consequence="Suy lại mã tỉnh, mã ngành, văn bản tìm kiếm. Toàn bộ kho ghi đè mọi tin, chạy đồng bộ vài phút."
      outcome={outcome}
    >
      <ConfirmAction
        title="Tính lại tin còn thiếu?"
        description={<p>Chỉ xử lý những tin chưa có văn bản tìm kiếm. An toàn để chạy bất cứ lúc nào.</p>}
        confirmLabel="Chạy"
        onConfirm={() => backfill(false)}
      >
        {(open) => (
          <Button variant="outline" size="sm" onClick={open}>
            Chỉ tin còn thiếu
          </Button>
        )}
      </ConfirmAction>
      <ConfirmAction
        title="Tính lại TOÀN BỘ kho tin?"
        tone="danger"
        description={
          <>
            <p>Ghi đè mã tỉnh, mã ngành và văn bản tìm kiếm của mọi tin theo danh mục hiện tại.</p>
            <p>Chỉ cần khi vừa sửa danh mục tỉnh hoặc ngành. Trang sẽ chờ tới khi máy chủ xử lý xong.</p>
          </>
        }
        confirmLabel="Tính lại toàn bộ"
        onConfirm={() => backfill(true)}
      >
        {(open) => (
          <Button variant="outline" size="sm" onClick={open}>
            Toàn bộ kho
          </Button>
        )}
      </ConfirmAction>
    </ActionRow>
  );
}

function DictionaryRow() {
  const { outcome, run } = useOutcome();

  return (
    <ActionRow
      title="Dựng lại danh bạ kỹ năng"
      consequence="Xếp hàng skill.canonicalize theo lô; tốn hạn mức AI tỉ lệ số kỹ năng trong kho."
      outcome={outcome}
    >
      <ConfirmAction
        title="Dựng lại danh bạ kỹ năng?"
        description={
          <>
            <p>Mỗi lô gọi model một lần, nên lượt này tiêu hạn mức AI tỉ lệ với số kỹ năng trong kho.</p>
            <p>Theo dõi tiến độ ở trang Hàng đợi, dòng skill.canonicalize.</p>
          </>
        }
        confirmLabel="Xếp hàng"
        onConfirm={() =>
          run(async () => {
            const result = await matchingService.rebuildDictionary();
            return result.queueJobId
              ? `Đã xếp hàng (job ${result.queueJobId}). Worker xử lý ở nền.`
              : "Đã có một lượt dựng lại đang chờ; không xếp thêm lượt trùng.";
          }, "Không xếp hàng được")
        }
      >
        {(open) => (
          <Button size="sm" onClick={open}>
            Dựng lại danh bạ
          </Button>
        )}
      </ConfirmAction>
    </ActionRow>
  );
}

function ShortlistRow() {
  const { outcome, run } = useOutcome();
  const [userId, setUserId] = useState("");
  const target = userId.trim();

  return (
    <ActionRow
      title="Phát suất chấm AI"
      consequence="Top-N tin theo điểm luật của mỗi hồ sơ, xếp hàng chấm AI trong hạn mức."
      outcome={outcome}
    >
      <Label htmlFor="shortlist-user" className="sr-only">
        User ID (tuỳ chọn)
      </Label>
      <Input
        id="shortlist-user"
        value={userId}
        onChange={(event) => setUserId(event.target.value)}
        placeholder="User ID, trống = mọi hồ sơ"
        className="h-8 w-56 font-mono placeholder:font-sans"
      />
      <ConfirmAction
        title={target ? "Phát suất cho một hồ sơ?" : "Phát suất cho mọi hồ sơ?"}
        description={
          <p>
            {target ? (
              <>
                Chỉ hồ sơ <span className="font-mono">{target}</span>.
              </>
            ) : (
              "Duyệt mọi hồ sơ."
            )}{" "}
            Mỗi suất là một lời gọi model ở hàng match.evaluate.
          </p>
        }
        confirmLabel="Phát suất"
        onConfirm={() =>
          run(async () => {
            const result = await matchingService.dispatchShortlist(target || undefined);
            if (result.queued + result.served + result.deferred === 0) {
              return "Không có suất nào được phát: không còn tin cần chấm, hoặc máy chủ đang tắt tự phát (MATCH_AI_AUTO=false).";
            }
            // `deferred` đếm cặp hồ sơ–tin chưa tới lượt, không phải số hồ sơ.
            return `Đã xếp hàng ${result.queued} lượt chấm cho ${result.served} hồ sơ; hoãn ${result.deferred} cặp hồ sơ–tin sang lượt sau.`;
          }, "Không phát được suất")
        }
      >
        {(open) => (
          <Button size="sm" onClick={open}>
            Phát suất
          </Button>
        )}
      </ConfirmAction>
    </ActionRow>
  );
}
