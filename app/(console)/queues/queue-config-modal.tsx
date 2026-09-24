"use client";

import { useState } from "react";
import { apiErrorMessage } from "@/lib/axios";
import { adminService } from "@/services";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { QueueRow } from "./queues-view";

// Trần của UpdateQueueConfigDto ở backend.
const MIN = 1;
const MAX = 50;

export function QueueConfigModal({
  row,
  onClose,
  onSaved,
}: {
  row: QueueRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [concurrency, setConcurrency] = useState(String(row.concurrency));
  const [serial, setSerial] = useState(row.serial);
  const [note, setNote] = useState(row.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = Number(concurrency);
  const valid = Number.isInteger(value) && value >= MIN && value <= MAX;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await adminService.updateQueueConfig(row.name, {
        concurrency: value,
        serial,
        note: note.trim() || null,
      });
      toast.success(`Đã lưu cấu hình ${row.name}. Worker nhận giá trị mới trong vòng 30 giây.`);
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, "Không lưu được cấu hình"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={() => !saving && onClose()} title={`Cấu hình ${row.name}`}>
      <form onSubmit={(event) => void save(event)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="concurrency">Số việc chạy song song</Label>
          <Input
            id="concurrency"
            type="number"
            inputMode="numeric"
            min={MIN}
            max={MAX}
            step={1}
            value={concurrency}
            onChange={(event) => setConcurrency(event.target.value)}
            className="font-mono"
          />
          <p className={valid ? "text-xs text-slate-500" : "text-xs text-rose-600"}>
            Số nguyên {MIN}–{MAX}. Với hàng gọi model, mỗi việc giữ một kết nối tới gateway.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 px-3 py-2.5">
          <input
            type="checkbox"
            checked={serial}
            onChange={(event) => setSerial(event.target.checked)}
            className="mt-0.5 size-4 accent-primary-600"
          />
          <span>
            <span className="block text-sm font-medium text-slate-900">Chạy tuần tự (serial)</span>
            <span className="block text-xs text-slate-500">
              Mỗi lúc một việc, bất kể concurrency. Dành cho hàng tự xếp lô kế tiếp.
            </span>
          </span>
        </label>

        <div className="space-y-1.5">
          <Label htmlFor="note">Ghi chú</Label>
          <Textarea
            id="note"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Lý do đổi, để người sau biết"
          />
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" loading={saving} disabled={!valid}>
            Lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
