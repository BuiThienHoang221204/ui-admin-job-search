export type WorkStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PageQuery {
  limit?: number;
  offset?: number;
}
