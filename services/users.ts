import { api } from "@/lib/axios";
import type { Paginated, Role, UserDetail, UserListItem, UsersQuery } from "@/types";

export const usersService = {
  list: (query: UsersQuery) =>
    api.get<Paginated<UserListItem>>("/admin/users", { params: query }).then((r) => r.data),

  detail: (id: string) =>
    api.get<UserDetail>(`/admin/users/${encodeURIComponent(id)}`).then((r) => r.data),

  // Server chặn tự hạ quyền mình và hạ quyền admin cuối cùng (400).
  updateRole: (id: string, role: Role) =>
    api
      .put<Pick<UserListItem, "id" | "email" | "name" | "role">>(
        `/admin/users/${encodeURIComponent(id)}/role`,
        { role },
      )
      .then((r) => r.data),
};
