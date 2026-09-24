import type { WorkStatus } from "@/types";
import { WORK_STATUS } from "@/constants/constants";
import { Badge } from "@/components/ui/badge";

// Trạng thái rút yêu cầu (Pha A) của một tin; null = chưa từng rút.
export function RequirementBadge({ status }: { status: WorkStatus | null | undefined }) {
  if (!status) return <Badge variant="outline">Chưa rút</Badge>;
  const meta = WORK_STATUS[status];
  return (
    <Badge variant={meta.variant} dot={status === "RUNNING" || status === "PENDING"}>
      {meta.label}
    </Badge>
  );
}
