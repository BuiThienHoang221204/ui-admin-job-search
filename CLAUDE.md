@AGENTS.md

## Tái sử dụng component

Dựng giao diện bằng component **có sẵn**: `components/ui/` (`Table`, `SectionCard`, `Badge`, `Button`, `Tabs`, `Alert`, `Skeleton`, `EmptyState`, `Modal`…), `components/admin/` (`MetricStrip`, `FailureKindsCard`, `ConfirmAction`, `SuccessRateCell`…) và `components/shell/` (`PageHeader`). Thiếu một biến thể thì sửa component đang có hơn là thêm file mới.

- **Phần hiển thị riêng của một trang** viết thẳng trong JSX của trang đó. Logic chọn nhãn, màu, định dạng thì đưa vào một hàm thuần trả dữ liệu, để JSX vẫn dùng `Badge`/`TableCell` có sẵn. Mẫu: `badgeOf()` và `positionIn()` ở `app/(console)/ai-health/model-pool-tab.tsx`, thay cho một `ModelBadge` và một `ChainCard` tự viết.
- **Một tab hoặc khối lớn có state riêng** (polling, đếm giờ) được tách thành một file cạnh trang để state đó chỉ render lại khối ấy. Mẫu: `model-pool-tab.tsx`.
- **Chỉ tạo component mới khi nó được dùng ở ≥ 2 trang** và chưa có component nào làm được. Khi đó đặt nó ở `components/admin/`, không đặt cạnh trang.
