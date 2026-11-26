# Graduation invitation

Thiệp mời tốt nghiệp song ngữ Việt / Anh (mặc định tiếng Việt), dùng màu Bách khoa, sơ đồ cổng trường / gửi xe / xe buýt và tên người nhận theo từng link.

Trang: https://NguyenHoangNam-1410.github.io/graduation-invitation/

## Tạo thiệp dọc có tên và link gửi

Cần Node.js 22 trở lên. Cài thư viện một lần trong thư mục repo:

```powershell
npm ci
```

Ảnh được render trực tiếp bằng SVG và font có sẵn trong repo; không cần cài trình duyệt hay font vào Windows.

1. Mở `.env.local` trong thư mục repo. Nếu chưa có, sao chép `.env.example` thành `.env.local`.
2. Điền tên người nhận theo mẫu sau:

```dotenv
SITE_URL=https://NguyenHoangNam-1410.github.io/graduation-invitation/
GUEST_NAMES='Minh Anh, Quốc Bảo, Như Mai'
PREVIEW_VERSION=6
DEFAULT_LANGUAGE=vi
```

Có thể nhập tên ngăn bằng dấu phẩy như trên, hoặc dùng mảng JSON có dấu nháy kép quanh từng tên. Danh sách dạng `[Bạn A, Bạn B]` cũng được chấp nhận.

3. Mở terminal trong thư mục repo và chạy:

```powershell
npm run links
```

`DEFAULT_LANGUAGE=vi` tạo ảnh tiếng Việt và link mở tiếng Việt. Đổi thành `DEFAULT_LANGUAGE=en` để tạo cả ảnh và link tiếng Anh. Bỏ trống thì dùng `vi`. Tiêu đề “Graduation Ceremony” và tên người nhận giữ nguyên trong cả hai bản.

Các URL có dạng `?to=Minh+Anh&v=6&lang=vi`. Tham số `lang` được ưu tiên hơn ngôn ngữ từng lưu trên trình duyệt; người nhận vẫn có thể dùng nút VI / EN. `PREVIEW_VERSION` điều khiển giá trị `v`; nếu bỏ trống thì mặc định hiện tại là `6`.

4. Mở `private/invitation-links.txt`. Mỗi mục ghi tên, đường dẫn ảnh và link tương ứng. Gửi ảnh trước, rồi dán link của đúng người đó qua Zalo / Messenger.

Ảnh PNG dọc **1080 × 1620** nằm trong `private/cards/vi/` hoặc `private/cards/en/`. Tên người nhận được in trên thiệp, tự xuống dòng / giảm cỡ chữ khi dài và giữ dấu tiếng Việt. Tên file có số thứ tự, tên không dấu và mã ngắn để tránh trùng. JSON tại `private/invitation-links.json` có các trường `name`, `url`, `language`, `image`; đường dẫn `image` tính từ thư mục `private/`. Mỗi lần chạy, danh sách TXT/JSON phản ánh đúng danh sách và ngôn ngữ vừa tạo; ảnh từ lần chạy trước vẫn được giữ.

Ví dụ chạy nhanh mà không sửa danh sách:

```powershell
npm run links -- "Minh Anh" "Quốc Bảo"
```

`.env.local`, danh sách tên và toàn bộ ảnh cá nhân trong `private/` được Git bỏ qua. Website không tải danh sách này; mỗi link chỉ mang tên của người nhận ở tham số `?to=...`. Đây là cá nhân hóa lời chào, không phải xác thực người xem.

## Thiệp tiệc mừng gia đình

Thiệp thứ hai, lời lẽ trang trọng, mời gia đình dự tiệc mừng tốt nghiệp: **18:00, Thứ Bảy 28/11/2026, Nhà hàng Sesan – 14 Einstein, Thủ Đức**. Không có sơ đồ trường hay hướng dẫn gửi xe.

Trang: https://NguyenHoangNam-1410.github.io/graduation-invitation/family/

1. Trong `.env.local`, thêm danh sách người nhận riêng:

```dotenv
FAMILY_GUEST_NAMES='Ông bà nội, Bác Hai và gia đình'
```

2. Chạy:

```powershell
npm run links:family
```

Ảnh dọc 1080 × 1620 và danh sách link nằm trong `private/family/`. Link có dạng `family/?to=...&v=f2&lang=vi` (đổi `FAMILY_PREVIEW_VERSION` nếu Zalo/Messenger vẫn hiện ảnh preview cũ); lời chào hiển thị “Kính gửi {tên}”, mặc định “Quý gia đình”. `FAMILY_SITE_URL` (tùy chọn) ghi đè địa chỉ, mặc định là `SITE_URL` + `family/`. Cũng có thể truyền tên trực tiếp: `npm run links:family -- "Bác Hai"`.

- Nội dung web: `docs/family/index.html` (bảng `id="invitation-translations"`; giờ bắt đầu trong lịch ở `eventStart`, không ghi giờ kết thúc).
- Nội dung ảnh dọc: `lib/portrait.mjs`, bảng `copy.family`.
- Ảnh preview khi chia sẻ: `docs/assets/family-preview-vi.png`, tạo lại bằng `npm run preview:family`.

## Sửa thiệp

- Nội dung và bảng bản dịch: `docs/index.html`. Tìm `id="invitation-translations"` để sửa cả hai ngôn ngữ.
- Nội dung và bố cục ảnh dọc: `lib/portrait.mjs` (bảng `copy.vi` / `copy.en`). Sau khi sửa, chạy lại `npm run links` để xuất ảnh mới. Nội dung ảnh và nội dung web được sửa riêng; logo và font lấy chung từ website.
- Tên hiển thị mặc định khi link không có `?to`: tìm `id="guest-name"`.
- Chữ ký: sửa khóa `footerSignature` trong bảng bản dịch.
- Năm cho nút lịch: tìm `const eventYear = 2026;`.
- Sơ đồ riêng để tham khảo / chỉnh vector: `docs/assets/campus-arrival.svg` và `docs/assets/campus-arrival-vi.svg`.
- Font của trang hosted nằm trong `docs/assets/fonts.css` và `docs/assets/fonts/`; logo nhúng trong HTML.

## Xem thử và kiểm tra

```powershell
npm run dev
npm run check
npm run check:fonts
```

Mở địa chỉ localhost mà terminal in ra. Thử thêm `?to=Minh+Anh` vào địa chỉ để kiểm tra lời chào.

## Cập nhật GitHub Pages

Pages lấy nội dung từ branch `main`, thư mục `/docs`. Sau khi sửa thiệp:

```powershell
git add docs
git commit -m "Update invitation"
git push
```

Danh sách tên và `DEFAULT_LANGUAGE` trong `.env.local` không cần deploy lại; chỉ chạy `npm run links` để tạo ảnh và link mới.

## Nguồn tài nguyên

- Logo HCMCUT.svg: Nguyenhai314, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:HCMCUT.svg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), không chỉnh sửa.
- Font Allura, Cormorant Garamond và Be Vietnam Pro: Google Fonts; giấy phép ở `docs/assets/FONT-LICENSES.txt`.
- Sơ đồ trường và các chỉ dẫn đến bãi xe / trạm xe buýt do chủ thiệp cung cấp.

## Ảnh preview khi chia sẻ

Ảnh dùng chung: `docs/assets/graduation-preview-vi.jpg` (1200 × 630 px). Trang khai báo ảnh bằng Open Graph và Twitter Card trong phần `<head>` để ứng dụng chat có thể lấy ảnh mà không chạy JavaScript.

Ảnh không chứa tên người nhận; tên cá nhân vẫn hiển thị khi mở đường dẫn có `?to=...`. Website không thay đổi hoặc xóa tham số này khi chia sẻ.

## Ngôn ngữ và font tiếng Việt

Thanh chọn VI / EN ở đầu trang. Mặc định tiếng Việt, ghi nhớ lựa chọn trên trình duyệt và hỗ trợ tham số lang=en hoặc lang=vi. Tên người nhận và tham số v được giữ nguyên khi chuyển ngôn ngữ.

Tiêu đề Graduation Ceremony giữ nguyên. Lời mời, nút, thông tin địa điểm, sơ đồ hướng dẫn và nội dung lịch đổi theo ngôn ngữ.

Font phần nội dung là Be Vietnam Pro. Allura dùng cho chữ viết tay, Cormorant Garamond dùng cho chữ có chân. Lệnh npm run check:fonts kiểm tra 134 ký tự tiếng Việt trong bảng cmap của toàn bộ file font đang dùng. Cần Python để chạy riêng kiểm tra font này.
