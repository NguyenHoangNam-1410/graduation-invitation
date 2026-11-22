# Graduation invitation

Thiệp mời tốt nghiệp song ngữ Việt / Anh (mặc định tiếng Việt), dùng màu Bách khoa, sơ đồ cổng trường / gửi xe / xe buýt và tên người nhận theo từng link.

Trang: https://NguyenHoangNam-1410.github.io/graduation-invitation/

## Nhập danh sách tên và lấy link gửi

Cần Node.js 22 trở lên; không cần cài thêm thư viện.

1. Mở `.env.local` trong thư mục repo. Nếu chưa có, sao chép `.env.example` thành `.env.local`.
2. Điền tên người nhận theo mẫu sau:

```dotenv
SITE_URL=https://NguyenHoangNam-1410.github.io/graduation-invitation/
GUEST_NAMES='Minh Anh, Quốc Bảo, Như Mai'
PREVIEW_VERSION=6
```

Có thể nhập tên ngăn bằng dấu phẩy như trên, hoặc dùng mảng JSON có dấu nháy kép quanh từng tên. Danh sách dạng `[Bạn A, Bạn B]` cũng được chấp nhận.

3. Mở terminal trong thư mục repo và chạy:

```powershell
npm run links
```

Các URL tự có dạng `?to=Minh+Anh&v=6`. `PREVIEW_VERSION` trong `.env.local` điều khiển giá trị `v`; nếu bỏ trống thì mặc định hiện tại là `6`. Khi cần một bộ link phiên bản mới, tăng số rồi chạy lại lệnh.

4. Mở `private/invitation-links.txt`, sao chép link của từng người và gửi qua Zalo / Messenger. Bản JSON có ở `private/invitation-links.json`.

Ví dụ chạy nhanh mà không sửa danh sách:

```powershell
npm run links -- "Minh Anh" "Quốc Bảo"
```

`.env.local` và thư mục `private/` được Git bỏ qua. Website không tải danh sách tên này; mỗi link chỉ mang tên của người nhận ở tham số `?to=...`. Đây là cá nhân hóa lời chào, không phải xác thực người xem.

## Sửa thiệp

- Nội dung và bảng bản dịch: `docs/index.html`. Tìm `id="invitation-translations"` để sửa cả hai ngôn ngữ.
- Tên hiển thị mặc định khi link không có `?to`: tìm `id="guest-name"`.
- Chữ ký: sửa khóa `footerSignature` trong bảng bản dịch.
- Năm cho nút lịch: tìm `const eventYear = 2026;`.
- Sơ đồ riêng để tham khảo / chỉnh vector: `docs/assets/campus-arrival.svg`. Bản đang hiện trong thiệp được nhúng trực tiếp trong `docs/index.html`.
- Font của trang hosted nằm trong `docs/assets/fonts.css` và `docs/assets/fonts/`; logo và bản đồ vẫn nhúng trong HTML. Tách font giúp trang nhẹ hơn khi ứng dụng chat lấy thông tin preview.

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

Danh sách tên trong `.env.local` không cần deploy lại; chỉ chạy `npm run links` để tạo link mới.

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
