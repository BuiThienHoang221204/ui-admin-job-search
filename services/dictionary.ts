import { api } from "@/lib/axios";
import type { CanonicalSkillDetail, CanonicalSkillItem, DictionarySummary, Paginated, SkillsQuery } from "@/types";

const path = (id: string) => `/admin/skills/${encodeURIComponent(id)}`;

export const dictionaryService = {
  summary: () => api.get<DictionarySummary>("/admin/skills/summary").then((r) => r.data),

  list: (query: SkillsQuery) =>
    api.get<Paginated<CanonicalSkillItem>>("/admin/skills", { params: query }).then((r) => r.data),

  detail: (id: string) => api.get<CanonicalSkillDetail>(path(id)).then((r) => r.data),

  rename: (id: string, name: string) =>
    api.put<{ id: string; name: string }>(path(id), { name }).then((r) => r.data),

  // Khoá alias đi trong body vì có thể chứa `/`, `#`, `+`.
  moveAlias: (key: string, skillId: string) =>
    api
      .post<{ key: string; from: string; to: string; removedEmptySkill: boolean }>(
        "/admin/skills/aliases/move",
        { key, skillId },
      )
      .then((r) => r.data),

  merge: (sourceId: string, targetId: string) =>
    api
      .post<{ targetId: string; movedAliases: number }>(`${path(sourceId)}/merge`, { targetId })
      .then((r) => r.data),

  rematch: () =>
    api
      .post<{ queued: boolean; queueJobId: string | null }>("/admin/skills/rematch")
      .then((r) => r.data),
};
