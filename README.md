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
cp .env.example .env          # GOOGLE_CLIENT_ID, SESSION_SECRET 채우기
python app.py                 # http://localhost:4000
```

**2. 프론트엔드 (Vite)**

```bash
npm install
cp .env.example .env          # VITE_GOOGLE_CLIENT_ID 채우기
npm run dev                   # http://localhost:5173
npm run build                 # 타입 체크 + 프로덕션 빌드
npm run preview               # 빌드 결과 확인
```

`vite.config.ts`의 `server.proxy`가 `/api/*` 요청을 `http://localhost:4000`(Flask)으로 넘겨주므로,
브라우저 입장에서는 프론트/백엔드가 같은 오리진으로 보여 세션 쿠키가 문제없이 동작합니다.

## 화면

| 경로 | 화면 | 원본 목업 |
| --- | --- | --- |
| `/` | 홈 — 히어로, 등록/찾기 버튼, 검색, 최근 습득물 그리드 | `_1` |
| `/browse` | 목록 — 검색, 카테고리 칩 필터, 습득물 리스트 | `_2` |
| `/items/:id` | 상세 — 사진, 상태/카테고리 칩, 습득 정보, 수령 신청 | `_3` |
| `/report` | 신고 — 물품명·카테고리·장소·사진·추가 정보 폼 | `_4` |
| `/my-items` | 내 신고 내역 — 보관중 / 반환완료 탭 | 신규 |
| `/login` | 로그인 | `_5` |

## 구조

```
src/
  components/   AppShell, AppHeader, BottomNav, ItemCard, ItemRow,
                SearchField, CategoryFilter, StatusChip, ItemThumb,
                ClaimDialog, EmptyState, Icon, ProtectedRoute
  pages/        Home, Browse, ItemDetail, Report, MyItems, Login
  store/        AuthProvider — 로그인 상태(/api/me, /api/auth/google, /api/logout)
                ItemsProvider — 습득물 목록 상태 + localStorage 영속화
  lib/          categories, format(날짜 표기), filter(검색·정렬), api(백엔드 URL 조립)
netlify.toml    Netlify 빌드 설정 + SPA 라우팅 리다이렉트
server/
  app.py            Flask 서버 — 인증(Google ID 토큰 검증 → 세션 쿠키) + 습득물 API
  db.py             SQLite 스키마 · 커넥션 헬퍼
  items.db          습득물 데이터 (SQLite, .gitignore 처리됨, 최초 실행 시 자동 생성)
  uploads/          신고 사진 원본 파일 (.gitignore 처리됨)
  Procfile          배포 시작 명령 (Render 등에서 인식: gunicorn app:app)
  requirements.txt
  .env / .env.example
```

## 로그인 (Google OAuth)

**흐름**: 프론트의 `<GoogleLogin>` 버튼(`@react-oauth/google`)이 Google과 통신해
ID 토큰(JWT)을 받아온다 → `AuthProvider.loginWithGoogle`이 그 토큰을
`POST /api/auth/google`로 Flask에 보낸다 → Flask가 `google-auth` 라이브러리로
토큰 서명·발급자·audience(클라이언트 ID)를 검증한다 → 검증에 성공하면 Flask가
자체 세션(JWT)을 서명해 httpOnly 쿠키(`acs_session`)로 내려준다 → 이후 요청은
이 쿠키만으로 `/api/me`가 로그인 사용자를 돌려준다. 브라우저는 구글 ID 토큰을
직접 들고 있지 않고, Flask가 검증한 결과만 신뢰한다.

**로그인이 필요한 화면**: `/report`(습득물 신고), `/my-items`(내 신고 내역),
그리고 상세 페이지의 "내 물건 찾기" 수령 신청. `ProtectedRoute`가 미로그인
사용자를 `/login`으로 보내고, 로그인 성공 후 원래 가려던 경로로 돌려보냅니다.

**필수 설정 — Google Cloud Console**: 사용 중인 OAuth 클라이언트 ID의
"승인된 자바스크립트 원본(Authorized JavaScript origins)"에 `http://localhost:5173`이
등록되어 있어야 로그인 버튼이 동작합니다. 없으면 `redirect_uri_mismatch` /
origin 오류가 발생합니다.

**환경 변수**:
- 프론트 `.env` → `VITE_GOOGLE_CLIENT_ID` (공개 값, 시크릿 아님)
- 서버 `server/.env` → `GOOGLE_CLIENT_ID`(동일 값), `SESSION_SECRET`(무작위 문자열,
  절대 커밋하지 말 것), `FRONTEND_ORIGIN`, `PORT`

두 `.env` 모두 `.gitignore`에 포함되어 있고, `.env.example`에 채워야 할 키만
남겨두었습니다.

## 습득물 데이터 (서버 저장)

신고/목록 조회/수령 신청이 전부 Flask API를 통해 SQLite(`server/items.db`)에
저장됩니다. 로그인한 사용자라면 어떤 브라우저·기기로 접속해도 같은 목록을 봅니다.

- `GET /api/items` — 전체 목록 (공개). 로그인 상태면 각 항목에 내가 신고했는지(`reportedByMe`)가 함께 내려옵니다.
- `GET /api/items?mine=1` — 내가 신고한 것만 (로그인 필요)
- `GET /api/items/<id>` — 단건 조회 (공개)
- `POST /api/items` — 신고 등록 (로그인 필요). `multipart/form-data`로 `name`, `category`,
  `location`, `description`(선택), `photo`(선택, 이미지 파일)를 받습니다.
- `POST /api/items/<id>/claim` — 수령 신청 → 상태를 `반환완료`로 변경 (로그인 필요)
- `GET /api/uploads/<filename>` — 업로드된 사진 원본 (공개)

사진은 서버의 `server/uploads/`에 `uuid` 파일명으로 저장되고, DB에는 파일명만
남습니다. 원본 파일명은 버리고 확장자(`.png/.jpg/.jpeg/.gif/.webp`)만 검사한
뒤 저장하며, 요청 크기는 8MB로 제한됩니다(그 이상은 `413 file_too_large`).

## 외부 호스팅 (Render + Netlify)

데모/테스트 용도로 가장 간단한 조합입니다. 둘 다 무료 티어로 시작할 수 있고,
GitHub 저장소만 연결하면 이후 push할 때마다 자동으로 다시 빌드·배포됩니다.
**먼저 이 프로젝트를 GitHub 저장소로 push해두세요.**

> Render 무료 티어는 디스크가 영구적이지 않습니다 — 서비스를 재배포하거나
> 오래 쉬었다 깨어나면 `server/items.db`와 `server/uploads/`가 초기화될 수
> 있습니다. 데모용으로는 괜찮지만, 데이터를 계속 남기고 싶다면 Render의 유료
> Persistent Disk를 추가하거나 S3/Cloudflare R2 같은 외부 스토리지로 옮겨야
> 합니다.

**1. 백엔드 — Render**

1. [Render](https://render.com)에서 New → Web Service → 이 저장소 선택, 루트 디렉터리를 `server`로 지정
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT` (또는 `server/Procfile`을 그대로 인식)
4. 환경 변수 추가:
   - `GOOGLE_CLIENT_ID` — 쓰고 있는 클라이언트 ID
   - `SESSION_SECRET` — 무작위 문자열 (로컬 `.env`와 다른 값 권장)
   - `FRONTEND_ORIGIN` — 2번에서 나올 Netlify 주소, 예: `https://found-it.netlify.app`
   - `FLASK_ENV` = `production`
   - `SESSION_COOKIE_SAMESITE` = `None` (프론트/백엔드가 다른 도메인이라 필수)
5. 배포되면 나오는 주소를 기억해두세요, 예: `https://found-it-api.onrender.com`

**2. 프론트엔드 — Netlify**

1. [Netlify](https://app.netlify.com)에서 Add new site → Import an existing project →
   GitHub → 이 저장소 선택
2. Base directory: `academic_continuity_system` (저장소 루트에 이 폴더와 `server/`가
   함께 있는 구조라면 반드시 지정해야 합니다)
3. Build command / Publish directory는 저장소에 포함된 `netlify.toml`이 자동으로
   잡아줍니다 (`npm run build` / `dist`). 이 파일에는 React Router용 SPA 리다이렉트
   설정도 같이 들어있어서, `/browse`나 `/items/:id`를 새로고침해도 404가 나지 않습니다.
4. Site settings → Environment variables에 추가:
   - `VITE_GOOGLE_CLIENT_ID` — 쓰고 있는 클라이언트 ID
   - `VITE_API_BASE_URL` — 1번에서 나온 Render 주소, 예: `https://found-it-api.onrender.com`
5. 배포되면 나오는 주소(예: `https://found-it.netlify.app`)를 Render의
   `FRONTEND_ORIGIN`에 반영 (순환 참조이므로 둘 다 배포한 뒤 서로의 주소로
   환경 변수를 채워 넣고 한 번씩 재배포하면 됩니다)

**3. Google Cloud Console**

승인된 자바스크립트 원본에 배포된 Netlify 주소(`https://found-it.netlify.app`)를
추가하세요. `http://localhost:5173`은 로컬 개발용으로 그대로 남겨둬도 됩니다.

**로컬 개발은 그대로 동작합니다** — `VITE_API_BASE_URL`을 비워두면(`.env`
기본값) Vite의 `/api` 프록시가 계속 쓰이므로, 이 배포 설정과 무관하게
`npm run dev` + `python app.py` 조합이 그대로 유지됩니다.

**Git 연동 없이 바로 올려보고 싶다면**: Netlify Drop(app.netlify.com/drop)이나
Vercel의 "Drag & Drop" 페이지에 로컬에서 `npm run build`로 만든 `dist` 폴더를
끌어다 놓으면 즉시 배포됩니다. 다만 이 경우 코드를 고칠 때마다 다시 빌드해서
수동으로 올려야 하고(자동 재배포 없음), 환경 변수(`VITE_GOOGLE_CLIENT_ID`,
`VITE_API_BASE_URL`)는 올리기 전에 로컬 `.env`에 미리 설정해 둔 값으로 빌드에
그대로 박혀 들어갑니다.

## 디자인 토큰

`tailwind.config.js`의 `colors` / `fontFamily` / `fontSize` / `borderRadius` /
`spacing` / `boxShadow`는 `DESIGN.md` 프론트매터와 1:1로 대응합니다.
디자인이 바뀌면 두 파일을 함께 수정하세요.

- 색: `bg-primary`, `text-on-surface-variant`, `bg-secondary-container` …
- 타이포: 패밀리와 크기가 분리되어 있어 `font-label-md text-label-md`처럼 함께 사용합니다.
- 그림자: `shadow-level1`(카드), `shadow-level1-hover`(호버), `shadow-level2`(모달)
- 모양: 입력·썸네일 `rounded`(8px), 카드·컨테이너 `rounded-lg`(16px), 상태 칩 `rounded-full`

## 동작 방식 메모

- 습득물 데이터는 `ItemsProvider`가 Flask API(`/api/items`)로 읽고 쓰며,
  실제 저장은 `server/items.db`(SQLite)에서 이루어집니다. `localStorage`는
  더 이상 쓰지 않습니다. 서버를 새로 띄우면(=`items.db`가 없으면) 빈 목록으로
  시작하고, 샘플/데모 습득물은 들어있지 않습니다.
- 첨부 사진은 신고 제출 시 실제 서버 업로드(`multipart/form-data`)로 전송되어
  `server/uploads/`에 저장됩니다. 미리보기(`URL.createObjectURL`)는 그 파일을
  서버에 올리기 전 화면에 보여주는 용도일 뿐이고, 실제 데이터는 서버 응답의
  `imageUrl`(`/api/uploads/<파일명>`)을 씁니다.
- 로그인은 Google 공식 버튼(`@react-oauth/google`)을 그대로 사용합니다. 원본
  목업의 Google 계정 화면을 흉내 낸 커스텀 UI는 실제 OAuth 버튼으로 교체했습니다.
- 세션은 Flask가 서명한 JWT를 담은 httpOnly 쿠키 하나로 관리합니다. 별도 DB나
  세션 스토어는 없어서 서버를 재시작해도 `SESSION_SECRET`이 같으면 기존 쿠키가
  유효합니다. 사용자 정보(sub/email/name/picture)는 항상 최신 Google 프로필을
  다시 검증한 값이며 별도로 저장하지 않습니다.
