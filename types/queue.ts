export interface QueueStatsItem {
  name: string;
  concurrency: number;
  size: number;
  active: number;
  total: number;
}

export interface QueueStats {
  queues: QueueStatsItem[];
  totalWaiting: number;
  totalActive: number;
}
