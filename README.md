# Careelot Admin

Bảng điều khiển vận hành cho Careelot. App Next.js riêng, tách khỏi `ui-ai-job-search`, dùng chung backend NestJS ở `ai-job-search/server`.

## Chạy

```bash
cp .env.local.example .env.local
pnpm install
pnpm dev          # http://localhost:3001
```

Cần backend chạy ở `BACKEND_URL` (mặc định `http://localhost:4000`). Trình duyệt gọi `/api` trên chính origin này, `rewrites()` trong `next.config.ts` chuyển tiếp sang backend.

Đăng nhập bằng tài khoản có `role = ADMIN`. Cookie `aijob_token` đặt trên `localhost` nên dùng chung với app người dùng (cổng 3000): đã đăng nhập bên kia thì vào thẳng được bên này, và ngược lại. Trên production, hai app phải chung domain gốc thì mới chia sẻ được phiên.

## Phân quyền

Ba lớp, chỉ lớp cuối là bảo mật thật:

1. `proxy.ts` — không có cookie thì đá về `/login`.
2. `AdminGate` (`components/shell/admin-gate.tsx`) — hỏi `/auth/me`, không phải ADMIN thì hiện màn chặn, không gọi API nào khác.
3. `RolesGuard` ở backend — APP_GUARD toàn cục, mọi route `@Roles('ADMIN')` trả 403 cho tài khoản thường.

## Trang

| Đường dẫn | Nội dung | API |
|---|---|---|
| `/` | Cần xử lý (luật ở server), dải chỉ số so kỳ trước kèm sparkline, lỗi AI gom nhóm, hàng đợi, lượt quét mỗi portal; 24 giờ hoặc 7 ngày | `GET admin/overview` |
| `/users`, `/users/[id]` | Tìm tài khoản, xem mức dùng AI và 10 lời gọi gần nhất, nâng/hạ quyền ADMIN | `GET admin/users`, `GET admin/users/:id`, `PUT admin/users/:id/role` |
| `/jobs`, `/jobs/[id]` | Kho tin: lọc theo nguồn, trạng thái rút yêu cầu, bỏ tin trùng; xem JD, yêu cầu đã rút, nhóm trùng; rút lại | `GET admin/jobs`, `GET admin/jobs/sources`, `GET admin/jobs/:id`, `POST matches/requirements/:jobId?force=true` |
| `/dictionary`, `/dictionary/[id]` | Từ điển kỹ năng: tìm theo tên/cách viết, lọc nguồn EXACT/LLM/MANUAL, đổi tên, chuyển cách viết, gộp kỹ năng, gợi ý gần nghĩa theo embedding, đối chiếu lại toàn kho | `GET admin/skills`, `GET admin/skills/summary`, `GET admin/skills/:id`, `PUT admin/skills/:id`, `POST admin/skills/aliases/move`, `POST admin/skills/:id/merge`, `POST admin/skills/rematch` |
| `/ai-usage` | Token vào/ra theo ngày, model, tác vụ; 10 tài khoản tốn nhất | `GET admin/ai-usage` |
| `/ai-health` | Tỷ lệ thành công, p50/p95, nguyên nhân hỏng theo tác vụ và model | `GET admin/ai-health` |
| `/ai-failures` | Nhật ký lời gọi hỏng, phân trang; bấm một dòng xem token, lý do dừng, phản hồi thô | `GET admin/ai-failures`, `GET admin/ai-calls/:id` |
| `/queues` | Số việc chờ/chạy (tự làm mới 5 giây), sửa concurrency/serial, nhặt việc kẹt | `GET queue/stats`, `GET/PUT admin/queue/config`, `POST admin/reconcile/run-now` |
| `/scrape` | Tình trạng từng portal (lượt gần nhất, xu hướng tin mới, số lần hỏng, chạm trần), lịch sử dạng ma trận lượt × portal, lọc lượt hỏng, quét ngay | `GET admin/scrape/portals`, `GET admin/scrape/batches`, `POST admin/scrape/run-now`, `POST scrape/portals/reload` |
| `/maintenance` | Tính lại phân loại tin, dựng lại danh bạ kỹ năng, phát suất chấm AI | `POST admin/jobs/backfill-taxonomy`, `POST matches/dictionary/rebuild`, `POST matches/shortlist/dispatch` |
| `/skills` | Prompt skill đang nạp, nạp lại SKILL.md | `GET skills`, `POST skills/reload` |
| `/settings` | Chủ đề sáng/tối, cỡ chữ | — |

## Giao diện

Chép từ `ui-ai-job-search` chứ không dùng chung package: `app/globals.css` (token màu, font), `public/fonts/`, `components/ui/*`, khung `components/shell/*`, `lib/{axios,query-client,theme,font-scale,sidebar}.ts`. Hệ thiết kế đầy đủ ở `ui-ai-job-search/design.md`. Sửa token ở một bên thì chép sang bên kia.

Khác biệt so với bản gốc (CỐ Ý, đừng chép đè từ `ui-ai-job-search` sang):

- `globals.css`: khối `.dark` gán thêm các bậc 200/700/800 của emerald, amber, rose, red, sky. Badge dùng `text-*-800` và `ring-*-200`, bản gốc chưa gán lại nên chữ badge gần như tàng hình ở chế độ tối. Thêm token `chart-in`/`chart-out` cho biểu đồ token (đã qua validator dataviz ở cả hai chế độ).
- Kiểu Workbench (theo `design.md`): `components/ui/section-card.tsx` là khung viền mảnh, không icon, không bóng; `table.tsx` tiêu đề cột chữ thường, ô thấp hơn; `empty-state.tsx` gọn một khối canh trái; `components/shell/page-header.tsx` gọn một dòng. `StatCard` đã bỏ, thay bằng `components/admin/metric-strip.tsx` (dải chỉ số phẳng, có so kỳ trước và sparkline).
- Quy tắc chữ: không nhãn IN HOA; font mono chỉ cho số, ID, email, khoá, tên model, không cho chữ tiếng Việt hay thời gian tương đối.

## Quy ước API

- Mọi GET trả danh sách đều phân trang, trả `{items, total, limit, offset}`. Gọi với `limit` tối đa 100.
- Route cập nhật dùng `PUT`, không dùng `PATCH`.
- `GET admin/ai-calls/:id` che `responseText` của mọi lời gọi gắn với một người dùng, vì đầu ra model tả lại hồ sơ và kinh nghiệm của họ. Chỉ lời gọi không thuộc về ai (chuẩn hoá kỹ năng, rút yêu cầu, tìm hiểu công ty) mới hiện phản hồi thô.

## Chưa có

- Khoá tài khoản và ẩn tin rác: cần migration thêm cột `User.disabledAt` và `Job.hiddenAt`.
- Ngân hàng câu hỏi phỏng vấn, agent runs, dữ liệu lương tham chiếu.
