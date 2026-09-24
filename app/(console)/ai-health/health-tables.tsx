import type { AiHealth } from "@/types";
import { purposeLabel } from "@/constants/constants";
import { FailureChips } from "@/components/admin/failure-kinds";
import { SuccessRateCell } from "@/components/admin/success-rate-cell";
import { SectionCard } from "@/components/ui/section-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount, formatDuration } from "@/utils";

// Dòng tệ nhất lên đầu: đó là chỗ cần sửa trước.
const byWorstRate = <T extends { successRate: number; total: number }>(rows: T[]) =>
  [...rows].sort((a, b) => a.successRate - b.successRate || b.total - a.total);

export function PurposeTable({ rows }: { rows: AiHealth["byPurpose"] }) {
  return (
    <SectionCard
      title="Theo tác vụ"
      description={`${rows.length} tác vụ · tệ nhất trước`}
      contentClassName="p-0"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tác vụ</TableHead>
              <TableHead className="text-right">Lời gọi</TableHead>
              <TableHead>Tỷ lệ thành công</TableHead>
              <TableHead className="text-right">p50</TableHead>
              <TableHead className="text-right">p95</TableHead>
              <TableHead>Nguyên nhân hỏng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byWorstRate(rows).map((row) => (
              <TableRow key={row.purpose}>
                <TableCell>
                  <p className="font-medium text-slate-900">{purposeLabel(row.purpose)}</p>
                  <p className="font-mono text-2xs text-slate-400">{row.purpose}</p>
                </TableCell>
                <TableCell className="text-right font-mono">{formatCount(row.total)}</TableCell>
                <TableCell className="min-w-36">
                  <SuccessRateCell rate={row.successRate} />
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatDuration(row.p50Ms)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatDuration(row.p95Ms)}
                </TableCell>
                <TableCell>
                  <FailureChips failures={row.failures} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}

export function ModelTable({ rows }: { rows: AiHealth["byModel"] }) {
  return (
    <SectionCard
      title="Theo model"
      description={`${rows.length} model · chỉ có p50`}
      contentClassName="p-0"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Lời gọi</TableHead>
              <TableHead>Tỷ lệ thành công</TableHead>
              <TableHead className="text-right">p50</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byWorstRate(rows).map((row) => (
              <TableRow key={row.modelId}>
                <TableCell className="font-mono text-xs text-slate-900">{row.modelId}</TableCell>
                <TableCell className="text-right font-mono">{formatCount(row.total)}</TableCell>
                <TableCell className="min-w-36">
                  <SuccessRateCell rate={row.successRate} />
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatDuration(row.p50Ms)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
