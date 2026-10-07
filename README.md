# Academic Continuity System — Found It!

학교 분실물 센터 앱. `DESIGN.md`의 디자인 시스템과 `../_1` ~ `../_5` 목업 화면을
React + TypeScript + Vite + Tailwind로 구현한 것입니다.

## 실행

프론트엔드(React)와 인증 백엔드(Flask) 두 개를 각각 실행해야 합니다. 터미널 두 개를 여세요.

**1. 인증 서버 (Flask)**

```bash
cd server
python -m venv .venv
./.venv/Scripts/activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # GOOGLE_CLIENT_ID, SESSION_SECRET, ADMIN_EMAILS 채우기
python app.py                 # http://127.0.0.1:4000
```

**2. 프론트엔드 (Vite)**

```bash
npm install
cp .env.example .env          # VITE_GOOGLE_CLIENT_ID 채우기
npm run dev                   # http://localhost:5173
npm run build                 # 타입 체크 + 프로덕션 빌드
npm run preview               # 빌드 결과 확인
```

`vite.config.ts`의 `server.proxy`가 `/api/*` 요청을 `http://127.0.0.1:4000`(Flask)으로 넘겨주므로,
브라우저 입장에서는 프론트/백엔드가 같은 오리진으로 보여 세션 쿠키가 문제없이 동작합니다.

Flask는 기본적으로 `127.0.0.1`에만 열리고 디버그 모드도 꺼져 있습니다. 로컬에서
디버거가 필요하면 `server/.env`에 `FLASK_DEBUG=1`을 넣으세요(네트워크에 노출 금지).

## 화면

| 경로 | 화면 | 원본 목업 |
| --- | --- | --- |
| `/` | 홈 — 히어로, 등록/찾기 버튼, 검색, 최근 습득물 그리드 | `_1` |
| `/browse` | 목록 — 검색, 카테고리 칩 필터, 습득물 리스트 | `_2` |
| `/items/:id` | 상세 — 사진, 상태/카테고리 칩, 습득 정보, 수령 신청, (관리자) 관리 패널 | `_3` |
| `/report` | 신고 — 물품명·카테고리·장소·사진·추가 정보 폼 | `_4` |
| `/my-items` | 내 물건 — 신고한 물건 / 수령 신청 탭 | 신규 |
| `/admin` | 관리 — 수령 신청 / 보관중 / 반환완료 탭 (관리자만) | 신규 |
| `/login` | 로그인 | `_5` |

## 구조

```
src/
  components/   AppShell, AppHeader, BottomNav, ItemCard, ItemRow,
                SearchField, CategoryFilter, StatusChip, ItemThumb,
                ClaimDialog, EmptyState, LoadError, Icon, ProtectedRoute
  pages/        Home, Browse, ItemDetail, Report, MyItems, Admin, Login
  store/        AuthProvider — 로그인 상태(/api/me, /api/auth/google, /api/logout)
                ItemsProvider — 습득물 목록 상태 + 신고/수령 신청/관리자 액션
  lib/          categories, format(날짜 표기), filter(검색·정렬), api(백엔드 URL·오류 메시지), image(업로드 전 사진 압축)
vercel.json     Vercel 빌드 설정 + /api → Flask 함수 + SPA 라우팅
api/index.py    Vercel 서버리스 진입점 (server/app.py의 Flask 앱을 그대로 노출)
requirements.txt  Python 의존성 (Vercel이 루트에서 읽음)
server/
  app.py            Flask 서버 — 인증(Google ID 토큰 검증 → 세션 쿠키) + 습득물 API
  db.py             PostgreSQL(DATABASE_URL) / SQLite 스키마 · 마이그레이션 · 커넥션 헬퍼
  items.db          로컬 개발용 SQLite (습득물 + 사진, .gitignore 처리됨, 최초 실행 시 자동 생성)
  requirements.txt  루트 requirements.txt를 그대로 포함
  .env / .env.example
```

## 로그인 (Google OAuth)

**흐름**: 프론트의 `<GoogleLogin>` 버튼(`@react-oauth/google`)이 Google과 통신해
ID 토큰(JWT)을 받아온다 → `AuthProvider.loginWithGoogle`이 그 토큰을
`POST /api/auth/google`로 Flask에 보낸다 → Flask가 `google-auth` 라이브러리로
토큰 서명·발급자·audience(클라이언트 ID)를 검증하고, 이메일 도메인이
`ALLOWED_EMAIL_DOMAINS`에 속하는지 확인한다 → 통과하면 Flask가 자체 세션(JWT)을
서명해 httpOnly 쿠키(`acs_session`)로 내려준다 → 이후 요청은 이 쿠키만으로
`/api/me`가 로그인 사용자(+`isAdmin`)를 돌려준다.

**로그인이 필요한 화면**: `/report`, `/my-items`, `/admin`, 그리고 상세 페이지의
"내 물건 찾기" 수령 신청. `ProtectedRoute`가 미로그인 사용자를 `/login`으로 보내고,
로그인 성공 후 원래 가려던 경로로 돌려보냅니다.

**필수 설정 — Google Cloud Console**: 사용 중인 OAuth 클라이언트 ID의
"승인된 자바스크립트 원본(Authorized JavaScript origins)"에 `http://localhost:5173`과
배포 주소가 등록되어 있어야 로그인 버튼이 동작합니다.

**환경 변수**:
- 프론트 `.env` → `VITE_GOOGLE_CLIENT_ID` (공개 값, 시크릿 아님)
- 서버 `server/.env`
  - `GOOGLE_CLIENT_ID` (프론트와 동일 값)
  - `SESSION_SECRET` (32자 이상 무작위 문자열, 절대 커밋하지 말 것)
  - `FRONTEND_ORIGIN` (프론트 주소, 쉼표로 여러 개)
  - `ADMIN_EMAILS` — 반환완료 처리 권한이 있는 관리자 이메일(쉼표로 여러 개)
  - `ALLOWED_EMAIL_DOMAINS` — 로그인 허용 도메인, 예: `school.ac.kr` (비우면 모든 구글 계정 허용, 관리자 이메일은 항상 허용)
  - `DATABASE_URL` — PostgreSQL 연결 문자열 (배포 시 필수, 로컬은 비우면 SQLite)

## 권한과 수령 흐름

| 상태 | 의미 | 바꿀 수 있는 사람 |
| --- | --- | --- |
| `stored` 보관중 | 분실물 센터에 보관 중 | — |
| `requested` 수령 신청됨 | 누군가 "내 물건 찾기"로 신청함 | 로그인 사용자 누구나 (보관중 → 신청, 본인 신청 취소) |
| `returned` 반환완료 | 담당자가 본인 확인 후 돌려줌 | **관리자(`ADMIN_EMAILS`)만** |

관리자는 상세 페이지의 관리 패널에서 반환완료 처리 / 신청 거절 / 보관중으로 되돌리기 /
게시물 삭제를 할 수 있고, 신고자·신청자 이름과 이메일을 볼 수 있습니다(일반 사용자에게는
내려가지 않음). 관리자 여부는 매 요청마다 서버가 `ADMIN_EMAILS`로 다시 판단하므로, 목록에서
이메일을 빼면 즉시 권한이 사라집니다.

## 습득물 API

- `GET /api/items` — 전체 목록 (공개). 로그인 상태면 `reportedByMe`/`claimedByMe`, 관리자면 `admin` 상세가 함께 내려옵니다.
- `GET /api/items?mine=1` — 내가 신고했거나 신청한 것만 (로그인 필요)
- `GET /api/items/<id>` — 단건 조회 (공개)
- `POST /api/items` — 신고 등록 (로그인 필요, 1시간 10건 제한). `multipart/form-data`로 `name`(≤100자),
  `category`, `location`(≤200자), `description`(선택, ≤1000자), `photo`(선택)를 받습니다.
- `POST /api/items/<id>/claim` — 수령 신청 → `requested` (로그인 필요, 본인 신고 물건 불가)
- `POST /api/items/<id>/claim/cancel` — 내 수령 신청 취소 → `stored`
- `POST /api/items/<id>/status` — **관리자** `{"status": "returned" | "stored"}`
- `DELETE /api/items/<id>` — **관리자** 게시물·사진 삭제
- `GET /api/uploads/<filename>` — 업로드된 사진 (공개)

사진은 파일명·확장자를 믿지 않고 파일 앞부분 바이트로 PNG/JPEG/GIF/WEBP인지 확인한 뒤
`uuid` 파일명으로 DB의 `images` 테이블에 저장합니다. 사진은 3MB로 제한됩니다(`413 file_too_large`).

**보안 장치**: 쓰기 요청은 `Origin` 헤더가 같은 사이트나 `FRONTEND_ORIGIN`이 아니면 거부(CSRF 방지),
모든 응답에 `X-Content-Type-Options: nosniff`, 로그아웃 시 쿠키를 같은 속성으로 삭제.

## 배포 (Vercel + Neon, 전부 무료·카드 불필요)

Vercel 한 곳에 프론트(정적 파일)와 Flask API(Python 서버리스 함수, `api/index.py`)가 함께 올라갑니다.
같은 도메인이라 사파리/iOS의 서드파티 쿠키 차단에 걸리지 않고, 쿠키는 `SameSite=Lax` 그대로 씁니다.

서버리스 함수는 디스크에 저장할 수 없으므로 습득물과 사진은 전부 Neon(무료 PostgreSQL, 0.5GB)에
저장합니다. 사진은 업로드 전에 브라우저에서 1600px JPEG로 줄여서(보통 300KB 안팎, EXIF/GPS 정보 제거)
올라갑니다. 신고·수령 신청 횟수 제한도 메모리가 아니라 DB 기록으로 판단합니다.

**1. DB — Neon**

1. https://neon.tech 가입 → 프로젝트 생성 (리전: AWS US West (Oregon) — `vercel.json`의 함수 리전 `pdx1`과 가까운 곳. 리전을 바꾸면 둘 다 맞추세요)
2. Connect → Connection string(`postgresql://...?sslmode=require`) 복사 — **비밀번호가 들어 있으니 커밋 금지**

**2. Vercel**

1. https://vercel.com → GitHub로 가입 → Add New → Project → 이 저장소 Import
2. Framework Preset은 Vite로 자동 인식, 빌드 설정은 `vercel.json`이 잡습니다
3. Environment Variables (`.env` 내용을 통째로 붙여넣어도 됨):
   - `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID` — 같은 클라이언트 ID
   - `SESSION_SECRET` — 32자 이상 무작위 문자열
   - `DATABASE_URL` — Neon 연결 문자열
   - `ADMIN_EMAILS`, `ALLOWED_EMAIL_DOMAINS`
   - `FRONTEND_ORIGIN`은 필요 없음 — Vercel에서는 같은 도메인 요청을 자동으로 허용합니다
4. Deploy

**3. Google Cloud Console**

승인된 자바스크립트 원본에 Vercel 주소를 추가하세요.

## 디자인 토큰

`tailwind.config.js`의 `colors` / `fontFamily` / `fontSize` / `borderRadius` /
`spacing` / `boxShadow`는 `DESIGN.md` 프론트매터와 1:1로 대응합니다.
디자인이 바뀌면 두 파일을 함께 수정하세요.

- 색: `bg-primary`, `text-on-surface-variant`, `bg-secondary-container` …
- 타이포: 패밀리와 크기가 분리되어 있어 `font-label-md text-label-md`처럼 함께 사용합니다.
- 그림자: `shadow-level1`(카드), `shadow-level1-hover`(호버), `shadow-level2`(모달)
- 모양: 입력·썸네일 `rounded`(8px), 카드·컨테이너 `rounded-lg`(16px), 상태 칩 `rounded-full`
