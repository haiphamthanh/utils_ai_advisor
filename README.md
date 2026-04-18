# Insight Companion

## Cách sử dụng

1. Lấy Gemini API key tại: https://aistudio.google.com/api-keys?project=gen-lang-client-0288716692
2. Tạo file `.env` từ `.env.example`.
   `./start.sh` sẽ tự copy `.env.example` sang `.env` nếu repo chưa có `.env`.
3. Mở `.env` và điền key vào biến `GEMINI_API_KEY=...`
4. Chạy đúng một lệnh:

```bash
./start.sh
```

App sẽ chạy local tại `http://127.0.0.1:3456`.

## Tài liệu chi tiết

- Tổng quan dự án: [readme/project-details.md](readme/project-details.md)
- Kiến trúc hệ thống: [readme/architecture-report.md](readme/architecture-report.md)
