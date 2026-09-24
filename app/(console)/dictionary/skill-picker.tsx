"use client";

import { useState, type ReactNode } from "react";
import { useApiQuery } from "@/hooks/use-api-query";
import { useDebounce } from "@/hooks/use-debounce";
import { SEARCH_DEBOUNCE_MS } from "@/constants/constants";
import { keys } from "@/lib/query-keys";
import { dictionaryService } from "@/services";
import type { CanonicalSkillItem } from "@/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

const RESULTS = 10;

// Chọn một kỹ năng đích rồi xác nhận; `excludeId` loại chính kỹ năng đang xem.
export function SkillPicker({
  title,
  description,
  confirmLabel,
  excludeId,
  onPick,
  onClose,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  excludeId: string;
  onPick: (target: CanonicalSkillItem) => Promise<void>;
  onClose: () => void;
}) {
  const [term, setTerm] = useState("");
  const [chosen, setChosen] = useState<CanonicalSkillItem | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useDebounce(term.trim(), SEARCH_DEBOUNCE_MS);

  const query = { q, limit: RESULTS + 1 };
  const results = useApiQuery(keys.dictionaryList(query), () => dictionaryService.list(query), {
    errorMessage: "Không tìm được kỹ năng",
    enabled: q.length > 0,
    keepPrevious: true,
  });
  const items = (results.data?.items ?? []).filter((item) => item.id !== excludeId).slice(0, RESULTS);

  const confirm = async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      await onPick(chosen);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={() => !busy && onClose()} title={title} className="max-w-lg">
      <div className="space-y-4 text-sm">
        <div className="text-slate-600">{description}</div>
        <SearchInput value={term} onChange={setTerm} placeholder="Gõ tên hoặc cách viết của kỹ năng đích…" />

        {results.error && <Alert tone="danger">{results.error}</Alert>}
        {q.length === 0 ? (
          <p className="text-xs text-slate-400">Gõ để tìm kỹ năng đích.</p>
        ) : !results.data ? (
          <Skeleton className="h-40" />
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-500">Không có kỹ năng nào khớp.</p>
        ) : (
          <ul role="listbox" className="scrollbar-thin max-h-72 space-y-1 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={chosen?.id === item.id}
                  onClick={() => setChosen(item)}
                  className={cn(
                    "w-full cursor-pointer rounded-md border px-3 py-2 text-left transition-colors",
                    chosen?.id === item.id
                      ? "border-primary-300 bg-primary-50"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="font-medium text-slate-900">{item.name}</span>{" "}
                  <span className="font-mono text-2xs text-slate-400">{item._count.aliases} cách viết</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {item.aliases.map((alias) => alias.raw).join(", ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button onClick={() => void confirm()} loading={busy} disabled={!chosen}>
            {chosen ? `${confirmLabel} “${chosen.name}”` : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
