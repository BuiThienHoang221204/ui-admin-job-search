import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const AUTH_COOKIE = "aijob_token";

/**
 * Client gọi thẳng backend NestJS từ trình duyệt.
 *
 * `withCredentials: true` bảo trình duyệt gửi kèm cookie httpOnly mà backend
 * đặt lúc đăng nhập. Không có nó thì cookie tồn tại nhưng không bao giờ được
 * đính vào request, và mọi lời gọi đều nhận 401 — một lỗi đặc biệt khó đoán vì
 * tab Application của DevTools vẫn thấy cookie nằm đó.
 *
 * Phía backend phải có `credentials: true` trong CORS và `origin` là một địa
 * chỉ cụ thể, không được là '*'. Đã cấu hình ở server/src/main.ts.
 */
export const api = axios.create({
  // Mặc định tương đối: gọi thẳng :4000 từ origin :3001 bị CORS chặn và cookie không đi kèm.
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  /**
   * Mảng thành `province=HN&province=HCM`, KHÔNG phải `province[]=HN`.
   *
   * Mặc định axios thêm cặp ngoặc vuông vào tên tham số. Express đọc dạng đó ra
   * khoá `province[]`, mà DTO khai `province` - `ValidationPipe` đang bật
   * `forbidNonWhitelisted` nên nó trả 400 "property province[] should not
   * exist" và cả trang lọc việc làm trắng xoá.
   */
  paramsSerializer: {
    serialize: (params: Record<string, unknown>) => {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) search.append(key, String(item));
        } else {
          search.append(key, String(value));
        }
      }
      return search.toString();
    },
  },
});

/** Route KHÔNG thử lại sau 401: /auth/refresh tránh tự gọi lại vô tận, hai route kia 401 là câu trả lời ĐÚNG (sai mật khẩu) chứ không phải token hết hạn. */
const NO_RETRY = ["/auth/refresh", "/auth/login", "/auth/register"];

/** Lời refresh đang bay, dùng chung cho mọi request 401 cùng lúc - không gộp thì một trang bắn 6 request thì cả 6 cùng gọi /auth/refresh. */
let refreshing: Promise<void> | null = null;

const refreshOnce = (): Promise<void> => {
  refreshing ??= api
    .post("/auth/refresh")
    .then(() => undefined)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** Access hết hạn thì đổi lấy cái mới rồi chạy lại request, thay vì đá người dùng về đăng nhập giữa chừng. Chỉ thử lại MỘT lần (`_retried`) - refresh xong vẫn 401 nghĩa là phiên đã chết thật. */
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) throw error;

    const config = error.config as RetriableConfig | undefined;
    const url = config?.url ?? "";
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      NO_RETRY.some((path) => url.startsWith(path))
    ) {
      throw error;
    }

    config._retried = true;
    try {
      await refreshOnce();
    } catch {
      // Refresh cũng hỏng: phiên đã hết thật. Ném lỗi 401 GỐC ra ngoài để chỗ gọi xử lý như trước (vd QueryProvider đá về /login).
      throw error;
    }
    return api(config);
  },
);

/**
 * Rút thông báo lỗi mà backend gửi kèm.
 *
 * NestJS trả `message` là chuỗi, hoặc MẢNG chuỗi khi ValidationPipe bắt nhiều
 * trường sai cùng lúc. Không xử lý cả hai dạng thì màn hình hiện
 * "[object Object]" đúng vào lúc người dùng cần biết mình nhập sai chỗ nào.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const message: unknown = error.response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
    // Không có response nghĩa là request còn chưa tới được máy chủ.
    if (!error.response) return "Không kết nối được tới máy chủ";
  }
  return fallback;
}

/** Trạng thái HTTP, để giao diện phân biệt "sai mật khẩu" với "máy chủ hỏng". */
export const apiErrorStatus = (error: unknown): number | undefined =>
  error instanceof AxiosError ? error.response?.status : undefined;
