import { api } from "@/lib/axios";
import type { AuthResult, AuthUser } from "@/types";

/**
 * Đăng nhập và đăng ký chỉ trả `{ user }`; token nằm trong cookie httpOnly do
 * backend đặt. Đừng tìm cách lưu token vào localStorage: làm vậy là vứt bỏ toàn
 * bộ lợi ích của httpOnly.
 */
export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthResult>("/auth/login", { email, password }).then((r) => r.data),

  register: (email: string, password: string, name: string) =>
    api
      .post<AuthResult>("/auth/register", { email, password, name })
      .then((r) => r.data),

  logout: () => api.post<{ ok: true }>("/auth/logout").then((r) => r.data),

  /** Vai trò được đọc tươi từ database mỗi lần gọi, không nằm trong token. */
  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),
};
