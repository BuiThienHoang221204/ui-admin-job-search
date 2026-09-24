"use client";

import { usePathname } from "next/navigation";
import { List } from "@phosphor-icons/react/ssr";
import { pageTitle } from "@/components/shell/nav-items";

interface HeaderProps {
  onMenuClick: () => void;
}

// Chỉ hiện dưới lg: trên desktop tiêu đề đã nằm trong PageHeader của từng trang.
export function Header({ onMenuClick }: HeaderProps) {
  const title = pageTitle(usePathname());

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
        aria-label="Mở menu"
      >
        <List className="size-5.5" />
      </button>
      {title && (
        <h1 className="truncate text-sm font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
      )}
    </header>
  );
}
