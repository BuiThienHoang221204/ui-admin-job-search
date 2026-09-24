"use client";

import Link from "next/link";
import { ArrowLeft, ArrowSquareOut, Sparkle } from "@phosphor-icons/react/ssr";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/use-api-query";
import { apiErrorMessage } from "@/lib/axios";
import { keys } from "@/lib/query-keys";
import { jobsService } from "@/services";
import type { JobDetail, JobRequirements } from "@/types";
import { PageHeader } from "@/components/shell/page-header";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Alert, PageError } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyHint } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton, SkeletonPage } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn, formatCount, formatDate, formatDateTime } from "@/utils";
import { RequirementBadge } from "../requirement-badge";

export function JobDetailView({ id }: { id: string }) {
  const job = useApiQuery(keys.job(id), () => jobsService.detail(id), {
    errorMessage: "Không tải được tin",
  });

  if (job.error) return <PageError title="Không mở được tin" message={job.error} />;
  const data = job.data;

  return (
    <div className="space-y-5">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="size-3.5" />
        Tin tuyển dụng
      </Link>

      {!data ? (
        <SkeletonPage>
          <Skeleton className="h-14 w-2/3" />
          <Skeleton className="h-40" />
          <Skeleton className="h-96" />
        </SkeletonPage>
      ) : (
        <>
          <PageHeader
            title={data.title}
            subtitle={`${data.company}${data.location ? ` · ${data.location}` : ""}`}
            actions={
              <a href={data.url} target="_blank" rel="noreferrer noopener">
                <Button variant="outline" size="sm">
                  <ArrowSquareOut className="size-4.5" />
                  Mở tin gốc
                </Button>
              </a>
            }
          />

          <div className="grid gap-5 xl:grid-cols-3 *:min-w-0">
            <div className="space-y-5 xl:col-span-2">
              <RequirementsCard job={data} />
              <SectionCard title="Mô tả công việc">
                <div className="scrollbar-thin max-h-128 overflow-y-auto text-sm leading-relaxed whitespace-pre-line text-slate-700">
                  {data.description}
                </div>
              </SectionCard>
            </div>
            <div className="space-y-5">
              <MetaCard job={data} />
              <DuplicatesCard job={data} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetaCard({ job }: { job: JobDetail }) {
  // Cờ thứ ba: giá trị là mã/số thì dùng font-mono, chữ tự do (lương gốc) thì không.
  const rows: Array<[string, string | null, boolean]> = [
    ["Nguồn", job.source, true],
    ["Mã ngoài", job.externalId, true],
    ["Tỉnh/thành", job.provinceCode, true],
    ["Ngành", job.occupationCode, true],
    ["Ngành con", job.subOccupationCode, true],
    ["Hình thức", job.workMode, true],
    ["Lương (gốc)", job.salaryRaw, false],
    ["Đăng ngày", job.postedAt ? formatDate(job.postedAt) : null, true],
    ["Quét về", formatDateTime(job.scrapedAt), true],
    ["Khoá gộp trùng", job.dedupeKey, true],
  ];

  return (
    <SectionCard title="Thông tin">
      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
        {rows.map(([label, value, mono]) => (
          <div key={label} className="contents">
            <dt className="text-slate-500">{label}</dt>
            <dd className={value ? cn("break-all text-slate-900", mono && "font-mono") : "text-slate-300"}>
              {value ?? "—"}
            </dd>
          </div>
        ))}
        <dt className="text-slate-500">Lượt chấm</dt>
        <dd className="font-mono text-slate-900">{formatCount(job._count.matches)}</dd>
        <dt className="text-slate-500">Ứng tuyển</dt>
        <dd className="font-mono text-slate-900">{formatCount(job._count.applications)}</dd>
      </dl>
      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function DuplicatesCard({ job }: { job: JobDetail }) {
  return (
    <SectionCard title="Tin trùng">
      {job.duplicateOf ? (
        <p className="text-xs text-slate-600">
          Tin này là bản trùng của{" "}
          <Link href={`/jobs/${job.duplicateOf.id}`} className="font-medium text-primary-600 hover:underline">
            {job.duplicateOf.title}
          </Link>{" "}
          <span className="font-mono text-slate-400">({job.duplicateOf.source})</span>.
        </p>
      ) : job.duplicates.length === 0 ? (
        <EmptyHint>Không có tin nào trùng với tin này.</EmptyHint>
      ) : (
        <ul className="divide-y divide-slate-100">
          {job.duplicates.map((dup) => (
            <li key={dup.id} className="py-2">
              <Link href={`/jobs/${dup.id}`} className="line-clamp-1 text-xs font-medium text-slate-900 hover:text-primary-600">
                {dup.title}
              </Link>
              <p className="font-mono text-2xs text-slate-400">
                {dup.source} · {formatDate(dup.scrapedAt)}
              </p>
            </li>
          ))}
          {job._count.duplicates > job.duplicates.length && (
            <li className="pt-2 text-2xs text-slate-400">
              và {job._count.duplicates - job.duplicates.length} tin khác
            </li>
          )}
        </ul>
      )}
    </SectionCard>
  );
}

function SkillList({ title, skills }: { title: string; skills: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-600">
        {title} <span className="font-mono text-slate-400">{skills.length}</span>
      </p>
      {skills.length ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Không có</p>
      )}
    </div>
  );
}

function RequirementFacts({ req }: { req: JobRequirements }) {
  const facts: Array<[string, string]> = [
    ["Kinh nghiệm", req.minYears === null ? "—" : `${req.minYears}+ năm`],
    ["Cấp bậc", req.seniority],
    ["Thành phố", req.city ?? "—"],
    ["Làm từ xa", req.remotePolicy],
    ["Giấy phép lao động", req.workPermitRequired ? "Bắt buộc" : "Không"],
    ["Quốc tịch", req.citizenshipRequired ?? "—"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
      {facts.map(([label, value]) => (
        <div key={label}>
          <dt className="text-slate-500">{label}</dt>
          <dd className="text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RequirementsCard({ job }: { job: JobDetail }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const req = job.requirements;

  const extract = async () => {
    try {
      const result = await jobsService.extractRequirements(job.id);
      toast.success(
        result.status === "DONE"
          ? `Đã rút ${result.requiredSkills.length} kỹ năng bắt buộc.`
          : `Rút xong với trạng thái ${result.status}.`,
      );
    } catch (err) {
      toast.danger(apiErrorMessage(err, "Không rút được yêu cầu"));
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["admin", "job", job.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
    }
  };

  return (
    <SectionCard
      title="Yêu cầu AI đã rút"
      description={
        req?.extractedAt ? (
          <span className="font-mono">
            {formatDateTime(req.extractedAt)}
            {req.modelId ? ` · ${req.modelId}` : ""}
          </span>
        ) : undefined
      }
      actions={
        <>
          <RequirementBadge status={req?.status} />
          <ConfirmAction
            title="Rút lại yêu cầu của tin này?"
            description={
              <>
                <p>Gọi model ngay, bỏ qua kết quả cũ. Trang sẽ chờ cho tới khi model trả lời, có thể vài chục giây.</p>
                <p>Kết quả mới được dùng cho mọi hồ sơ ở lượt đối chiếu kế tiếp.</p>
              </>
            }
            confirmLabel="Rút lại"
            onConfirm={extract}
          >
            {(open) => (
              <Button variant="outline" size="sm" onClick={open}>
                <Sparkle className="size-4.5" />
                Rút lại
              </Button>
            )}
          </ConfirmAction>
        </>
      }
    >
      {!req ? (
        <EmptyHint>Tin này chưa từng được rút yêu cầu.</EmptyHint>
      ) : (
        <div className="space-y-4">
          {req.error && <Alert tone="danger">{req.error}</Alert>}
          <SkillList title="Bắt buộc" skills={req.requiredSkills} />
          <SkillList title="Nên có" skills={req.niceToHaveSkills} />
          <RequirementFacts req={req} />
        </div>
      )}
    </SectionCard>
  );
}
