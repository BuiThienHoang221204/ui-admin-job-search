import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "aijob_token";

// Chỉ chặn ở tầng điều hướng: cookie có hay không. Vai trò ADMIN do AdminGate hỏi /auth/me, dữ liệu do RolesGuard ở backend giữ.
export function proxy(request: NextRequest) {
  if (request.cookies.get(AUTH_COOKIE)?.value) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Mọi trang trừ /login, proxy /api và tệp tĩnh.
export const config = {
  // PWA: manifest, sw.js, offline.html và icon phải tải được khi chưa đăng nhập (trình duyệt đọc chúng trước cả trang login).
  matcher: ["/((?!login|api|_next|fonts|icons|icon.svg|careelot-logo.svg|favicon.ico|manifest.webmanifest|sw.js|offline.html).*)"],
};
