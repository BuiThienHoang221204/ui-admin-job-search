"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, SignIn, WarningCircle } from "@phosphor-icons/react/ssr";
import { BrandLogo } from "@/components/shell/brand-logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { apiErrorMessage, apiErrorStatus } from "@/lib/axios";
import { authService } from "@/services";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "/";
  // Chỉ nhận đường dẫn nội bộ, chặn open redirect kiểu `//evil.com`.
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(email, password);
      // Body của /auth/login không có `role`; vai trò chỉ đọc tươi từ DB qua /auth/me.
      const user = await authService.me();
      // Không đăng xuất tài khoản thường: cookie dùng chung với app người dùng, xoá nó là đá họ ra khỏi cả bên kia.
      if (user.role !== "ADMIN") {
        setError("Tài khoản này không có quyền quản trị.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(
        apiErrorStatus(err) === 401
          ? "Email hoặc mật khẩu không đúng"
          : apiErrorMessage(err, "Đăng nhập không thành công"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo className="h-[34px] w-[119px]" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-2xs font-semibold text-amber-900">
            <ShieldCheck className="size-4" />
            Khu vực quản trị
          </span>
          <p className="text-sm text-slate-500">
            Đăng nhập bằng tài khoản quản trị viên để vận hành hệ thống
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700"
            >
              <WarningCircle className="mt-px size-4.5 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {!loading && <SignIn className="size-4.5" />}
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
