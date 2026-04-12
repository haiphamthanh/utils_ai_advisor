# Insight Companion

Insight Companion la mot MVP cho y tuong tro ly hoc tap ca nhan hoa. Ung dung duoc xay bang `Node.js + Express`, co UI web don gian, luu lich su hoc tap cuc bo va mo phong duoc flow:

- nguoi dung hoi cau dau,
- he thong tra loi ngan gon,
- hoi lai muc do hieu,
- neu chua hieu thi giai thich lai,
- neu da hieu thi goi y hoc tiep,
- cap nhat knowledge profile cho lan sau.

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

Mo trinh duyet tai `http://localhost:3000`.

Neu muon nap bien tu file `.env`, co the chay:

```bash
cp .env.example .env
node --env-file=.env src/server.js
```

## 2. Cau hinh

Bien moi truong ho tro:

- `PORT`: cong chay web.
- `OPENAI_API_KEY`: neu co, app se goi OpenAI Responses API; neu bo trong, app dung local knowledge base.
- `OPENAI_MODEL`: model dung cho Responses API. Mac dinh la `gpt-5`.

## 3. Cau truc thu muc

```text
src/
  config/        Bien moi truong va duong dan
  controllers/   Nhan HTTP request, tra HTTP response
  data/          Knowledge base de demo
  middleware/    Error handling
  models/        Builder cho profile va session
  routes/        API routes
  services/      Orchestration nghiep vu va LLM integration
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
- `GET /api/insight/dashboard/:userId`
- `GET /api/health`

## 5. Du lieu local

App tao file `storage/learning-data.json` trong repo de luu session, profile va interaction history. File nay la runtime artifact, da duoc ignore trong git.

## 6. Kiem thu

```bash
npm test
```

## 7. Tai lieu kien truc

Xem them tai [docs/architecture-report.md](docs/architecture-report.md).
