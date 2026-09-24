// Service worker Careelot Admin: chỉ cache tệp tĩnh, KHÔNG BAO GIỜ đụng /api (dữ liệu phải mới và đúng phiên đăng nhập).
// Đổi VERSION mỗi khi sửa file này hoặc offline.html để máy người dùng bỏ cache cũ.
const VERSION = "careelot-admin-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Chỉ font và icon: không đổi giữa các bản build. /_next/static để HTTP cache lo (đã immutable), cache ở đây chỉ phình dần qua mỗi lần deploy.
const isStaticAsset = (url) =>
  url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/icons/");

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // /api đi thẳng mạng, không respondWith: 401/403 và vai trò đọc từ /auth/me phải luôn là bản thật.
  if (url.pathname.startsWith("/api/")) return;

  // Trang: luôn lấy mạng; chỉ khi mạng ném lỗi (mất kết nối) mới trả trang offline, không bao giờ trả HTML cũ.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
