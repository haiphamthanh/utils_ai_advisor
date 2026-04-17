# Insight Companion

Insight Companion la mot MVP cho y tuong tro ly hoc tap ca nhan hoa. Ung dung duoc xay bang `Node.js + Express`, co UI web don gian, luu lich su hoc tap cuc bo va mo phong duoc flow:

- nguoi dung hoi cau dau,
- he thong tra loi ngan gon,
- hoi lai muc do hieu,
- neu chua hieu thi giai thich lai,
- neu da hieu thi goi y hoc tiep,
- cap nhat knowledge profile cho lan sau.

UI hien tai duoc thiet ke theo kieu `interactive step view`: khong render toan bo lich su chat lien tuc, ma chi hien buoc hoc hien tai, ket qua confirm va cau hoi de xuat tiep theo.
Trang cung co `provider selector` de chon noi chuyen voi `Gemini` hoac `OpenAI`, kem badge bao ngay provider nao dang `connected` hoac `missing API key`.

## 1. Chay du an

### Yeu cau

- Node.js `22+`
- npm `10+`

### Cai dat

```bash
npm install
```

### Chay local

```bash
npm run dev
```

Mo trinh duyet tai `http://127.0.0.1:3456`.

Hoac chay nhanh bang script:

```bash
./start.sh
```

Neu file `.env` ton tai, `npm run dev`, `npm start` va `./start.sh` se tu dong nap bien moi truong tu file nay.

## 2. Cau hinh

Bien moi truong ho tro:

- `PORT`: cong chay web.
- `HOST`: mac dinh la `127.0.0.1` de chi dung local.
- `LLM_PROVIDER`: provider mac dinh, ho tro `gemini` hoac `openai`.
- `GEMINI_API_KEY`: API key cua Gemini API. Bat buoc neu muon hoi dap.
- `GEMINI_MODEL`: model Gemini dung de tu van. Mac dinh la `gemini-2.5-flash`.
- `OPENAI_API_KEY`: API key cua OpenAI API.
- `OPENAI_MODEL`: model OpenAI dung de tu van. Mac dinh la `gpt-5`.

## 3. Cau truc thu muc

```text
src/
  config/        Bien moi truong va duong dan
  controllers/   Nhan HTTP request, tra HTTP response
  middleware/    Error handling
  models/        Builder cho profile va session
  routes/        API routes
  services/      Orchestration nghiep vu va LLM integration
    modelClients/  Provider clients, hien tai la Gemini API va OpenAI API
  stores/        Luu/nap JSON local
  utils/         Helper nho
public/
  components/    UI components theo tung khu vuc
  services/      API client cho frontend
  state/         Client-side state store nho
docs/
  architecture-report.md
tests/
  insightService.test.js
```

## 4. API chinh

- `POST /api/insight/session`
- `POST /api/insight/ask`
- `POST /api/insight/reflect`
- `GET /api/insight/config`
- `GET /api/insight/dashboard/:userId`
- `GET /api/health`

## 5. Du lieu local

App tao file `storage/learning-data.json` trong repo de luu session, profile va interaction history. File nay la runtime artifact, da duoc ignore trong git. Noi dung tu van khong con lay tu hardcode, ma duoc sinh truc tiep tu provider duoc chon tren UI.

## 6. Kiem thu

```bash
npm test
```

## 7. Tai lieu kien truc

Xem them tai [docs/architecture-report.md](docs/architecture-report.md).
