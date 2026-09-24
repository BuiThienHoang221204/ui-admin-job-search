import {
  BookOpenText,
  Briefcase,
  Broadcast,
  Coins,
  Heartbeat,
  Robot,
  SquaresFour,
  Stack,
  Users,
  WarningOctagon,
  Wrench,
} from "@phosphor-icons/react/ssr";

type NavItem = {
  label: string;
  href: string;
  icon: typeof SquaresFour;
  exact?: boolean;
};

// Chia theo việc admin đang làm, không theo bảng dữ liệu: vận hành hằng ngày, theo dõi AI, sửa dữ liệu.
export const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Vận hành",
    items: [
      { label: "Tổng quan", href: "/", icon: SquaresFour, exact: true },
      { label: "Hàng đợi", href: "/queues", icon: Stack },
      { label: "Quét tin", href: "/scrape", icon: Broadcast },
    ],
  },
  {
    label: "AI",
    items: [
      { label: "Sức khoẻ AI", href: "/ai-health", icon: Heartbeat },
      { label: "Nhật ký lỗi AI", href: "/ai-failures", icon: WarningOctagon },
      { label: "Token AI", href: "/ai-usage", icon: Coins },
      { label: "Prompt skills", href: "/skills", icon: Robot },
    ],
  },
  {
    label: "Dữ liệu",
    items: [
      { label: "Người dùng", href: "/users", icon: Users },
      { label: "Tin tuyển dụng", href: "/jobs", icon: Briefcase },
      { label: "Từ điển kỹ năng", href: "/dictionary", icon: BookOpenText },
      { label: "Bảo trì dữ liệu", href: "/maintenance", icon: Wrench },
    ],
  },
];

// "Hiển thị" không nằm trong menu (mở từ nút bánh răng ở hàng tài khoản) nhưng vẫn cần tên trang.
const hiddenItems: NavItem[] = [
  { label: "Hiển thị", href: "/settings", icon: SquaresFour },
];

export const navItems: NavItem[] = [
  ...navGroups.flatMap((group) => group.items),
  ...hiddenItems,
];

export function pageTitle(pathname: string): string {
  const matched = navItems
    .filter((item) =>
      item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return matched?.label ?? "";
}

// Mục khớp dài nhất thắng, để "/" không sáng cùng mọi trang con.
export function activeHref(pathname: string): string | undefined {
  return navItems.find((item) => pageTitle(pathname) === item.label)?.href;
}
