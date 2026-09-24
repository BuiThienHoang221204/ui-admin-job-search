"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface ConfirmActionProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  onConfirm: () => Promise<void> | void;
  children: (open: () => void) => ReactNode;
}

// Hộp xác nhận cho thao tác ghi hàng loạt; nút trigger do nơi gọi tự vẽ.
export function ConfirmAction({
  title,
  description,
  confirmLabel,
  tone = "primary",
  onConfirm,
  children,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {children(() => setOpen(true))}
      <Modal open={open} onClose={() => !busy && setOpen(false)} title={title}>
        <div className="space-y-5 text-sm text-slate-600">
          <div className="space-y-2 leading-relaxed">{description}</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Huỷ
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              onClick={() => void confirm()}
              loading={busy}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
