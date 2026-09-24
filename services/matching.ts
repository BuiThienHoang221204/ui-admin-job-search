import { api } from "@/lib/axios";
import type { ShortlistResult } from "@/types";

export const matchingService = {
  // Xếp hàng `skill.canonicalize`; mỗi lô tự xếp lô kế tới khi quét hết kho.
  rebuildDictionary: () =>
    api
      .post<{ queued: boolean; queueJobId: string | null }>(
        "/matches/dictionary/rebuild",
      )
      .then((r) => r.data),

  // Trả về 0/0/0 khi MATCH_AI_AUTO=false, không phải lỗi.
  dispatchShortlist: (userId?: string) =>
    api
      .post<ShortlistResult>("/matches/shortlist/dispatch", null, {
        params: userId ? { userId } : {},
      })
      .then((r) => r.data),
};
