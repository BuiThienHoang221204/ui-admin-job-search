"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowSquareOut,
  Gear,
  SidebarSimple,
  SignOut,
} from "@phosphor-icons/react/ssr";
import { toggleSidebar } from "@/lib/sidebar";
import { cn, personInitials } from "@/utils";
import { useSession } from "@/components/shell/session";
import { activeHref, navGroups } from "@/components/shell/nav-items";
import { BrandLogo } from "@/components/shell/brand-logo";

const USER_APP_URL =
  process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000";

const itemClass = (active: boolean) =>
  cn(
    "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150",
    active
      ? "bg-primary-50 text-primary-900 font-semibold border-l-2 border-primary-600 pl-2.5"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
  );

export function Sidebar() {
  const pathname = usePathname();
  const current = activeHref(pathname);
  const { user, loading, logout } = useSession();

  return (
    <aside className="flex h-full w-(--sidebar-width) shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-white transition-[width] duration-200 ease-out">
      <div className="flex h-[65px] shrink-0 items-center border-b border-slate-100 pr-3 pl-6 collapsed:justify-center collapsed:px-0">
        <div className="flex items-center gap-2 collapsed:hidden">
          <BrandLogo className="h-[30.52px] w-[106.58px] shrink-0" />
          <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-3xs font-semibold text-amber-900">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="ml-auto hidden size-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors collapsed:ml-0 hover:bg-slate-100 hover:text-slate-900 lg:flex"
          aria-label="Thu gọn hoặc mở rộng thanh bên"
          title="Thu gọn / mở rộng thanh bên"
        >
          <SidebarSimple className="size-5.5" />
        </button>
      </div>

      <nav className="scrollbar-thin w-64 flex-1 overflow-y-auto px-3 pb-3">
        {navGroups.map((group) => (
          <div key={group.label} className="pt-3">
            <p
              data-sidebar-label
              className="px-3 pb-1 text-2xs font-medium text-slate-400"
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = href === current;
                return (
                  <Link key={href} href={href} title={label} className={itemClass(active)}>
                    <Icon
                      className={cn(
                        "size-4.5 shrink-0",
                        active ? "text-primary-600" : "text-slate-400",
                      )}
                    />
                    <span data-sidebar-label className="truncate">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-4 border-t border-slate-100/90 pt-3">
          <a href={USER_APP_URL} title="Về Careelot" className={itemClass(false)}>
            <ArrowSquareOut className="size-4.5 shrink-0 text-slate-400" />
            <span data-sidebar-label className="truncate">
              Về Careelot
            </span>
          </a>
        </div>
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-slate-100 px-4 py-3 collapsed:flex-col collapsed:gap-2 collapsed:px-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-100 text-xs font-bold text-slate-800">
          {loading ? "…" : personInitials(user?.name)}
        </div>
        <div className="min-w-0 flex-1 leading-tight collapsed:hidden">
          <p className="truncate text-xs font-semibold text-slate-900">
            {loading ? "Đang tải…" : (user?.name ?? "Chưa đăng nhập")}
          </p>
          <p className="truncate font-mono text-2xs text-slate-400">
            {user?.email ?? ""}
          </p>
        </div>
        <Link
          href="/settings"
          title="Hiển thị: chủ đề và cỡ chữ"
          aria-label="Cài đặt hiển thị"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900",
            current === "/settings" ? "bg-primary-50 text-primary-600" : "text-slate-400",
          )}
        >
          <Gear className="size-4.5" />
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <SignOut className="size-4.5" />
        </button>
      </div>
    </aside>
  );
}
