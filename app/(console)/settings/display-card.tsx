"use client";

import { useSyncExternalStore } from "react";
import { Minus, Monitor, Moon, Plus, Sun } from "@phosphor-icons/react/ssr";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/utils";
import {
  applyFontScale,
  DEFAULT_PERCENT,
  MAX_PERCENT,
  MIN_PERCENT,
  readFontScale,
  serverFontScale,
  STEP_PERCENT,
  subscribeFontScale,
} from "@/lib/font-scale";
import {
  applyTheme,
  readTheme,
  serverTheme,
  subscribeTheme,
  THEMES,
  type ThemeId,
} from "@/lib/theme";

const THEME_ICON: Record<ThemeId, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function DisplayCard() {
  // localStorage nằm ngoài React nên dùng useSyncExternalStore để không lệch hydration; cỡ chữ thật đã do script trong <head> đặt sẵn.
  const percent = useSyncExternalStore(
    subscribeFontScale,
    readFontScale,
    serverFontScale,
  );

  const theme = useSyncExternalStore(subscribeTheme, readTheme, serverTheme);

  const atMin = percent <= MIN_PERCENT;
  const atMax = percent >= MAX_PERCENT;

  return (
    <SectionCard title="Giao diện & hiển thị" description="lưu trên trình duyệt này"
      contentClassName="space-y-0"
    >
      <SettingRow label="Giao diện" hint="Chọn cố định hoặc theo cài đặt của máy">
        <div
          role="radiogroup"
          aria-label="Giao diện"
          className="flex w-full rounded-md border border-slate-200 p-0.5"
        >
          {THEMES.map((option) => {
            const Icon = THEME_ICON[option.id];
            const active = option.id === theme;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => applyTheme(option.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs transition",
                  active
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow label="Cỡ chữ" hint="Áp ngay cho mọi trang; máy khác cần chỉnh lại">
        <div className="flex w-full flex-wrap items-center justify-end gap-3">
          {percent !== DEFAULT_PERCENT && (
            <button
              type="button"
              onClick={() => applyFontScale(DEFAULT_PERCENT)}
              className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700"
            >
              Về mặc định
            </button>
          )}

          <div className="flex items-center gap-0.5 rounded-md border border-slate-200 p-0.5">
            <StepButton
              label="Giảm cỡ chữ"
              disabled={atMin}
              onClick={() => applyFontScale(percent - STEP_PERCENT)}
            >
              <Minus className="size-4" />
            </StepButton>

            <output
              aria-live="polite"
              className="min-w-16 text-center font-mono text-xs font-semibold text-slate-700 tabular-nums"
            >
              {percent}%
            </output>

            <StepButton
              label="Tăng cỡ chữ"
              disabled={atMax}
              onClick={() => applyFontScale(percent + STEP_PERCENT)}
            >
              <Plus className="size-4" />
            </StepButton>
          </div>
        </div>
      </SettingRow>
    </SectionCard>
  );
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 border-t border-slate-100 py-3 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] sm:items-center sm:gap-6">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded transition",
        disabled ? "text-slate-300" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  );
}
