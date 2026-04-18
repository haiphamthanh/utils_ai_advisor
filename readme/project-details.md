# Project Details

## Tong quan

Insight Companion la mot MVP cho y tuong tro ly hoc tap ca nhan hoa. Ung dung duoc xay bang `Node.js + Express`, co UI web don gian, luu lich su hoc tap cuc bo va ho tro flow:

- nguoi dung hoi cau dau
- he thong tra loi ngan gon
- hoi lai muc do hieu
- giai thich lai neu chua hieu
- goi y hoc tiep neu da hieu
- cap nhat knowledge profile cho lan sau

UI hien tai duoc thiet ke theo kieu `interactive step view`, tap trung vao buoc hoc hien tai thay vi render toan bo chat log dai.

## Yeu cau moi truong

- Node.js `22+`
- npm `10+`

## Bien moi truong

- `PORT`: cong chay web, mac dinh `3456`
- `HOST`: mac dinh `127.0.0.1` de chi dung local
- `LLM_PROVIDER`: provider mac dinh, ho tro `gemini` hoac `openai`
- `GEMINI_API_KEY`: API key cua Gemini API
- `GEMINI_MODEL`: model Gemini, mac dinh `gemini-2.5-flash`
- `OPENAI_API_KEY`: API key cua OpenAI API
- `OPENAI_MODEL`: model OpenAI, mac dinh `gpt-5`

## Cau truc thu muc

```text
src/
  config/          Bien moi truong va duong dan
  controllers/     Nhan HTTP request, tra HTTP response
  middleware/      Error handling
  models/          Builder cho profile va session
  routes/          API routes
  services/        Business flow va LLM integration
    modelClients/  Provider clients: Gemini va OpenAI
  stores/          Luu/nap JSON local
  utils/           Helper nho
public/
  components/      UI components theo tung khu vuc
  services/        API client cho frontend
  state/           Client-side state nho
readme/
  project-details.md
  architecture-report.md
tests/
  insightService.test.js
```

## API chinh

- `POST /api/insight/session`
- `POST /api/insight/ask`
- `POST /api/insight/reflect`
- `GET /api/insight/config`
- `GET /api/insight/dashboard/:userId`
- `GET /api/health`

## Du lieu local

App tao file `storage/learning-data.json` trong repo de luu:

- session
- learning profile
- interaction history
- ghi chu
- de xuat kien thuc

Noi dung tu van duoc sinh truc tiep tu provider dang chon tren UI, khong con lay tu hardcode.

## Kiem thu

```bash
npm test
```
