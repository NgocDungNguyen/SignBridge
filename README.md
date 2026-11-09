# SignBridge

Cầu nối hai chiều cho học sinh Điếc trong cuộc họp trực tuyến (dự thi EdiTech – CreativAI 2026–2027).

| Trang | Việc làm |
|---|---|
| `/` | Trang chủ: **Cuộc họp mới** (tạo mã phòng) hoặc nhập mã để **Tham gia** |
| `/room/?c=ABC-DEF` | Phòng họp thật giữa nhiều điện thoại |
| `/demo.html` | Demo cố định 4 người mô phỏng (lớp 8B1) |

## Cách dùng với hai điện thoại
1. Điện thoại 1: mở trang chủ → **Cuộc họp mới** → nhập tên → chọn "Không, tôi nghe được" → **Tham gia**.
2. Điện thoại 2: mở trang chủ → nhập mã phòng (hoặc mở liên kết mời) → chọn "Có, tôi cần hỗ trợ" → cho phép camera.
3. Điện thoại 2 làm cử chỉ (xem hướng dẫn trong app, giữ ~1 giây) → câu hiện ra → **Gửi** → điện thoại 1 thấy chữ và nghe đọc.
4. Điện thoại 1 bấm micro hoặc gõ chữ → điện thoại 2 thấy nhân vật ký hiệu.

Chrome (Android/desktop) cho kết quả tốt nhất với micro. Safari vẫn dùng được bằng cách gõ chữ.

## Cách hoạt động
- **Đồng bộ phòng**: MQTT qua WebSocket (broker công cộng HiveMQ → EMQX → Mosquitto, tự chuyển nếu một cái lỗi). Chỉ gửi tên, vai trò và câu chữ. Không có tài khoản, không lưu dữ liệu. Thêm `?broker=wss://...` để đổi broker khi thử nghiệm.
- **Camera**: MediaPipe HandLandmarker chạy ngay trong trình duyệt (tệp nằm ở `vendor/mediapipe`). Video không rời khỏi máy.
- **Cử chỉ → câu (bản demo)**: 8 cử chỉ tay (✋👍👌☝️✌️✊🤙🤟) gắn với 8 câu mẫu trong `assets/core.js` (`PRESETS`). Chưa phải ký hiệu tiếng Việt chuẩn.
- **Giọng nói**: Web Speech API (nhận giọng nói) và SpeechSynthesis (đọc to; tự chọn giọng `vi-VN` hoặc `en-US`).

## Cấu trúc
```
index.html          trang chủ
room/index.html     phòng họp
demo.html           demo 4 người
assets/             app.css, room.css, core.js (nhân vật + từ điển), room.js, net.js, i18n.js, posture.js, hands.js
vendor/             mediapipe (tự lưu trữ), mqtt.js
_headers            cấu hình Cloudflare Pages
```

## Giới hạn đã biết
- Broker công cộng dùng chung, không đảm bảo thời gian hoạt động; để chạy thật nên chuyển sang Cloudflare Worker + Durable Object.
- Nhận diện giọng nói tiếng Việt phụ thuộc trình duyệt và mạng.
- Ký hiệu của nhân vật là ký hiệu mẫu, chưa kiểm chứng với cộng đồng Điếc.
