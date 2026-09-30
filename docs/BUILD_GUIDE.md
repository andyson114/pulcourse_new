# 제작 가이드

이 문서는 '지구를 지키는 점심 선택'이 어떻게 만들어져 있는지 설명합니다. 다른 사람이 이 앱을 다시 만들거나 자기 식당에 맞게 고칠 때 필요한 순서도 함께 적었습니다.

- 계산 데이터의 형식은 [데이터 설명서](DATA.md)에 따로 정리했습니다.
- 계산 순서와 식은 [계산 방법](METHODOLOGY.md)에 있습니다.
- 앱 소개와 화면 흐름은 [README](../README.md)에 있습니다.

준비물은 다음과 같습니다.

- Python 3. 도구(`tools/*.py`)는 표준 라이브러리만 씁니다.
- 텍스트 편집기와 최신 브라우저.
- git(선택). 저장소를 내려받을 때 씁니다.
- Node.js(선택). 고친 코드에 문법 오류가 없는지 확인할 때 씁니다.
- 글꼴을 확인할 때만 `fonttools`와 `brotli` 패키지가 필요합니다.

> 계산 데이터 전체는 별도 파일(`payload.json`)로 올리지 않았습니다. 앱을 다시 묶을 때는 자기 데이터를 씁니다([5장](#5-내-식당-데이터로-만들기)). 무엇을 공개했고 무엇을 다시 쓸 수 있는지는 [7-5](#7-5-공개-범위와-라이선스)에 정리했습니다.

---

## 1. 한눈에 보는 구조

### 1-1. 파일 하나로 된 앱

- `index.html` 파일 하나에 화면, 스타일, 코드, 계산 데이터, 글꼴, 이미지가 모두 들어 있습니다.
- 페이지를 연 뒤에는 외부로 요청을 보내지 않습니다. 코드 안의 인터넷 주소는 출처 링크뿐입니다.
- 그래서 정적 파일을 올릴 수 있는 곳이면 어디서든 동작합니다.
- 크기는 약 3.07MB입니다.

### 1-2. 파일 안의 순서

`index.html`은 위에서부터 아래 순서로 되어 있습니다. `src/build/shell.html`을 열면 같은 순서를 볼 수 있습니다. 큰 덩어리는 `@@이름@@` 표시로 비워 두었습니다.

```
index.html
├─ 머리 주석                       주소 매개변수 사용법
├─ <head>
│  ├─ 글꼴 3개                     <script type="text/plain" id="f500" / "f700" / "f900">  base64 woff2
│  ├─ 글꼴 로더                    <script>  글꼴을 풀어 FontFace로 등록
│  └─ CSS
│     ├─ <style>                   본 스타일(교육 모듈·대시보드). 한 줄로 줄여 둠
│     ├─ <style id="role-hub">     첫 화면·한 달 식단 스타일
│     └─ <style id="road-motion-fix">, "restaurant-layout", "mobile-fixes"   화면 보정
└─ <body class="s-intro blur dim rh-still">
   ├─ 모바일 판정 <script>         첫 그리기 전에 body에 mobile 클래스를 붙임
   ├─ 숨긴 <svg>의 <symbol>        기업 CI(로고)
   ├─ #viewport > #stage           데스크톱 식당 장면(#bg, 메뉴 정보, 식판, 그릇, 생각 풍선)
   ├─ #mob, #msheet                모바일 식당 장면과 바텀시트
   ├─ #roleHub                     사용 목적 선택(첫 화면)
   ├─ header.hud, 패널 5개         #pIntro, #pBeef, #pStory, #pResult, #pClose (교육 모듈)
   ├─ #dash                        대시보드(탭 버튼 6개, pane-detail·compare·sim·method)
   ├─ <script type="text/plain" id="restaurant-svg">   식당 배경 SVG 조각
   ├─ <script type="text/plain" id="payload">          계산 데이터(JSON) gzip + base64
   ├─ <script type="text/plain" id="code">             앱 코드(JS) gzip + base64
   ├─ <script id="role-hub-js">    첫 화면 스크립트
   └─ 시작 스크립트                데이터·코드 풀기 → 코드 실행 → RoleHub.init()
```

`type="text/plain"`인 `<script>`는 브라우저가 실행하지 않습니다. 글꼴, 데이터, 코드, 배경 그림을 글자로 담아 두는 상자로 씁니다.

### 1-3. 페이지가 열리는 순서

1. 글꼴 로더가 base64 글꼴 3개를 풀어 `Noto Sans KR`이라는 이름으로 등록합니다.
2. `<body>` 첫 스크립트가 화면 크기를 보고 `body.mobile`을 붙입니다. 데이터를 푸는 동안 데스크톱 배치가 먼저 보였다가 바뀌는 일을 막기 위해서입니다.
3. 마크업이 그려집니다. 첫 화면(`#roleHub`)이 맨 위에 떠 있습니다.
4. `role-hub-js`가 바로 실행되어 첫 화면의 클릭을 받을 준비를 합니다. 앱 코드가 준비되기 전에 카드를 누르면 그 선택을 기억해 두었다가 7단계에서 처리합니다.
5. 시작 스크립트가 `payload`와 `code` 블록을 `DecompressionStream("gzip")`으로 풉니다.
6. 데이터는 `window.PAYLOAD`에 두고, 코드는 `new Function(code)()`로 실행합니다. 코드는 engine → dash → app 순서로 실행됩니다.
7. 마지막으로 `RoleHub.init()`이 첫 화면을 활성화합니다.

시작 스크립트는 다음과 같습니다(오류 안내 부분은 줄였습니다).

```js
(async function () {
  let P, code;
  try {
    if (typeof DecompressionStream === "undefined") throw new Error("DecompressionStream 없음");
    const inflate = async id => {
      const bin = Uint8Array.from(atob(document.getElementById(id).textContent.trim()), c => c.charCodeAt(0));
      return new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    };
    const [json, js] = await Promise.all([inflate("payload"), inflate("code")]);
    P = JSON.parse(json); code = js;
  } catch (e) {
    // 화면 전체에 "이 페이지는 최신 브라우저에서 열어 주세요" 안내를 띄우고 멈춤
    return;
  }
  window.PAYLOAD = P;
  new Function(code)();               // engine → window.Engine, dash → window.Dash, app → 교육 모듈 시작
  window.RoleHub && RoleHub.init();   // 사용 목적 선택 화면 활성화
})();
```

### 1-4. 앱 코드의 세 부분

`app.bundle.js`는 세 부분을 이어 붙여 줄인(minify) 코드입니다.

| 부분 | 전역 이름 | 하는 일 | 읽기용 사본 |
|---|---|---|---|
| engine | `window.Engine` | 메뉴 이름 해석 → 레시피·분량 → 배출계수 → 1인분 CO₂e | `src/readable/engine.js` |
| dash | `window.Dash` | 대시보드 탭(메뉴별 비교, 메뉴 바꾸기 비교, 시뮬레이터, 계산 방법) | `src/readable/dash.js` |
| app | 없음(두 메뉴 이름만 `window.LUNCH_MENU`에 남기고 dash가 읽음) | 교육 모듈(입장 → 고르기 → 이야기 → 결과 → 다짐) | `src/readable/app.js` |

- 식당 배경 그림은 app 코드가 `restaurant-svg` 블록의 내용을 `#bg`에 넣고, 그 위에 메뉴판(오늘의 메뉴, 두 메뉴 이름)을 코드로 그립니다.
- 기본 메뉴(소고기국밥, 시래기국)의 그릇 그림 2개는 `assets/`가 아니라 `app.bundle.js` 안에 data URI로 들어 있습니다. 다른 메뉴는 코드가 그릇을 그립니다.

### 1-5. 첫 화면(사용 목적 선택)과 연결 지점

첫 화면은 원래 앱(교육 모듈 + 대시보드 4개 탭) 위에 덧붙인 층입니다. 원래 코드는 거의 그대로 두고, 아래 연결 지점만 더했습니다.

목적별 구성은 `rolehub.js`의 `ROLES`에 있습니다.

| 목적 | `data-role` | 고르면 여는 화면 | 대시보드 탭(순서대로) | 조절 막대 시작값 |
|---|---|---|---|---|
| 식단 설계(영양사용) | `nutri` | 대시보드 | 메뉴 교환 · 한 달 식단 · 메뉴별 CO₂e 비교 · 어떻게 계산하나요? | 지금 식단 그대로(모든 막대 기본값) |
| 성과 관리(기업·운영사용) | `corp` | 대시보드 | 한 달 식단 · 대시보드 · 메뉴별 CO₂e 비교 · 어떻게 계산하나요? | 지금 식단 그대로 |
| 환경 교육(이용자용) | `user` | 교육 모듈(입장부터) | 메뉴별 CO₂e 비교 · 우리 식당 시뮬레이터 · 어떻게 계산하나요? | 원래 예시 설정(소고기 메뉴 −50%, 고기 없는 날 주 1회) |
| 전체 보기 | `all` | 교육 모듈(입장부터) | 메뉴별 CO₂e 비교 · 메뉴 바꾸기 비교 · 우리 식당 시뮬레이터 · 어떻게 계산하나요? | 원래 예시 설정 |

- '한 달 식단'과 '대시보드'는 따로 된 화면이 아닙니다. '우리 식당 시뮬레이터'(`#pane-sim`) 한 화면을 두 가지로 나눠 보여 줍니다. 그래서 조절 막대 설정을 함께 씁니다.
- '메뉴 교환'은 '메뉴 바꾸기 비교' 탭의 식단 설계용 이름입니다.

연결 지점은 다음과 같습니다.

| 연결 지점 | 있는 곳 | 하는 일 |
|---|---|---|
| `window.__tabMap(탭)` | `rolehub.js`에서 정의, dash의 탭 전환 함수 `vt()`가 호출 | 고른 목적에 없는 탭을 맞는 탭으로 바꿉니다 |
| `#dash[data-view]` | dash의 `vt()`가 설정 | `rolehub.css`가 값(`month`, `board`)에 따라 시뮬레이터 화면을 한 달 식단 또는 대시보드로 보여 줍니다 |
| `Dash._sim` | dash가 내보냄 | 한 달 식단 달력이 쓰는 값과 함수입니다. 기준 식단 `R`, 고기 없는 날 식단 `K`, 점심 일수 `Y`, 현재 설정 `tt`, 기본값 `et`, 원래 예시 설정 `st` 등 |
| `window.__onDashClose` | `rolehub.js`에서 정의, dash가 닫힐 때 호출 | 식단 설계·성과 관리에서 대시보드를 닫으면 첫 화면으로 돌아갑니다 |
| `RoleHub.init()` | 시작 스크립트가 호출 | 코드 실행 뒤 첫 화면을 활성화하고, 기다리던 선택을 처리합니다 |

---

## 2. 저장소 폴더 구조

| 경로 | 내용 |
|---|---|
| `index.html` | 배포하는 앱. 모든 조각을 묶은 단일 파일입니다. |
| `README.md` | 앱 소개 |
| `LICENSE` | 코드 라이선스(MIT) |
| `LICENSE-DATA.md` | 데이터·문서 라이선스(CC BY 4.0) |
| `NOTICE.md` | 글꼴, 로고, 데이터 출처 등 제3자 자료와 이용 조건 |
| `docs/BUILD_GUIDE.md` | 이 문서 |
| `docs/DATA.md` | 계산 데이터 설명서 |
| `docs/METHODOLOGY.md` | 계산 방법 설명서 |
| `docs/flow-1-overview.svg` 외 2개 | README에 쓰는 흐름도(목적 선택, 교육 흐름, 계산 방식) |
| `src/build/shell.html` | 앱의 뼈대. 본 CSS, 마크업, 글꼴 로더, 시작 스크립트가 들어 있습니다. |
| `src/build/app.bundle.js` | 앱 코드(engine + dash + app). `pack.py`가 이 파일을 읽어 묶습니다. |
| `src/build/rolehub.css`, `rolehub.js` | 첫 화면(사용 목적 선택)과 한 달 식단 달력 |
| `src/build/restaurant.svg` | 식당 배경 그림(SVG 조각) |
| `src/build/fonts/` | `f500.woff2`, `f700.woff2`, `f900.woff2`(Noto Sans KR 부분 글꼴)와 글꼴 라이선스 전문 `OFL.txt` |
| `src/build/assets/` | 로고, 식판, 이야기 장면 그림 등 이미지 7개 |
| `src/build/manifest.json` | 풀 때 기록한 조각 목록과 SHA-256 |
| `src/readable/` | `engine.js`, `dash.js`, `app.js`. 코드를 읽기 좋게 정리한 사본입니다. **빌드에는 쓰지 않습니다.** |
| `tools/unpack.py` | `index.html`을 조각으로 풉니다. |
| `tools/pack.py` | 조각을 다시 `index.html`로 묶습니다. |
| `tools/verify.py` | 두 `index.html`의 내용이 같은지 조각별로 비교합니다. |
| `tools/export_public_data.py` | 계산 데이터에서 공개할 수 있는 부분만 `data/`로 내보냅니다. |
| `data/` | 공개 데이터(배출계수, 파라미터, 출처, 메뉴 이름 사전). 배출계수·파라미터·출처는 JSON과 CSV 두 가지로 있고, 파일 목록은 `MANIFEST.json`에 있습니다. [데이터 설명서](DATA.md) 참고 |

---

## 3. 풀기·고치기·다시 묶기

### 3-1. 조각과 표시

`src/build/`에는 `index.html`을 푼 조각이 들어 있습니다. `shell.html` 안의 표시 자리에 각 조각이 들어갑니다.

| 조각 | `shell.html` 안의 표시 | 내용 | 저장소 |
|---|---|---|---|
| `shell.html` | (뼈대) | 본 CSS, 마크업, 글꼴 로더, 시작 스크립트 | 있음 |
| `app.bundle.js` | `@@CODE@@` | 앱 코드. gzip + base64로 들어갑니다. | 있음 |
| `payload.json` | `@@PAYLOAD@@` | 계산 데이터 전체. gzip + base64로 들어갑니다. | **없음**([7-5](#7-5-공개-범위와-라이선스)) |
| `rolehub.css` | `@@ROLEHUB_CSS@@` | 첫 화면·한 달 식단 스타일 | 있음 |
| `rolehub.js` | `@@ROLEHUB_JS@@` | 첫 화면·한 달 식단 스크립트 | 있음 |
| `restaurant.svg` | `@@RESTAURANT_SVG@@` | 식당 배경 그림 | 있음 |
| `fonts/f500.woff2` 등 | `@@F500@@`, `@@F700@@`, `@@F900@@` | 글꼴. base64로 들어갑니다. | 있음 |
| `assets/*` | `@@ASSET:assets/파일이름\|MIME@@` | 이미지. data URI로 들어갑니다. | 있음 |
| `manifest.json` | (없음) | 풀 때 남긴 기록. `pack.py`는 읽지 않습니다. | 있음 |

`pack.py`는 표시마다 정확히 한 번 나오는지 확인합니다. 이미지 표시(`@@ASSET:…@@`)는 여러 번 나와도 됩니다. 채우지 못한 표시가 남으면 멈추고 알려 줍니다.

### 3-2. 다시 묶기

```bash
git clone https://github.com/andyson114/pulcourse_new.git
cd pulcourse_new

# src/build/ 안의 조각을 고친 뒤
python3 tools/pack.py src/build index.html --payload my_payload.json
```

- 성공하면 `[pack] src/build → index.html  (3.07MB)`처럼 크기를 알려 줍니다.
- `--payload`를 빼면 `src/build/payload.json`을 찾습니다. 저장소에는 이 파일이 없으므로 `FileNotFoundError`가 나고 멈춥니다.
- `my_payload.json`을 만드는 방법은 [5장](#5-내-식당-데이터로-만들기)에 있습니다.
- 압축은 gzip 최대 압축에 시각 정보를 0으로 둡니다. 같은 조각을 같은 Python 환경에서 묶으면 같은 파일이 나옵니다. 환경이 다르면 압축 바이트가 달라질 수 있으니, 내용이 같은지는 `verify.py`로 확인합니다([3-3](#3-3-비교로-확인하기)).
- 제작에 쓴 컴퓨터에서는 `src/build/`의 조각과 원래 데이터로 묶은 파일이 배포된 `index.html`과 바이트 단위로 같았습니다.

### 3-3. 비교로 확인하기

`verify.py`는 두 파일을 각각 풀어서 조각별로 비교합니다. gzip 바이트가 아니라 압축을 푼 내용을 비교합니다.

```bash
python3 tools/verify.py before.html index.html
```

먼저 두 파일을 푼 기록이 한 줄씩 나옵니다.

```
[unpack] before.html → /…/verify-xxxxxxxx  (조각 16개, 이미지 7개)
[unpack] index.html → /…/verify-xxxxxxxx  (조각 16개, 이미지 7개)
```

그다음 결과가 한 줄 나옵니다.

| 경우 | 마지막 줄 | 종료 코드 |
|---|---|---|
| 같을 때 | `[verify] 같음 — 조각 16개 모두 일치` | 0 |
| 다를 때 | `[verify] 다른 조각: app.bundle.js` (다른 조각 이름을 모두 적음) | 1 |

`payload.json`도 비교 대상입니다. 그래서 저장소의 `index.html`과 자기 데이터로 묶은 파일을 비교하면 항상 `payload.json`이 다르다고 나옵니다. 고친 부분만 바뀌었는지 보려면 이렇게 합니다.

1. 아무것도 고치지 않은 상태에서 자기 데이터로 묶습니다.
   ```bash
   python3 tools/pack.py src/build before.html --payload my_payload.json
   ```
2. 조각을 고친 뒤 다시 묶습니다.
   ```bash
   python3 tools/pack.py src/build index.html --payload my_payload.json
   ```
3. 두 파일을 비교합니다. 고친 조각 이름만 나오면 됩니다.
   ```bash
   python3 tools/verify.py before.html index.html
   ```

`verify.py`는 비교하려고 푼 조각을 임시 폴더(`verify-`로 시작하는 폴더)에 풀었다가, 비교가 끝나면 바로 지웁니다. 그 안에는 `payload.json`도 들어 있기 때문입니다.

### 3-4. index.html 다시 풀기

직접 묶은 `index.html`을 다시 조각으로 나눌 때 씁니다.

```bash
python3 tools/unpack.py index.html work/
# [unpack] index.html → work/  (조각 16개, 이미지 7개)
```

- 이미지 파일 이름은 이미지 내용의 SHA-256 앞 10글자입니다. 같은 이미지는 한 파일로 모읍니다.
- 풀면 묶을 때 넣은 계산 데이터가 `payload.json`으로 함께 생깁니다.
- 이 파일을 실수로 저장소에 올리지 않도록 저장소의 `.gitignore`가 `payload.json`, 이름에 `payload`가 들어간 JSON, `work/`·`build/` 폴더를 올리지 않게 막아 둡니다(`data/`와 `src/build/`는 예외).

### 3-5. app.bundle.js 고치는 요령

- `app.bundle.js`는 줄인 코드라 첫 줄 하나가 50만 자가 넘습니다. 편집기의 찾기 기능으로 고칠 곳을 찾습니다.
- 먼저 `src/readable/`의 사본에서 고칠 곳을 읽습니다. 사본은 prettier로 줄바꿈과 띄어쓰기를 넣고, 맨 위에 설명 주석을 단 것입니다.
- 변수 이름(`R`, `K`, `Y` 등)과 문자열 내용은 같지만, 공백과 괄호가 달라 사본의 코드 조각을 그대로 검색하면 찾지 못합니다. 문자열 안의 글자(예: `예시 4주(20끼) 점심을`)나 공백 없는 짧은 조각(예: `const R=[`)으로 `app.bundle.js`를 검색합니다.
- 실제 수정은 `app.bundle.js`에 합니다. `pack.py`는 읽기용 사본을 쓰지 않습니다.
- 읽기용 사본을 이어 붙여 `app.bundle.js` 대신 쓰면 안 됩니다. `app.js` 사본에는 그릇 그림 2개가 자리표시 글자로 바뀌어 있습니다.
- 고친 뒤에는 문법 오류가 없는지 확인합니다(Node.js 필요).
  ```bash
  node --check src/build/app.bundle.js
  ```
- `app.bundle.js`를 고치면 읽기용 사본과 달라집니다. 사본을 다시 맞추는 도구는 저장소에 없습니다.

---

## 4. 자주 하는 수정

### 4-1. 교육 모듈의 두 메뉴 바꾸기

다시 묶지 않아도 됩니다. 주소 뒤에 매개변수를 붙입니다.

```
https://andyson114.github.io/pulcourse_new/?a=김치볶음밥&b=순두부찌개&d=9월%2021일
```

| 매개변수 | 뜻 |
|---|---|
| `a`, `b` | 메뉴 이름 두 개. 순서는 상관없습니다. CO₂e가 높은 쪽이 첫 번째 메뉴가 됩니다. |
| `d` | 입장 화면에 보일 날짜 문구(선택). 알아본 메뉴가 하나 이상일 때 '오늘의 메뉴 · 날짜'로 보입니다. |

- 엔진이 알아보지 못한 이름은 버리고, 브라우저 콘솔에 경고를 한 줄 남깁니다.
- 알아본 메뉴가 하나뿐이면 나머지 하나는 기본 메뉴로 채웁니다. 하나도 없으면 기본 메뉴(소고기국밥, 시래기국)로 엽니다.
- 소 사육 장면은 첫 번째 메뉴의 소고기 비중이 50% 이상일 때만 나옵니다.
- 메뉴판의 메뉴 이름은 굵은 글씨(700)로 그립니다. 굵은 글꼴에 없는 글자는 보통 굵기로 보일 수 있습니다([7-1](#7-1-글꼴은-부분-글꼴입니다)).

기본 메뉴 자체를 코드에서 바꾸려면 `app.bundle.js`의 `const f=["소고기국밥","시래기국"]`를 고칩니다. 대부분은 주소 매개변수로 충분합니다. 코드에서 바꿀 때는 아래 곳도 함께 봅니다. 모두 `app.bundle.js`에서 검색합니다.

| 검색할 글자 | 부분 | 하는 일 |
|---|---|---|
| `"소고기국밥"===nm`, `"시래기국"===nm` | app, 함수 `j()` | 이름이 같을 때만 전용 그릇 그림을 씁니다. 새 메뉴는 코드가 그린 그릇으로 보입니다. |
| `고기 대신 시래기를 넣어서` | app, 식당 장면의 메뉴 정보(`#loWhy`) | 두 메뉴가 `f`와 같을 때 붙는 문구입니다. `f`를 바꾸면 새 메뉴에도 이 문구가 붙으므로 함께 고칩니다. |
| `window.LUNCH_MENU\|\|{hi:"소고기국밥",lo:"시래기국"}` | dash, 계산 방법 탭 | 교육 모듈이 정한 두 메뉴가 없을 때 쓰는 기본값입니다. |
| `const _={A:"소고기국밥",B:"시래기국"}`, `j={A:"소고기국밥",B:"시래기국"}` | dash, 메뉴별 비교·메뉴 바꾸기 비교 | 비교 탭의 처음 두 메뉴입니다. 교육 모듈이 정한 두 메뉴가 있으면 그 값으로 바뀝니다. |

아래 곳은 `f`와 상관없이 '소고기국밥'을 기준 예로 씁니다. 자기 데이터에서 이 메뉴를 계산할 수 없거나 다른 예를 쓰고 싶으면 함께 고칩니다.

| 검색할 글자 | 나오는 곳 |
|---|---|
| `const T=[[` | 메뉴 바꾸기 비교의 예시 짝 버튼 |
| `소고기국밥으로 치면` | 시뮬레이터 결과의 환산('소고기국밥으로 치면 N그릇') |
| `소고기국밥 → 소고기 · 국밥` | 계산 방법 탭의 '한눈에 보기' |
| `소고기국밥은 1인분` | 계산 방법 탭의 환산 설명 |

### 4-2. 한 달 식단의 예시 4주 바꾸기

'한 달 식단'과 시뮬레이터가 쓰는 기준 식단은 dash 코드 안에 있습니다.

- 읽을 곳: `src/readable/dash.js`의 `const R = [` (현재 405번째 줄 근처)
- 고칠 곳: `src/build/app.bundle.js`에서 `const R=[["11/2(월)"`을 검색합니다.

한 줄은 `["날짜 표시", "메뉴, 메뉴, 메뉴"]` 형식입니다. 메뉴는 쉼표로 나눕니다.

```js
const R=[["11/2(월)","쌀밥, 소고기무국, 제육볶음, 콩나물무침, 배추김치"],["11/3(화)","혼합잡곡밥, 근대된장국, 소불고기, 시금치나물, 깍두기"], ... ]
```

바꿀 때 지킬 것은 다음과 같습니다.

1. 첫 줄은 월요일이어야 하고, 그 뒤로 월~금이 빈 날 없이 이어져야 합니다.
   - 달력의 요일 칸은 줄 순서로 정합니다(`rolehub.js`의 `const wd = i % 5`). 고기 없는 날을 고르는 요일(`VEG_DAYS`)도 이 순서를 따릅니다.
   - 날짜 표시 글자(예: `11/4(수)`)는 칸에 보이기만 하고 요일을 정하는 데는 쓰지 않습니다.
   - 공휴일로 하루를 빼면 그 뒤 칸이 한 칸씩 밀립니다.
2. 날짜 수는 5의 배수로 맞춥니다. 달력은 5개씩 한 주로 묶습니다.
3. 20개(4주 × 5일)가 아니면 아래 문구를 함께 고칩니다.
   - '20끼'가 적힌 곳(4곳)
     - `shell.html`: `기준 식단 4주(20끼)에 조절 막대 설정을 적용해요.`
     - `app.bundle.js`: `예시 4주(20끼) 점심을`
     - `app.bundle.js`: `20끼 중 ${e}끼에` ('어떻게 계산하나요?' 탭. 소고기 메뉴가 있는 끼니 수는 계산되지만 20은 고정입니다.)
     - `app.bundle.js`: `기준 식단 20끼 중 10끼에 소고기 메뉴가 있어요.` (소고기 메뉴 막대 설명. '10끼'도 새 식단에 맞게 고칩니다.)
   - 위 문구 말고 '4주'가 적힌 곳(4곳)
     - `shell.html`: `4주 식단표에서 보기`, `예시 식단 4주를`
     - `rolehub.js`: `기준 식단 4주(`, `aria-label="4주 식단표`
4. 메뉴 이름은 엔진이 알아볼 수 있어야 합니다. 묶은 뒤 '메뉴별 CO₂e 비교' 탭에 이름을 넣어 재료가 제대로 나오는지 확인합니다.

관련 값은 다음과 같습니다.

| 값 | 위치(`app.bundle.js`에서 검색) | 설명 |
|---|---|---|
| 고기 없는 날 식단 | `K=["잡곡밥","시래기된장국","두부양념조림","시금치나물","배추김치"]` | 고기 없는 날에 점심 전체를 이 식단으로 바꿉니다. 같은 이름이 '고기 없는 날' 막대 설명(`그날 점심은 …로 바꿔요.`)과 '어떻게 계산하나요?' 탭(`점심 전체를 잡곡밥·…로 바꿔요`) 두 곳에 글로 적혀 있어 함께 고칩니다. |
| 점심 일수 | `Y=260` | 52주 × 5일 |
| 하루 이용자 수 | `id:"diners"` | 기본 500명, 100~3,000명, 50명 단위 |
| 원래 예시 설정 | `const st=Object.assign({},et,{beef:50,veg:1})` | 환경 교육·전체 보기에서 쓰는 시작값 |
| 고기 없는 날 요일(달력 표시) | `rolehub.js`의 `VEG_DAYS` | 주 1회 수, 2회 화·목, 3회 월·수·금, 4회 월·화·목·금, 5회 매일 |

고기 메뉴를 줄일 때 들어가는 대체 메뉴는 코드에 적혀 있지 않습니다. '메뉴 바꾸기 비교'가 제안하는 같은 역할의 메뉴 중 소고기가 없는 첫 번째 메뉴를 데이터(`corpus`)에서 고릅니다. 그래서 `corpus`가 비어 있으면 대체 메뉴가 없습니다([5-3](#5-3-꼭-맞춰야-하는-것)).

### 4-3. 첫 화면 문구 바꾸기

| 바꿀 것 | 파일 | 위치 |
|---|---|---|
| 제목, 안내 문장 | `shell.html` | `#roleHub` 안의 `<h1 id="rhTitle">`, 그 아래 `<p>` |
| 카드의 목적 이름, 대상, 설명, 모듈 목록 | `shell.html` | `#roleHub` 안의 `<button class="rh-card" data-role="…">`, `<button class="rh-all" data-role="all">` |
| 대시보드 탭 이름 | `rolehub.js` | `LABEL`(공통), `ROLES.nutri.label`(식단 설계에서 '메뉴 교환') |
| 목적별 탭 구성과 순서 | `rolehub.js` | `ROLES`의 `tabs`, `map` |
| 대시보드 머리 제목, '목적 바꾸기' 배지 | `rolehub.js` | `ROLES`의 `name`, `who`, 함수 `badges()` |
| 카드 색, 배치 | `rolehub.css` | `#roleHub [data-role=nutri]{--rc:…}` 등 |
| 한 달 식단 달력 문구 | `rolehub.js` | 함수 `renderMonth()` |

- `shell.html`의 `#dtabs` 버튼 글자는 목적을 고르면 `rolehub.js`의 `LABEL`로 덮어씁니다. 탭 이름은 `LABEL`에서 바꿉니다.
- `data-role` 값(`nutri`, `corp`, `user`, `all`)은 `ROLES`의 키와 같아야 합니다.
- 카드 안의 요소 구조(`.rh-top` 등)는 되도록 바꾸지 않습니다. 이유는 [7-2](#7-2-첫-화면-구조는-조금씩-고치고-실제-iphone에서-확인합니다)에 있습니다.
- 굵은 글씨에 새 글자를 넣으면 글꼴이 섞여 보일 수 있습니다. [7-1](#7-1-글꼴은-부분-글꼴입니다)을 확인합니다.

### 4-4. 로고와 이미지 바꾸기

| 파일 | 내용 | `shell.html`에서 쓰는 곳 |
|---|---|---|
| `assets/9212ee11ca.png` | 앱 로고 | 교육 화면 상단 바, 대시보드 제목(2곳) |
| `assets/a92181de85.png` | 국가기후위기대응위원회 로고 | `.logo-partnership`(첫 화면, 입장, 다짐 3곳) |
| `assets/1ec47fcdad.png` | 식판 그림 | 데스크톱·모바일 식판(2곳) |
| `assets/a61b5cb1cf.webp` 외 3개 | 이야기 장면 그림(소, 나무, 쓰러진 소, 그루터기) | `#storySvg`의 `cowPhoto`, `treePhoto`, `deadCowPhoto`, `stumpPhoto` |

기업 CI는 이미지 파일이 아닙니다. `<body>` 앞부분의 숨긴 `<svg>` 안에 `<symbol>`로 들어 있고, `.logo-partnership` 3곳에서 `<use href="#…">`로 불러 씁니다.

바꾸는 순서는 다음과 같습니다.

1. 같은 형식(PNG는 PNG, WebP는 WebP)이면 같은 파일 이름으로 덮어쓰고 다시 묶습니다.
2. 형식이 바뀌면 파일 이름을 바꾸고, `shell.html`의 표시를 모두 고칩니다. 예: `@@ASSET:assets/my-logo.webp|image/webp@@`
3. `alt` 글자(예: `alt="국가기후위기대응위원회"`)도 새 로고에 맞게 고칩니다.
4. 로고를 빼려면 `.logo-partnership` 부분을 지웁니다.

- 파일 이름이 내용의 해시와 달라도 됩니다. `pack.py`는 표시에 적힌 경로의 파일을 읽을 뿐입니다.
- `manifest.json`은 자동으로 갱신되지 않습니다. 빌드에는 영향이 없습니다.
- 기관·기업 로고(국가기후위기대응위원회 로고, 기업 CI)는 각 소유자의 표장입니다. 이 저장소의 라이선스로 쓸 수 있는 것이 아니므로, 다시 쓸 때는 자기 로고로 바꾸거나 지웁니다. 앱 로고와 그림은 팀이 만든 것입니다([7-5](#7-5-공개-범위와-라이선스), [NOTICE.md](../NOTICE.md)).

---

## 5. 내 식당 데이터로 만들기

### 5-1. payload.json에 들어가는 것

계산 데이터는 `payload.json` 한 파일입니다. 앱 코드는 아래 항목을 읽습니다. 각 항목의 형식은 [데이터 설명서](DATA.md)에 있습니다.

| 항목 | 내용 | 준비 방법 |
|---|---|---|
| `factors` | 재료별 1kg당 배출계수 | `data/emission_factors.json` 그대로 |
| `parameters` | 조리 에너지, 음식물 쓰레기 비율 등 계산 파라미터 | `data/parameters.json` 그대로 |
| `sources` | 출처 목록 | `data/sources.json`. S012는 자기 자료로 바꿔 적습니다. |
| `tokens` | 메뉴 이름을 나누는 단어 | `data/dictionary/tokens.json`. 제품명 단어는 빠져 있습니다. |
| `alias` | 재료 동의어 | `data/dictionary/alias.json` 그대로 |
| `methods` | 조리법 | `data/dictionary/methods.json` 그대로 |
| `std_category` | 재료 분류 | `data/dictionary/std_category.json` 그대로 |
| `rules` | 메뉴 해석 규칙 | `data/dictionary/rules.json` 그대로 |
| `recipes` | 메뉴별 재료 1인분 분량 | **직접 준비** |
| `core_index` | 레시피 이름 색인 | **직접 준비** |
| `templates` | 조리법별 재료 구성 | **직접 준비** |
| `global_qty` | 재료별 1인분 분량 | **직접 준비** |
| `segments` | 연령·기관별 1인분 배율(`scale`, `basis`, `src`, `sigma`) | **직접 준비** |
| `complete_segments` | 기본양념까지 적힌 세그먼트 이름 목록(없으면 `[]`) | **직접 준비** |
| `corpus` | 메뉴 사용 빈도와 배출 분포 | **직접 준비** |

- `data/`의 JSON 파일은 `payload.json`의 같은 항목을 같은 형식으로 내보낸 것입니다. `sources`의 S012 내용과 `tokens`의 제품명 단어만 바뀌거나 빠졌습니다. 그래서 형식을 바꾸지 않고 다시 넣을 수 있습니다.
- 공개 데이터는 CC BY 4.0입니다. 각 출처 자료의 이용 조건은 `data/sources.json`을 따릅니다.
- `meta`는 앱 코드가 읽지 않으므로 없어도 됩니다.
- `data/`는 `tools/export_public_data.py`로 만듭니다. 전체 데이터가 있어야 실행할 수 있습니다.
  ```bash
  python3 tools/export_public_data.py payload.json data/
  ```
  공개 여부가 정해지지 않은 최상위 항목이 있거나, 배출계수·파라미터가 S012를 인용하면 멈춥니다. 자세한 내용은 [데이터 설명서 3.3](DATA.md#33-다시-만드는-방법)에 있습니다.

### 5-2. 합치는 예

`my_data/own.json`에 직접 준비한 항목을 모아 두었다고 가정한 예입니다.

```python
import json

def rd(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

P = {
    "factors": rd("data/emission_factors.json"),
    "parameters": rd("data/parameters.json"),
    "sources": rd("data/sources.json"),
    "tokens": rd("data/dictionary/tokens.json"),
    "alias": rd("data/dictionary/alias.json"),
    "methods": rd("data/dictionary/methods.json"),
    "std_category": rd("data/dictionary/std_category.json"),
    "rules": rd("data/dictionary/rules.json"),
}
P.update(rd("my_data/own.json"))  # recipes, core_index, templates, global_qty, segments, complete_segments, corpus

with open("my_payload.json", "w", encoding="utf-8") as f:
    json.dump(P, f, ensure_ascii=False)
```

```bash
python3 tools/pack.py src/build index.html --payload my_payload.json
```

직접 준비한 항목이 아직 없으면 [데이터 설명서 9.1](DATA.md#91-최소-구조)의 최소 구조로 먼저 묶어 볼 수 있습니다. 항목마다 꼭 있어야 하는 하위 키도 그 예에 나와 있습니다.

### 5-3. 꼭 맞춰야 하는 것

- **분량 배율 이름**: 코드는 성인 구내식당 배율로 `segments`의 `산업체오피스` 항목을 씁니다. 이 이름은 dash, app 코드 첫 부분에 고정되어 있습니다(`app.bundle.js`에서 `"산업체오피스"` 두 곳).
- 이 항목이 없으면 dash 코드가 시작하다 멈추고, 같은 묶음 안의 교육 모듈도 실행되지 않습니다. 다른 이름을 쓰려면 위 두 곳도 함께 바꿉니다.
- **레시피 출처 번호 S012**: 코드 여러 곳에 `S012`가 고정되어 있습니다. 엔진은 레시피·템플릿에서 가져온 재료 분량의 근거마다 `S012`를 붙이므로, '메뉴별 CO₂e 비교'의 재료별 근거에도 나옵니다. '어떻게 계산하나요?' 탭의 레시피 설명과 기준 식단 설명에도 붙어 있습니다. 자기 레시피 자료를 `sources`의 S012 자리에 적으면 출처 표시가 맞게 나옵니다.
- **환산 카드 출처**: 결과 화면 환산 카드(승용차, 스마트폰, 소나무)의 출처 S013~S015는 데이터가 아니라 `app.bundle.js` 안에 있습니다.
- **글로 적힌 값과 출처 설명**: 아래 문구는 데이터에서 읽지 않고 코드에 글로 적혀 있습니다. `data/parameters.json`이나 자료 출처를 바꾸면 함께 고칩니다.

  | 검색할 글자(`app.bundle.js`) | 나오는 곳 | 관련 데이터 |
  |---|---|---|
  | `0.4173` (3곳) | 조리 연료 막대 설명, '어떻게 계산하나요?' 탭의 시뮬레이터 설명, 스마트폰 환산 출처(S014) 설명 | `parameters`의 `elec_kgco2e_per_kwh` |
  | `조리량의 15%` (3곳) | 음식물 쓰레기 막대 설명, '어떻게 계산하나요?' 탭의 시뮬레이터 설명과 예시 메뉴 표 | `parameters`의 `waste_rate` |
  | `국내 육류는 기후솔루션(2026), 그 밖은 Poore & Nemecek(2018)과 한국 식품 DB` | '어떻게 계산하나요?' 탭 | `factors`의 출처 |
  | `기존 식단 데이터` (5곳) | 메뉴별 비교, 메뉴 바꾸기 비교, 계산 방법 탭의 설명 | `recipes`, `corpus`를 만든 자료 |
  | `성인 구내식당(산업체·오피스)` | '어떻게 계산하나요?' 탭 | `segments`의 기준 이름 |

- **`shell.html` 머리 주석**: 파일 맨 위 주석에는 원래 식당 이름과 주소 매개변수 사용법이 적혀 있습니다. 자기 식당에 맞게 고칩니다. 주석에 적힌 `Object.keys(Engine.P.recipes)`는 묶은 데이터의 레시피 메뉴 이름을 보여 줍니다. 자기 데이터로 묶으면 자기 레시피 이름이 나옵니다.
- **제품명**: 공개 사전에서는 제품명(브랜드) 단어를 뺐습니다. 식단표에 제품명이 자주 나오면 `tokens`에 직접 더합니다.

**비워도 되는 항목과 안 되는 항목**

| 항목 | 비워도 되나 | 비우면 생기는 일 |
|---|---|---|
| `recipes`, `core_index`, `templates`, `global_qty` | 됩니다(`{}`) | 메뉴 이름에서 읽은 재료만 기본 분량으로 더합니다. 실제 식단과 동떨어진 값이 나옵니다. |
| `complete_segments` | 됩니다(`[]`) | 레시피가 있는 메뉴도 템플릿으로 기본양념 등을 보충합니다(템플릿이 있을 때). |
| `segments` | 안 됩니다. `산업체오피스` 항목이 있어야 합니다 | 없으면 앱이 시작하다 멈춥니다. |
| `corpus.results`, `corpus.freq` | 키는 있어야 합니다. 값은 `{}`여도 됩니다 | 키가 없으면 앱이 시작하다 멈춥니다. 값이 비어 있으면 메뉴 자동완성과 대체 메뉴 제안이 없고, 시뮬레이터의 고기 메뉴 막대도 효과가 없습니다. |
| `corpus.weighted_median` | 안 됩니다. 숫자로 넣습니다 | 이름을 해석하지 못한 메뉴에 쓰는 1인분 값입니다. 없으면 그런 메뉴의 합계가 숫자가 아니게 됩니다. |

항목별로 더 자세한 내용은 [데이터 설명서 9.2](DATA.md#92-항목이-비었을-때)에 있습니다. 믿을 만한 값을 내려면 자기 식당의 레시피 분량이 필요합니다.

### 5-4. 묶은 뒤 확인할 것

1. 브라우저 개발자 도구의 콘솔을 열고 페이지를 새로 고칩니다. 빨간 오류가 없어야 합니다.
2. 네 가지 목적을 하나씩 골라 모든 탭을 열어 봅니다.
3. '메뉴별 CO₂e 비교'에서 자주 나오는 메뉴 몇 개를 넣고 재료와 분량이 맞는지 봅니다.
4. '한 달 식단'에서 조절 막대를 움직여 달력과 1년 효과가 바뀌는지 봅니다.
5. 교육 모듈을 입장부터 다짐까지 끝까지 진행해 봅니다.

---

## 6. 배포 (GitHub Pages)

1. GitHub에 저장소를 만들고, 맨 위 폴더에 `index.html`을 올립니다.
2. 저장소의 **Settings → Pages**로 갑니다.
3. **Build and deployment**의 **Source**를 **Deploy from a branch**로 둡니다.
4. **Branch**를 `main`, 폴더를 `/ (root)`로 고르고 **Save**를 누릅니다.
5. 몇 분 뒤 `https://<계정>.github.io/<저장소>/`에서 열립니다. 주소는 같은 Pages 화면 위쪽에 나옵니다.

- 무료 계정은 공개 저장소에서만 Pages를 쓸 수 있습니다.
- 고친 뒤에는 새 `index.html`을 올리면 다시 배포됩니다. 바로 바뀌지 않으면 몇 분 뒤 강력 새로고침(Windows는 Ctrl+Shift+R, macOS는 Cmd+Shift+R)을 합니다.
- 올리기 전에 내 컴퓨터에서 확인하려면 저장소 폴더에서 아래 명령을 실행하고 `http://localhost:8000/`을 엽니다.
  ```bash
  python3 -m http.server 8000
  ```
- `index.html`에는 묶을 때 넣은 계산 데이터가 압축되어 그대로 들어갑니다. 누구나 `tools/unpack.py`로 풀어 볼 수 있으니, 공개해도 되는 데이터로만 묶어 배포합니다.

---

## 7. 주의할 점

### 7-1. 글꼴은 부분 글꼴입니다

파일 크기를 줄이려고 Noto Sans KR에서 쓰는 글자만 남겼습니다.

| 파일 | 굵기 | 들어 있는 한글 | 비고 |
|---|---|---|---|
| `f500.woff2` | 500 | 음절 2,357자 | 본문용. `data-range` 없음(모든 글자에 씀) |
| `f700.woff2` | 700 | 음절 904자 | 굵은 글씨용으로 고른 일부 글자 |
| `f900.woff2` | 900 | 음절 없음(자모 ㄹ·ㅇ만) | 숫자·영문·일부 기호 |

- 글꼴 로더는 `f500`을 500·700·900 세 굵기로, `f700`을 700·900 굵기로 등록합니다. `f700`, `f900`은 `shell.html`의 `data-range`에 적힌 글자에만 씁니다.
- 그래서 굵은 글씨(700)에 `f700`에 없는 글자를 넣으면 그 글자만 500 굵기로 보입니다. 한 단어 안에서 굵기가 섞여 보일 수 있습니다.
- 900 굵기의 한글 음절은 `f900`에 없으므로 `f700`, 그다음 `f500` 순서로 찾습니다.
- `f500`에도 없는 글자는 시스템 글꼴로 보입니다.

새 굵은 글씨를 넣기 전에 글자가 있는지 확인합니다.

```bash
pip install fonttools brotli
python3 - <<'EOF'
from fontTools.ttLib import TTFont
text = "새로 넣을 굵은 글씨"
cmap = TTFont("src/build/fonts/f700.woff2").getBestCmap()
print("f700에 없는 글자:", "".join(sorted({c for c in text if not c.isspace() and ord(c) not in cmap})) or "없음")
EOF
```

없는 글자가 있으면 둘 중 하나를 고릅니다.

- 이미 있는 글자로 문구를 다시 씁니다. 가장 간단합니다.
- 원본 Noto Sans KR(SIL OFL 1.1)에서 필요한 글자를 넣어 부분 글꼴을 다시 만듭니다(예: fontTools의 `pyftsubset`). 이때 `shell.html`의 해당 `data-range`에도 새 글자를 더해야 합니다. 범위에 없는 글자는 글꼴 파일에 있어도 쓰이지 않습니다.

### 7-2. 첫 화면 구조는 조금씩 고치고 실제 iPhone에서 확인합니다

- 모바일에서 첫 화면 카드는 `<button class="rh-card">` 안의 `.rh-top`에 `display:contents`를 주어 배치합니다(`rolehub.css`의 `body.mobile .rh-top{display:contents}`).
- 제작 중에 `<button>` 안에서 `display:contents`를 쓰는 카드 구조를 바꿨다가, iPhone(WebKit)에서 카드를 눌러도 반응하지 않는 문제가 있었습니다.
- 첫 화면의 구조는 꼭 필요한 만큼만 바꿉니다. 바꾼 뒤에는 실제 iPhone에서 네 카드를 모두 눌러 봅니다.

### 7-3. 파일 크기

- 현재 `index.html`은 약 3.07MB입니다. `assets/` 이미지가 약 1.7MB, 앱 코드(그릇 그림 2개 포함)가 약 0.5MB, 글꼴이 약 0.3MB이고 나머지는 계산 데이터와 HTML·CSS입니다.
- 이미지는 표시가 나오는 곳마다 data URI로 따로 들어갑니다. 식판 그림(`1ec47fcdad.png`, 약 430KB)은 두 곳에서 쓰여 두 번 들어가므로, 이것만 약 1.15MB입니다.
- base64로 넣으면 이미지 크기가 약 4/3배가 됩니다. 새 이미지는 WebP 등으로 줄여서 넣는 것이 좋습니다.
- 시작 스크립트가 파일 맨 끝에 있어서, 파일 전체를 받아야 앱이 동작합니다. 느린 모바일 회선에서도 확인해 봅니다.

### 7-4. 브라우저 지원

- 시작 스크립트는 `DecompressionStream`이 있어야 데이터와 코드를 풀 수 있습니다.
- 없으면 화면 전체에 "이 페이지는 최신 브라우저에서 열어 주세요"와 "크롬·엣지 80, 파이어폭스 113, 사파리 16.4 이상이면 볼 수 있어요."를 띄우고 멈춥니다.
- 압축을 풀거나 JSON을 읽다가 오류가 나도 같은 안내가 뜹니다. 데이터를 바꾼 뒤 이 안내가 보이면 `payload.json`이 올바른 JSON인지 먼저 확인합니다.
- 코드를 실행하는 중에 난 오류는 이 안내로 잡히지 않습니다. 화면이 멈추면 브라우저 콘솔을 확인합니다.
- `FontFace`를 지원하지 않는 브라우저에서는 글꼴 로더가 아무것도 하지 않고, 시스템 글꼴로 보입니다.

### 7-5. 공개 범위와 라이선스

**계산 데이터**

- 계산 데이터 전체는 별도 파일(`payload.json`)로 올리지 않았습니다.
- `data/`에 없는 항목(`recipes`, `core_index`, `templates`, `global_qty`, `segments`, `complete_segments`, `corpus`, `meta`)과 `tokens`의 제품명 단어는 급식회사 내부 자료(S012)에서 나왔거나 내부 빌드 정보입니다. 공개 라이선스 대상이 아니므로 다시 쓰거나 배포할 수 없습니다.
- 다시 쓸 수 있는 공개 데이터는 `data/`에 있는 것뿐입니다. 앱을 다시 묶을 때는 `data/`와 자기 데이터를 씁니다([5장](#5-내-식당-데이터로-만들기)).

**라이선스**

| 대상 | 라이선스 |
|---|---|
| 코드(`index.html`의 스크립트, `src/`, `tools/`) | MIT([LICENSE](../LICENSE)) |
| 데이터(`data/`)와 문서(`docs/`) | CC BY 4.0([LICENSE-DATA.md](../LICENSE-DATA.md)) |
| 출처 자료 | 각 출처의 이용 조건(`data/sources.json`) |
| 글꼴(Noto Sans KR 부분 글꼴) | SIL OFL 1.1(`src/build/fonts/OFL.txt`) |
| 일러스트·앱 로고(`src/build/assets/`의 그림, `restaurant.svg`, 코드 안 그릇 그림) | MIT(팀 제작) |
| 기관·기업 로고(국가기후위기대응위원회 로고, 기업 CI) | 각 소유자의 표장. 라이선스 대상 아님 |
| 내부 자료(S012)에서 나온 데이터 | 라이선스 대상 아님 |

항목별 자세한 조건과 출처는 [NOTICE.md](../NOTICE.md)에 있습니다.
