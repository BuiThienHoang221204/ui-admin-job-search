import type { AliasSource } from "@/types";
import { Badge } from "@/components/ui/badge";

export const SOURCE_META: Record<
  AliasSource,
  { label: string; hint: string; variant: "neutral" | "info" | "success" }
> = {
  EXACT: { label: "EXACT", hint: "Trùng chữ sau khi bỏ dấu, không gọi model", variant: "neutral" },
  LLM: { label: "LLM", hint: "Model chọn trong danh sách do embedding đề cử", variant: "info" },
  MANUAL: { label: "MANUAL", hint: "Người sửa tay, máy không bao giờ ghi đè", variant: "success" },
};

export function SourceBadge({ source }: { source: AliasSource }) {
  const meta = SOURCE_META[source];
  return (
    <Badge variant={meta.variant} title={meta.hint}>
      {meta.label}
    </Badge>
  );
}
