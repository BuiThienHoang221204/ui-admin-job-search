import type { MetadataRoute } from "next";

// Next phục vụ file này ở /manifest.webmanifest và tự chèn <link rel="manifest">. Tên, màu, icon khác app người dùng để hai app cài cạnh nhau không lẫn.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Careelot Admin",
    short_name: "CL Admin",
    description: "Bảng điều khiển vận hành Careelot: sức khoẻ AI, hàng đợi, quét tin và dữ liệu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "vi",
    background_color: "#FAFAFB",
    theme_color: "#1F1F21",
    icons: [
      { src: "/Careelot_Square.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/Careelot_Square.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/Careelot_Square.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
