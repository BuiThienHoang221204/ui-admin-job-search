"use client";

import { useState } from "react";

// Offset gắn với bộ lọc sinh ra nó: bộ lọc (đã qua debounce) đổi thì tự về trang đầu, không cần effect.
export function usePagedFilters(filters: unknown) {
  const key = JSON.stringify(filters);
  const [state, setState] = useState({ key, offset: 0 });
  const offset = state.key === key ? state.offset : 0;
  const setOffset = (next: number) => setState({ key, offset: next });
  return [offset, setOffset] as const;
}
