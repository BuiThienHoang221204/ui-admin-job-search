"use client";

import { ArrowSquareOut, ShieldWarning, SignOut } from "@phosphor-icons/react/ssr";
import { useSession } from "@/components/shell/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonGrid, SkeletonPage } from "@/components/ui/skeleton";

const USER_APP_URL =
  process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000";

// Chỉ để giao diện không gọi API vô ích; người giữ dữ liệu thật là RolesGuard ở backend.
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();

  if (loading || !user) {
    return (
      <SkeletonPage>
        <Skeleton className="h-14 w-80" />
        <SkeletonGrid
          count={4}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          itemClassName="h-28"
        />
        <Skeleton className="h-64" />
      </SkeletonPage>
    );
  }

  if (user.role !== "ADMIN") return <AccessDenied />;

  return <>{children}</>;
}

export function AccessDenied() {
  const { user, logout } = useSession();

  return (
    <div className="flex min-h-96 items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <ShieldWarning className="size-5.5" />
          </span>
          <p className="text-base font-semibold text-slate-900">
            Tài khoản này không có quyền quản trị
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            {user?.email ? (
              <>
                <span className="font-mono text-slate-700">{user.email}</span>{" "}
                đang là tài khoản người dùng.{" "}
              </>
            ) : null}
            Đăng nhập bằng tài khoản quản trị viên, hoặc quay về ứng dụng chính.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => void logout()}>
              <SignOut className="size-4.5" />
              Đổi tài khoản
            </Button>
            <a href={USER_APP_URL}>
              <Button>
                <ArrowSquareOut className="size-4.5" />
                Về Careelot
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
