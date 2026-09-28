# HTML to Figma — thiết kế bản đầu tiên

Trạng thái: đã triển khai và kiểm chứng paste thực tế cùng sửa text trong Figma; giới hạn font và sai khác hiển thị được ghi tại `docs/validation.md`.

## Mục tiêu đã thống nhất

Người dùng chọn web app: nhập HTML/CSS/JavaScript, xem giao diện chạy trong trình duyệt, bấm Copy to Figma, sau đó Cmd/Ctrl+V vào Figma để nhận layer có thể chỉnh sửa. Không yêu cầu người dùng mở plugin Figma để import.

Thành công được đánh giá bằng kết quả paste trong Figma: text sửa được, các thành phần thông thường tách thành layer và bố cục gần với preview. Clipboard có dữ liệu hoặc thông báo copy thành công chưa đủ để xác nhận toàn bộ luồng hoạt động.

## Phạm vi đề xuất

- Editor có ba tab HTML, CSS, JS; HTML nhận cả fragment lẫn tài liệu hoàn chỉnh.
- Nút Run cập nhật preview. JavaScript chỉ chạy khi người dùng Run; không chạy lại theo mỗi phím gõ.
- Preview cho phép tương tác trước khi capture, ví dụ mở modal hoặc đổi nội dung bằng JavaScript.
- Chọn chiều rộng desktop, tablet, mobile hoặc nhập số; kích thước capture theo viewport thực của preview.
- Copy toàn bộ nội dung preview ở trạng thái hiện tại. Không capture phần editor, toolbar hoặc lớp thông báo.
- Thông báo đang chuẩn bị, đang copy, copy thành công và lỗi có thể thử lại.
- Có ví dụ dựng sẵn để thử text, ảnh, SVG, flex/grid, border, bo góc và shadow.
- Lưu bản nháp mã nguồn trong trình duyệt; không thêm tài khoản hoặc cơ sở dữ liệu cho bản đầu.

Giả định triển khai: ưu tiên Chrome/Edge trên máy tính, chạy localhost khi phát triển và HTTPS khi triển khai. Bản đầu xử lý HTML/CSS/JS chạy trực tiếp trên trình duyệt; chưa có bước biên dịch React/JSX, cài package npm hoặc import toàn bộ repository. Các tài nguyên ngoài cần URL truy cập được.

## Các hướng kỹ thuật

1. **Dùng capture runtime do Figma cung cấp — đề xuất cho bản đầu.** Có luồng clipboard hiện hữu; cần kiểm chứng trong môi trường preview của app. Phụ thuộc endpoint và hành vi runtime của Figma. Tài liệu chính thức mô tả workflow thông qua MCP, chưa đủ để xem runtime này là SDK nhúng được cam kết ổn định.
2. **Tự viết DOM → dữ liệu clipboard Figma.** Chủ động hơn ở phần chuyển đổi nhưng phải xây và duy trì xử lý text, font, ảnh, layout và định dạng clipboard. Phạm vi lớn hơn đáng kể; chưa chọn cho bản đầu.
3. **Dùng Figma plugin để dựng node.** Có API tạo layer, nhưng không đáp ứng thao tác paste trực tiếp đã thống nhất nên không chọn.

## Kiến trúc đề xuất

Ứng dụng editor dùng React, TypeScript và Vite. Preview chạy ở origin riêng, trong iframe giới hạn quyền; mã JavaScript được nhập không có quyền đọc DOM hoặc localStorage của editor. Không dùng iframe srcdoc cùng origin với đồng thời allow-scripts và allow-same-origin để coi đó là cách ly an toàn.

Các phần có trách nhiệm riêng:

- **Editor:** quản lý mã nguồn, ví dụ, draft và kích thước preview.
- **Document builder:** ghép tài liệu HTML, CSS và JS, giữ thứ tự thực thi rõ ràng và gắn cầu nối preview. Không dùng thay thế chuỗi đơn giản dễ làm hỏng thẻ script/style.
- **Preview runner:** render tài liệu, báo lỗi runtime và quản lý phiên preview hiện tại.
- **Capture adapter:** tải runtime Figma khi cần capture, thực hiện capture và chuyển trạng thái về editor. Đặt phụ thuộc Figma sau một giao diện riêng để có thể thay thế khi runtime thay đổi.
- **Bridge:** giao tiếp qua postMessage, kiểm tra origin, cửa sổ gửi, kiểu message và phiên preview. Kết quả của phiên cũ không cập nhật phiên mới.

Mã nguồn được chuyển sang preview trong trình duyệt. App không cần lưu mã lên server. Runtime Figma và tài nguyên ngoài vẫn có thể tạo yêu cầu mạng; không mô tả tính năng này là hoàn toàn offline hay bảo đảm không có kết nối bên thứ ba.

## Luồng sử dụng và clipboard

1. Người dùng nhập mã và bấm Run.
2. App tạo phiên preview mới và báo tình trạng tải tài liệu.
3. Người dùng tương tác để đưa giao diện đến trạng thái cần copy.
4. Người dùng bấm Copy to Figma. Chờ font/ảnh trong giới hạn thời gian; báo rõ tài nguyên chưa sẵn sàng khi cần.
5. Adapter capture DOM đang hiển thị bằng runtime Figma và ghi dữ liệu HTML clipboard tương thích với Figma.
6. Chỉ báo copy thành công khi thao tác ghi clipboard được xác nhận. Không dựa duy nhất vào việc runtime đã tải hoặc hàm capture đã được gọi.
7. Người dùng paste vào Figma.

Quyền clipboard và yêu cầu thao tác trực tiếp của người dùng phải được kiểm chứng với iframe khác origin. Nếu trình duyệt không cho luồng nút ngoài iframe ghi clipboard, dùng thao tác Copy trong vùng preview hoặc cửa sổ preview riêng, kèm chỉ dẫn ngắn. Không hạ mức cách ly để giải quyết lỗi clipboard.

Capture phải giữ trạng thái giao diện đang chạy, không render lại bản HTML ban đầu để xuất. Không tự đọc clipboard của người dùng, không tự ghi clipboard lúc tải trang hoặc lúc Run.

## Kiểm chứng trước khi xây đầy đủ

Làm thử luồng tối thiểu từ một tài liệu có text, box, ảnh và nút đổi text bằng JS đến clipboard trong kiến trúc preview khác origin. Kiểm tra trạng thái sau tương tác được giữ nguyên.

Paste vào một file Figma thử nghiệm do người dùng cung cấp hoặc cho phép chỉnh sửa. Kiểm tra text sửa được, layer tách riêng, ảnh có mặt, kích thước và bố cục phù hợp. Nếu chưa có quyền truy cập Figma để thử, ghi rõ phần kiểm chứng còn thiếu; không tuyên bố chuyển đổi đã hoạt động từ đầu đến cuối.

Nếu runtime không dùng được trong luồng này, báo kết quả và đề xuất lại kiến trúc trước khi làm đầy đủ editor. Không âm thầm thay kết quả bằng ảnh chụp hoặc yêu cầu plugin.

Sau khi luồng tối thiểu đạt yêu cầu, triển khai editor và kiểm tra:

- HTML hoàn chỉnh và fragment, CSS riêng, JS riêng; chạy lại và đổi kích thước.
- Capture sau khi JS cập nhật giao diện.
- Font/ảnh tải chậm hoặc lỗi, runtime Figma tải lỗi, clipboard bị từ chối.
- Nhiều lần Run/Copy liên tiếp không lẫn phiên hoặc giữ thông báo thành công cũ.
- Mã trong preview không đọc được dữ liệu editor; message từ cửa sổ hoặc origin khác bị bỏ qua.
- Build và typecheck; kiểm thử tập trung vào ghép tài liệu, vòng đời preview và bridge.

## Giới hạn cần thể hiện đúng

Không cam kết giống 100% với mọi CSS, font, canvas/WebGL hoặc media. Chất lượng và khả năng chỉnh sửa của các phần này phải đo bằng kết quả thực tế. JavaScript chỉ xác định trạng thái được capture, không chuyển logic ứng dụng thành logic Figma. Chưa cam kết tự tạo Auto Layout, component, variant hoặc prototype interaction.

## Nguồn khảo sát ngày 2026-09-28

- Tài liệu Figma Code to canvas: https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/
- Runtime đã đọc để kiểm tra sự hiện diện của captureForDesign và thao tác ghi text/html clipboard: https://mcp.figma.com/mcp/html-to-design/capture.js
- Ví dụ tích hợp của cộng đồng, không phải cam kết hỗ trợ từ Figma: https://github.com/Anna-Arteeva/figma-capture-button

Việc đọc tài liệu và mã runtime xác nhận có cơ chế liên quan; chưa thay thế kiểm thử trong trình duyệt và paste thực tế vào Figma.
