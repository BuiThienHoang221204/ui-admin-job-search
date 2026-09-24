import { api } from "@/lib/axios";
import type { QueueStats } from "@/types";

export const queueService = {
  stats: () => api.get<QueueStats>("/queue/stats").then((r) => r.data),
};
