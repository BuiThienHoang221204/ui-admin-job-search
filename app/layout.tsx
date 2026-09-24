import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex } from "next/font/google";
import { QueryProvider } from "@/lib/query-client";
import { ToastProvider } from "@/components/ui/toast";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { FONT_SCALE_BOOTSTRAP } from "@/lib/font-scale";
import { SIDEBAR_BOOTSTRAP } from "@/lib/sidebar";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import "./globals.css";

const googleSans = Google_Sans_Flex({
  subsets: ["latin", "vietnamese"],
  axes: ["opsz"],
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Careelot Admin", template: "%s — Careelot Admin" },
  description: "Bảng điều khiển vận hành Careelot: sức khoẻ AI, hàng đợi, quét tin và bảo trì dữ liệu.",
  robots: { index: false, follow: false },
  // iOS không đọc manifest để lấy icon và chế độ toàn màn hình khi "Thêm vào màn hình chính".
  appleWebApp: { capable: true, title: "CL Admin", statusBarStyle: "black-translucent" },
  // Khai báo icons là Next bỏ favicon tự sinh từ app/icon.svg, nên phải liệt kê lại.
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
};

// Xám đậm thay cho xanh thương hiệu: cửa sổ admin đã cài phân biệt được với app người dùng ngay trên thanh tác vụ.
export const viewport: Viewport = {
  themeColor: "#1F1F21",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={googleSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <script dangerouslySetInnerHTML={{ __html: FONT_SCALE_BOOTSTRAP }} />
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_BOOTSTRAP }} />
      </head>
      <body>
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
          <RegisterServiceWorker />
        </QueryProvider>
      </body>
    </html>
  );
}
