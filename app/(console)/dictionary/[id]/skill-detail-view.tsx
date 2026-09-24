"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBendUpRight, ArrowLeft, ArrowsMerge } from "@phosphor-icons/react/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/axios";
import { keys } from "@/lib/query-keys";
import { dictionaryService } from "@/services";
import type { CanonicalSkillDetail, SkillNeighbor } from "@/types";
import { PageHeader } from "@/components/shell/page-header";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyHint } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
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
import { cn, formatDateTime } from "@/utils";
import { SkillPicker } from "../skill-picker";
import { SourceBadge } from "../source-badge";

// Đo trên dữ liệu thật: React ~ Angular đạt 0,89, nên chỉ tô đậm khi gần như trùng hẳn.
const STRONG_SIMILARITY = 0.95;

type Picker = { kind: "move"; key: string; raw: string } | { kind: "merge" } | null;

export function SkillDetailView({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [picker, setPicker] = useState<Picker>(null);

  const skill = useApiQuery(keys.dictionarySkill(id), () => dictionaryService.detail(id), {
    errorMessage: "Không tải được kỹ năng",
  });

  // Mọi thao tác đều có thể xoá hoặc đổi kỹ năng khác, nên làm cũ cả nhánh danh bạ.
  const refresh = () => queryClient.invalidateQueries({ queryKey: [...keys.dictionary()] });

  if (skill.error) return <PageError title="Không mở được kỹ năng" message={skill.error} />;
  const data = skill.data;

  const moveAlias = async (key: string, targetId: string, targetName: string) => {
    try {
      const result = await dictionaryService.moveAlias(key, targetId);
      toast.success(`Đã chuyển sang “${targetName}”.`);
      setPicker(null);
      await refresh();
      if (result.removedEmptySkill) router.replace(`/dictionary/${targetId}`);
    } catch (err) {
      toast.danger(apiErrorMessage(err, "Không chuyển được cách viết"));
    }
  };

  const mergeInto = async (sourceId: string, targetId: string, targetName: string) => {
    try {
      const result = await dictionaryService.merge(sourceId, targetId);
      toast.success(`Đã gộp ${result.movedAliases} cách viết vào “${targetName}”.`);
      setPicker(null);
      await refresh();
      if (sourceId === id) router.replace(`/dictionary/${targetId}`);
    } catch (err) {
      toast.danger(apiErrorMessage(err, "Không gộp được kỹ năng"));
    }
  };

  return (
    <div className="space-y-5">
      <Link
        href="/dictionary"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-3.5" />
        Từ điển kỹ năng
      </Link>

      {!data ? (
        <SkeletonPage>
          <Skeleton className="h-14 w-80" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </SkeletonPage>
      ) : (
        <>
          <PageHeader
            title={data.name}
            subtitle={`${data.aliases.length} cách viết · tạo ${formatDateTime(data.createdAt)} · embedding ${data.model}`}
            actions={
              <Button variant="outline" size="sm" onClick={() => setPicker({ kind: "merge" })}>
                <ArrowsMerge className="size-4.5" />
                Gộp vào kỹ năng khác
              </Button>
            }
          />

          {/* `key` để ô nhập dựng lại khi chuyển sang kỹ năng láng giềng, không giữ tên của kỹ năng cũ. */}
          <RenameCard key={data.id} skill={data} onDone={refresh} />

          <div className="grid items-start gap-5 xl:grid-cols-5 *:min-w-0">
            <SectionCard title="Cách viết" className="xl:col-span-3" contentClassName="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nguyên văn</TableHead>
                    <TableHead>Khoá</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Thêm lúc</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.aliases.map((alias) => (
                    <TableRow key={alias.key}>
                      <TableCell className="text-sm text-slate-900">{alias.raw}</TableCell>
                      <TableCell className="font-mono text-2xs text-slate-500">{alias.key}</TableCell>
                      <TableCell>
                        <SourceBadge source={alias.source} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-2xs text-slate-500">
                        {formatDateTime(alias.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPicker({ kind: "move", key: alias.key, raw: alias.raw })}
                          aria-label={`Chuyển ${alias.raw} sang kỹ năng khác`}
                          title="Chuyển sang kỹ năng khác"
                        >
                          <ArrowBendUpRight className="size-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>

            <SectionCard title="Gần nghĩa nhất" description="theo embedding" className="xl:col-span-2">
              {data.neighbors.length === 0 ? (
                <EmptyHint>Không có kỹ năng nào cùng model embedding.</EmptyHint>
              ) : (
                <>
                  <ul className="divide-y divide-slate-100">
                    {data.neighbors.map((neighbor) => (
                      <NeighborRow
                        key={neighbor.id}
                        neighbor={neighbor}
                        current={data}
                        onMerge={() => mergeInto(neighbor.id, data.id, data.name)}
                      />
                    ))}
                  </ul>
                  <p className="text-xs text-slate-400">
                    Giống ≥85% chưa chắc cùng kỹ năng (React–Angular 89%); chỉ gộp khi thật sự là một.
                  </p>
                </>
              )}
            </SectionCard>
          </div>
        </>
      )}

      {data && picker?.kind === "move" && (
        <SkillPicker
          title={`Chuyển “${picker.raw}”`}
          description={
            <p>
              Cách viết này sẽ thuộc kỹ năng bạn chọn và được đánh dấu MANUAL. Có hiệu lực với lượt đối chiếu kế
              tiếp (máy đọc danh bạ qua cache 60 giây). Nếu là cách viết cuối, kỹ năng hiện tại bị xoá.
            </p>
          }
          confirmLabel="Chuyển sang"
          excludeId={data.id}
          onPick={(target) => moveAlias(picker.key, target.id, target.name)}
          onClose={() => setPicker(null)}
        />
      )}
      {data && picker?.kind === "merge" && (
        <SkillPicker
          title={`Gộp “${data.name}” vào kỹ năng khác`}
          description={
            <p>
              Toàn bộ {data.aliases.length} cách viết chuyển sang kỹ năng bạn chọn (đánh dấu MANUAL), rồi “
              {data.name}” bị xoá. Không hoàn tác được.
            </p>
          }
          confirmLabel="Gộp vào"
          excludeId={data.id}
          onPick={(target) => mergeInto(data.id, target.id, target.name)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function NeighborRow({
  neighbor,
  current,
  onMerge,
}: {
  neighbor: SkillNeighbor;
  current: CanonicalSkillDetail;
  onMerge: () => Promise<void>;
}) {
  const percent = Math.round(neighbor.similarity * 100);
  const strong = neighbor.similarity >= STRONG_SIMILARITY;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <Link
          href={`/dictionary/${neighbor.id}`}
          className="block truncate text-sm font-medium text-slate-900 hover:text-primary-600"
        >
          {neighbor.name}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <Progress
            value={percent}
            className="w-24"
            barClassName={strong ? "bg-primary-600" : "bg-slate-300"}
          />
          <span className={cn("font-mono text-2xs", strong ? "font-bold text-primary-600" : "text-slate-400")}>
            {percent}%
          </span>
          <span className="text-2xs text-slate-400">{neighbor.aliases} cách viết</span>
        </div>
      </div>
      <ConfirmAction
        title={`Gộp “${neighbor.name}” vào “${current.name}”?`}
        description={
          <p>
            {neighbor.aliases} cách viết của “{neighbor.name}” chuyển sang “{current.name}” (đánh dấu MANUAL), rồi “
            {neighbor.name}” bị xoá. Không hoàn tác được.
          </p>
        }
        confirmLabel="Gộp"
        tone="danger"
        onConfirm={onMerge}
      >
        {(open) => (
          <Button variant="outline" size="sm" onClick={open} title={`Gộp vào ${current.name}`}>
            <ArrowsMerge className="size-4" />
            Gộp vào đây
          </Button>
        )}
      </ConfirmAction>
    </li>
  );
}

function RenameCard({ skill, onDone }: { skill: CanonicalSkillDetail; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [name, setName] = useState(skill.name);
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();
  const dirty = trimmed !== skill.name && trimmed.length > 0;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty) return;
    setSaving(true);
    try {
      await dictionaryService.rename(skill.id, trimmed);
      toast.success("Đã đổi tên hiển thị.");
      await onDone();
    } catch (err) {
      toast.danger(apiErrorMessage(err, "Không đổi được tên"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Tên hiển thị"
      description="embedding giữ nguyên"
    >
      <form onSubmit={(event) => void save(event)} className="flex max-w-lg gap-2">
        <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={200} />
        <Button type="submit" disabled={!dirty} loading={saving}>
          Lưu
        </Button>
      </form>
    </SectionCard>
  );
}
