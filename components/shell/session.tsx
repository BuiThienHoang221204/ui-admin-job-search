"use client";

import { createContext, useCallback, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from "@/types";
import { authService } from "@/services";

interface SessionValue {
  /** null khi chưa tải xong hoặc chưa đăng nhập. */
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue>({
  user: null,
  loading: true,
  logout: async () => { },
});

/**
 * Nạp người dùng hiện tại MỘT lần cho cả khung quản trị.
 *
 * Cả header lẫn sidebar đều cần tên và email. Đi qua React Query để request
 * được gộp: useEffect tự gọi thì StrictMode ở dev bắn `/auth/me` hai lần.
 * 401 (cookie hết hạn giữa chừng) do QueryProvider đưa về trang đăng nhập.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
  });

  const logout = useCallback(async () => {
    // Xoá cookie ở phía máy chủ TRƯỚC rồi mới chuyển trang: đảo thứ tự thì
    // middleware chạy khi cookie vẫn còn và sẽ đẩy ngược về dashboard.
    try {
      await authService.logout();
    } catch {
      // Token hết hạn thì logout cũng trả lỗi, nhưng người dùng vẫn phải ra
      // được. Backend cố ý không đặt guard trên route này vì lý do đó.
    }
    // Nạp lại cả trang để xoá cache Query của phiên cũ, tài khoản đăng nhập sau không thấy dữ liệu của nó.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Nạp lại cả trang là CHỦ ĐÍCH, xem comment ngay trên.
    window.location.assign("/login");
  }, []);

  return (
    <SessionContext.Provider
      value={{ user: data ?? null, loading: isPending, logout }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
