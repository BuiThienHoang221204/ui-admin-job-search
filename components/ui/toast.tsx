"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle, Warning, X } from "@phosphor-icons/react/ssr";
import { cn } from "@/utils";

type ToastTone = "success" | "danger";

export type ToastPosition = "top" | "bottom-right";

type ToastContent = ReactNode | ((dismiss: () => void) => ReactNode);

export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
}

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: ToastContent;
  duration: number;
  position: ToastPosition;
}

interface ToastApi {
  success: (message: ToastContent, options?: ToastOptions) => number;
  danger: (message: ToastContent, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const DEFAULT_DURATION = 5_000;
const DANGER_DURATION = 8_000;

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error("useToast phải nằm trong ToastProvider");
  }
  return api;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (
      tone: ToastTone,
      message: ToastContent,
      options?: ToastOptions,
    ): number => {
      const id = nextId++;
      setItems((current) => [
        ...current,
        {
          id,
          tone,
          message,
          duration:
            options?.duration ??
            (tone === "danger" ? DANGER_DURATION : DEFAULT_DURATION),
          position: options?.position ?? "top",
        },
      ]);
      return id;
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => push("success", message, options),
      danger: (message, options) => push("danger", message, options),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {items
          .filter((item) => item.position === "top")
          .map((item) => (
            <ToastCard key={item.id} item={item} onClose={dismiss} />
          ))}
      </div>
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-4">
        {items
          .filter((item) => item.position === "bottom-right")
          .map((item) => (
            <ToastCard key={item.id} item={item} onClose={dismiss} />
          ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const entering = requestAnimationFrame(() => setVisible(true));
    const leaving = setTimeout(() => setVisible(false), item.duration);
    const removing = setTimeout(() => onClose(item.id), item.duration + 300);
    return () => {
      cancelAnimationFrame(entering);
      clearTimeout(leaving);
      clearTimeout(removing);
    };
  }, [item.duration, item.id, onClose]);

  const danger = item.tone === "danger";
  const fromBottom = item.position === "bottom-right";
  const Icon = danger ? Warning : CheckCircle;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg transition-all duration-300",
        danger ? "border-rose-200" : "border-slate-200",
        visible
          ? "translate-y-0 opacity-100"
          : cn("opacity-0", fromBottom ? "translate-y-2" : "-translate-y-2"),
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          danger ? "text-rose-500" : "text-green-500",
        )}
      />
      <div className="min-w-0 flex-1 text-sm text-slate-700">
        {typeof item.message === "function"
          ? item.message(() => onClose(item.id))
          : item.message}
      </div>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        aria-label="Đóng thông báo"
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
      >
        <X className="size-4.5" />
      </button>
    </div>
  );
}
