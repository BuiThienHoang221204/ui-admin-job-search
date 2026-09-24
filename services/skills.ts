import { api } from "@/lib/axios";
import type { SkillManifest } from "@/types";

export const skillsService = {
  list: () =>
    api
      .get<{ skills: SkillManifest[] }>("/skills")
      .then((r) => r.data.skills),

  reload: () =>
    api
      .post<{ skills: SkillManifest[] }>("/skills/reload")
      .then((r) => r.data.skills),
};
