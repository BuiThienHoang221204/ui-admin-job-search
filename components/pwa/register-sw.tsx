"use client";

import { useEffect } from "react";

// Chỉ đăng ký ở bản build: ở dev, service worker giữ tệp cũ và làm hot reload trông như hỏng.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Không đăng ký được (trình duyệt chặn, http không phải localhost) thì app vẫn chạy như web thường.
    });
  }, []);
  return null;
}
