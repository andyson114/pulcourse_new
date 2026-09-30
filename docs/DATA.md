# 데이터 설명서

'지구를 지키는 점심 선택'이 계산에 쓰는 데이터(이하 DB)를 설명합니다.
DB는 JSON 파일 하나(`payload.json`)이고, 최상위 항목은 16개입니다.

- 공개할 수 있는 항목은 [`data/`](../data/) 폴더에 따로 내보냈습니다. 이 문서에는 실제 값을 예로 들었습니다.
- 급식회사 내부 조리지침서·식단표(출처 S012)에서 나온 항목은 별도 데이터 파일로 내지 않습니다. 이 문서에는 구조만 적었습니다.
- 비공개 항목에는 CC BY 4.0이 적용되지 않습니다([제3자 자료와 이용 조건](../NOTICE.md)).
- 비공개 항목의 예시는 모두 **형식 예시(실제 값 아님)** 입니다. 구조를 보여 주려고 지어낸 이름과 숫자이며, 실제 DB와 관계가 없습니다.

함께 보면 좋은 문서입니다.

- [계산 방법](METHODOLOGY.md): 이 데이터로 1인분 배출량과 1년 배출량을 구하는 방법
- [제작 가이드](BUILD_GUIDE.md): 앱을 풀고 다시 묶는 방법, 내 식당 데이터로 앱을 만드는 전체 순서
- [계산 흐름도](flow-3-calculation.svg): 계산 흐름 전체를 그린 그림

**이용 조건**

`data/`의 데이터와 이 문서는 CC BY 4.0으로 공개합니다([데이터·문서 라이선스](../LICENSE-DATA.md)). 다시 쓸 때는 다음처럼 출처를 밝혀 주세요.

> 지구를 지키는 점심 선택 팀, 「지구를 지키는 점심 선택 — 공개 데이터」, https://github.com/andyson114/pulcourse_new (CC BY 4.0)

- 배출계수와 파라미터의 원출처(S001~S011)도 함께 밝혀 주세요. 각 출처 자료는 그 자료의 이용 조건을 따릅니다([5.3 출처](#53-sources출처)).
- 보도자료나 기사로 확인한 출처(S002, S009, S010, S011)는 다시 쓸 수 있는 조건이 따로 적혀 있지 않습니다. 원문의 글이나 표를 옮겨 쓸 때는 발행처에 확인하세요.

## 목차

1. [DB가 앱에 들어가는 길](#1-db가-앱에-들어가는-길)
2. [항목 한눈에 보기](#2-항목-한눈에-보기)
3. [공개 파일(data/)](#3-공개-파일data)
4. [메뉴 이름 해석: tokens · alias · methods · std_category · rules](#4-메뉴-이름-해석-tokens--alias--methods--std_category--rules)
5. [배출계수·파라미터·출처: factors · parameters · sources](#5-배출계수파라미터출처-factors--parameters--sources)
6. [분량 데이터(비공개): recipes · core_index · templates · global_qty · segments · complete_segments](#6-분량-데이터비공개-recipes--core_index--templates--global_qty--segments--complete_segments)
7. [corpus(비공개)](#7-corpus비공개)
8. [meta(비공개)](#8-meta비공개)
9. [내 데이터로 채우기](#9-내-데이터로-채우기)
10. [알려진 빈칸과 주의할 점](#10-알려진-빈칸과-주의할-점)

---

## 1. DB가 앱에 들어가는 길

1. [`tools/pack.py`](../tools/pack.py)가 `payload.json`을 gzip으로 압축하고 base64로 바꿔, `src/build/shell.html`의 `<script type="text/plain" id="payload">` 자리에 넣습니다.
2. 페이지가 열리면 `shell.html` 끝의 시작 스크립트가 압축을 풀어 `window.PAYLOAD`에 둡니다.
3. 시작 스크립트는 `engine.js`·`dash.js`·`app.js`를 하나로 묶은 코드를 한 번에 실행합니다(`shell.html` 446행의 `new Function(code)()`). 그래서 `dash.js`가 도중에 멈추면 뒤따르는 `app.js`(교육 모듈)도 실행되지 않습니다.
4. `dash.js`가 가장 먼저 `Engine.init(PAYLOAD)`를 부릅니다(dash.js 6행). 그 뒤로 계산 엔진은 `Engine.P`로 DB를 읽습니다. `app.js`도 `Engine.P`를 씁니다(app.js 16행).

이 문서에서 코드 위치는 `src/readable/`의 읽기용 사본(`engine.js`, `dash.js`, `app.js`) 기준입니다.

- 위치는 '(engine.js 20행)'처럼 적습니다. 줄 번호는 지금 판의 읽기용 사본 기준이라, 코드가 바뀌면 달라집니다.
- 함수 이름은 압축된 원문 그대로라 한두 글자입니다.

'단계'라는 말은 세 가지 뜻으로 나눠 씁니다.

| 용어 | 뜻 | 개수 |
|---|---|---|
| 계산 단계(`tier`) | 분량을 어디서 가져왔는지. 1 레시피, 2 템플릿, 3 재료 평균, 4 모름. 이 문서의 '1단계'~'4단계'는 모두 계산 단계입니다 | 4 |
| 배출 단계 | 배출계수의 `stages` 필드(`luc`~`disposal`) | 9 |
| 결과 묶음 | 화면에 보이는 생산·가공·유통·조리·폐기 | 5 |

## 2. 항목 한눈에 보기

| 항목 | 내용 | 공개 여부 | 공개 파일 |
|---|---|---|---|
| `rules` | 메뉴 이름 해석·분류 규칙 | 공개 | `data/dictionary/rules.json` |
| `meta` | DB 빌드 정보(버전·건수) | 비공개 | 없음(대신 `data/MANIFEST.json`) |
| `sources` | 출처 목록 | 공개(S012는 비공개 표시만) | `data/sources.json`, `.csv` |
| `parameters` | 계산 파라미터 | 공개 | `data/parameters.json`, `.csv` |
| `segments` | 급식 대상(기관·연령)별 분량 배율 | 비공개 | 없음 |
| `complete_segments` | 기본양념까지 적힌 세그먼트 목록 | 비공개 | 없음 |
| `tokens` | 메뉴 이름 단어 사전 | 공개(제품명 제외) | `data/dictionary/tokens.json` |
| `methods` | 조리법 사전 | 공개 | `data/dictionary/methods.json` |
| `alias` | 재료 동의어 사전 | 공개 | `data/dictionary/alias.json` |
| `std_category` | 표준 재료의 분류 | 공개 | `data/dictionary/std_category.json` |
| `factors` | 재료 1kg당 배출계수 | 공개 | `data/emission_factors.json`, `.csv` |
| `recipes` | 메뉴별 재료 1인분 분량 분포 | 비공개 | 없음 |
| `core_index` | 레시피 이름 색인 | 비공개 | 없음 |
| `templates` | 조리법별 재료 구성 | 비공개 | 없음 |
| `global_qty` | 재료별 1인분 분량 분포 | 비공개 | 없음 |
| `corpus` | 메뉴 빈도·배출 분포 | 비공개 | 없음 |

비공개 이유는 모두 같습니다. 급식회사 내부 자료(S012)에서 만든 값이기 때문입니다.
`tokens`에서는 내부 식단에서 모은 브랜드·제품명 단어(유형 `제품명`)만 뺐습니다.
비공개 항목은 공개 데이터(`data/`)에 넣지 않았고, 이 문서에서 구조만 설명합니다.

## 3. 공개 파일(data/)

### 3.1 파일 목록

| 파일 | 내용 | 원래 DB 항목 |
|---|---|---|
| `emission_factors.json` / `.csv` | 재료 130종의 1kg당 배출계수(배출 단계별) | `factors` |
| `parameters.json` / `.csv` | 계산 파라미터 19개 | `parameters` |
| `sources.json` / `.csv` | 출처 12개(S012는 비공개로 표시) | `sources` |
| `dictionary/tokens.json` | 메뉴 이름 해석 단어 899개(제품명 56개 제외) | `tokens` |
| `dictionary/alias.json` | 재료 동의어 591개 | `alias` |
| `dictionary/methods.json` | 조리법 189개 | `methods` |
| `dictionary/std_category.json` | 재료 분류 126개 | `std_category` |
| `dictionary/rules.json` | 메뉴 해석 규칙 | `rules` |
| `MANIFEST.json` | 위 목록과 뺀 항목 목록 | (`meta` 대신) |

JSON 파일은 DB 안의 해당 항목과 구조가 같습니다. 그대로 DB에 다시 넣을 수 있습니다.

### 3.2 CSV 열

CSV는 엑셀에서 한글이 깨지지 않도록 BOM이 붙은 UTF-8(`utf-8-sig`)로 저장했습니다.

**emission_factors.csv**

| 열 | 뜻 | JSON 필드 |
|---|---|---|
| `재료(std)` | 표준 재료 이름 | 키, `std` |
| `분류` | 재료 분류 | `category` |
| `총계_kgCO2e_per_kg` | 배출 단계 합계(kg CO₂e/kg) | `total` |
| `단계_luc` … `단계_disposal` | 9개 배출 단계 값(kg CO₂e/kg) | `stages.*` |
| `품질` | 근거의 종류 | `quality` |
| `sigma` | 로그정규 σ | `sigma` |
| `출처` | 출처 ID. 여러 개면 `;`로 구분 | `sources` |
| `근거` | 계수를 만든 방법 | `basis` |
| `비고` | 참고 | `note` |

`components`와 `variants`는 CSV에 없습니다. JSON에서 보세요.

**parameters.csv**: `이름`, `값`, `단위`, `출처`, `품질`, `sigma`, `비고`. 값이 객체이면(예: `cook_mj_per_kg`) JSON 문자열로 적었습니다.

**sources.csv**: `id`, `제목`, `발행처`, `URL`, `연도`, `확인일`, `라이선스·이용조건`, `범위`, `지역`, `비고`.

### 3.3 다시 만드는 방법

`data/`는 [`tools/export_public_data.py`](../tools/export_public_data.py)로 만듭니다. 전체 DB가 있어야 실행할 수 있습니다.

```bash
python3 tools/export_public_data.py 전체_payload.json data/
```

이 스크립트는 다음 경우에 멈춥니다.

- DB에 공개 여부가 정해지지 않은 최상위 항목이 있을 때
- 배출계수나 파라미터가 내부 출처(S012)를 인용할 때

---

## 4. 메뉴 이름 해석: tokens · alias · methods · std_category · rules

메뉴 이름은 다음 순서로 읽습니다.

1. `Engine.normalize`(engine.js 20행): 공백, 괄호 안 글자, ☆·※ 같은 기호, 끝의 숫자를 지웁니다. 예: `매콤돼지불고기(국내산)` → `매콤돼지불고기`.
2. `Engine.tokenize`(engine.js 30행): `tokens`의 단어를 긴 것부터 맞춰 봅니다. 맞는 단어가 없는 글자는 `미등록`으로 묶습니다.
3. `Engine.parse`(engine.js 64행): 단어를 `alias`로 표준 재료로, `methods`로 조리법과 가열 방식으로 바꿉니다. `rules`로 빈 곳을 채웁니다.

공개 사전만으로 실제로 돌려 본 결과입니다.

| 메뉴 이름 | 단어 | 조리법 / 가열 방식 | 표준 재료 | 수식어 |
|---|---|---|---|---|
| 소고기국밥 | 소고기(재료), 국밥(조리법) | 국밥 / 끓임 | 소고기 | 없음 |
| 닭불고기 | 닭(재료), 불고기(재료) | 불고기 / 볶음 | 닭고기 | 없음 |
| 매콤돼지불고기(국내산) | 매콤(수식어), 돼지불고기(재료) | 불고기 / 볶음 | 돼지고기 | 매콤 |
| 우유 | 우유(재료) | 유제품 / 완제품 | 우유 | 없음 |
| 사과 | 사과(재료) | 과일 / 무가열 | 사과 | 없음 |

- '닭불고기'에서 '불고기'는 원래 소고기를 뜻합니다. 이름에 다른 단백질(닭)이 있어 소고기를 뺐습니다(`rules.dual_protein_tokens`).
- '우유'는 재료 단어이면서 `methods`에도 있습니다(`우유 → [유제품, 완제품]`). 그래서 조리법을 `methods`에서 가져왔습니다.
- '사과'는 `methods`에 없습니다. `rules.product_std_method`는 이렇게 조리법을 하나도 찾지 못했을 때만 씁니다(`사과 → [과일, 무가열]`).

### 4.1 tokens(단어 사전)

- **용도**: 메뉴 이름을 단어로 나눌 때 쓰는 사전입니다.
- **구조**: 배열의 배열. 항목 하나는 `[표기, 유형, 표준재료, 조리법, 가열 방식]` 다섯 칸입니다.

| 위치 | 이름 | 뜻 | 엔진이 읽나 |
|---|---|---|---|
| 0 | 표기 | 메뉴 이름에서 찾을 글자열 | 읽음 |
| 1 | 유형 | `재료`, `수식어`, `양념수식`, `조리법` (비공개판에는 `제품명`도 있음) | 읽음 |
| 2 | 표준재료 | `alias[표기]`와 같은 값. 재료가 아니면 `null` | 읽지 않음 |
| 3 | 조리법 | `methods[표기][0]`과 같은 값. 조리법 이름이며 `templates`의 키, `rules.roles` 목록의 값으로 쓰임. 없으면 `null` | 읽지 않음 |
| 4 | 가열 방식 | `methods[표기][1]`과 같은 값. `parameters.cook_mj_per_kg`의 키. 없으면 `null` | 읽지 않음 |

- **코드**: `Engine.init`(engine.js 15행)이 사전을 읽습니다.
  - 0번과 1번만 읽고, 단어를 길이가 긴 순서로 정렬합니다.
  - 2~4번은 사람이 읽기 쉽도록 `alias`·`methods` 값을 옮겨 둔 것입니다. 엔진은 표준재료와 조리법을 `alias`와 `methods`에서 찾습니다.
  - 그래서 단어를 고칠 때는 `alias`와 `methods`도 같이 고쳐야 합니다.
- **유형별 처리**(engine.js 72~84·119~125행)

| 유형 | 개수(공개판) | 처리 |
|---|---|---|
| `재료` | 591 | `alias`로 표준 재료를 찾음. 109개는 조리법도 함께 뜻함(예: 불고기, 갈비탕) |
| `조리법` | 80 | `methods`로 조리법과 가열 방식을 찾음 |
| `수식어` | 215 | 재료·분량 계산에는 쓰지 않음. 다만 `rules.plant_signal`에 든 수식어(예: 비건)는 식물성 메뉴 처리를 켬. 레시피 색인 키(`coreKey`)를 만들 때 뺌 |
| `양념수식` | 13 | 인식만 함(미등록으로 치지 않음). 색인 키에는 남음 |
| `제품명` | 공개판에서 뺌 | 계산에 쓰지 않음. 색인 키를 만들 때 뺌 |
| `미등록` | (사전에 없음) | 엔진이 붙이는 유형. 이름 해석률(`coverage`)을 낮춤. 색인 키에는 남음 |

- **공개 여부**: 공개. 단, 유형 `제품명` 56개는 내부 식단에서 모은 브랜드·제품명이라 뺐습니다.
- **제품명을 뺀 영향**: 공개판 사전으로 DB를 만들면 같은 메뉴라도 라이브 사이트와 결과가 다를 수 있습니다.
  - 제품명 글자가 `미등록`으로 읽혀 `coverage`가 낮아집니다.
  - 이 글자가 색인 키(`coreKey`)에 남아, `core_index`로 레시피를 찾는 결과가 달라집니다.
  - 제품명 안에 든 다른 단어(예: 재료 이름)가 따로 잡힐 수 있습니다.
  - 여러분 식단표에 제품명이 자주 나오면, 그 단어를 유형 `제품명`으로 `tokens`에 더하세요.
- **예시(실제 값)**

```json
[
  ["소고기", "재료", "소고기", null, null],
  ["불고기", "재료", "소고기", "불고기", "볶음"],
  ["국밥", "조리법", null, "국밥", "끓임"],
  ["매콤", "수식어", null, null, null],
  ["데리야키", "양념수식", null, null, null]
]
```

### 4.2 alias(재료 동의어)

- **용도**: 메뉴 이름에 나온 재료 표기를 표준 재료 이름으로 바꿉니다.
- **구조**: `{ 표기: 표준재료 }`. 표준재료는 `factors`의 키입니다. 예외로 `식물성대체육`은 배출계수가 없습니다([10장](#10-알려진-빈칸과-주의할-점)).
- **코드**: `Engine.parse`(engine.js 82·88·102~107행)에서 재료 목록(`stds`)을 만듭니다. '계산 방법' 탭의 재료 수 안내(dash.js 1029행)에도 개수가 쓰입니다.
- **공개 여부**: 공개.
- **예시(실제 값)**: `{"돈육": "돼지고기", "시래기": "건나물·묵나물", "닭": "닭고기"}`

### 4.3 methods(조리법)

- **용도**: 단어를 조리법과 가열 방식으로 바꿉니다.
- **구조**: `{ 표기: [조리법, 가열 방식] }`.
  - 조리법: 메뉴 종류를 나타내는 이름입니다(93종). `templates`와 `corpus.method_prior`의 키이고, `rules.roles`의 목록에 쓰입니다. 여기에 더해 `parse`가 붙이는 `기타`(단백질 재료만 있고 조리법 단어가 없는 메뉴)도 두 항목의 키로 씁니다.
  - 가열 방식: `끓임`, `조림`, `찜`, `데침`, `볶음`, `부침`, `튀김`, `구이`, `무가열`, `완제품` 가운데 하나입니다. `parameters.cook_mj_per_kg`의 키입니다.
- **코드**: `Engine.parse`(engine.js 73~81행)
  - 조리법 전용 단어(예: 국밥)가 1순위입니다.
  - 재료 단어가 조리법 사전에 없으면, 그 끝부분 가운데 가장 긴 조리법을 1순위로 씁니다(예: 돼지불고기 → 불고기).
  - 재료이면서 조리법인 단어(예: 갈비탕, 우유)는 1순위가 없을 때만 씁니다.
  - 같은 순위가 여럿이면 이름의 뒤쪽 단어가 이깁니다.
  - 그래도 조리법이 없으면 `rules`로 정합니다(engine.js 87~98행). 단백질 재료가 있으면 `기타`, 없으면 `rules.product_std_method`를 봅니다.
- **공개 여부**: 공개.
- **예시(실제 값)**: `{"국밥": ["국밥", "끓임"], "갈비탕": ["탕", "끓임"], "제육": ["제육볶음", "볶음"]}`

### 4.4 std_category(재료 분류)

- **용도**: 표준 재료를 분류로 묶습니다.
- **구조**: `{ 표준재료: 분류 }`. 분류는 `가공식품`, `견과`, `곡류`, `과일`, `김치·절임`, `난류`, `당류`, `두류`, `면류`, `버섯`, `양념`, `어패류`, `유제품`, `유지`, `육류`, `음료`, `채소`, `해조류` 18가지입니다.
- **코드**
  - `Engine.cat`(engine.js 126행): 분류를 돌려줍니다. 없으면 빈 문자열입니다.
  - `Engine.slotOf`(engine.js 127행): 재료를 `유지`·`양념`·`수분`·`식재료`로 나눕니다.
  - 단백질 판단(engine.js 139행), 식물성 메뉴 처리(engine.js 161행).
  - 화면: 재료 아이콘 묶음(dash.js 40행), 시뮬레이터의 재료군 묶음(`P()`, dash.js 439행), 교육 모듈의 메뉴 종류(`h()`, app.js 28행).
- **공개 여부**: 공개.
- **예시(실제 값)**: `{"가지": "채소", "간장": "양념", "감자": "채소"}`

`factors`의 `category` 필드와 같은 정보이지만, 엔진은 `std_category`만 봅니다.

### 4.5 rules(해석 규칙)

- **용도**: 사전만으로 정할 수 없는 경우의 규칙과 기준값을 모았습니다.
- **공개 여부**: 공개. 파일 전체는 [`data/dictionary/rules.json`](../data/dictionary/rules.json)에 있습니다.

| 필드 | 형식 | 공개판 값(요약) | 쓰는 곳과 역할 |
|---|---|---|---|
| `presence_min` | 숫자 | 0.3 | `resolve`: 템플릿에서 숨은 재료·보충 재료를 넣을 최소 포함률 |
| `product_methods` | 조리법 배열 | 견과, 과일, 과자, 디저트, 떡, 빵, 유제품, 음료 | `resolve`: 완제품류 조리법. 주재료를 하나만 두고 숨은 재료를 넣지 않음 |
| `product_cats` | 분류 배열 | 가공식품, 견과, 곡류, 면류, 유제품, 음료 | `resolve`: 완제품류의 주재료가 될 수 있는 분류 |
| `protein_cats` | 분류 배열 | 어패류, 육류 | 단백질 재료 판단(engine.js 139행) |
| `protein_like_stds` | 재료 배열 | 만두류, 육가공품 등 6개 | 단백질처럼 다룰 재료. 엔진과 dash.js의 메뉴 역할 판단 |
| `protein_stds` | 재료 배열 | 소고기, 돼지고기, 닭고기, 계란 등 16개 | `parse`: 조리법이 없을 때 '기타'로 둠. dash.js: 메뉴 역할·대체 메뉴 판단 |
| `dual_protein_tokens` | 단어 배열 | 갈비, 불고기, 제육, 돈가스 등 31개 | `parse`: 이 단어가 뜻하는 고기는 이름에 다른 단백질이 있으면 뺌 |
| `product_std_method` | `{재료: [조리법, 가열 방식]}` | 우유 → [유제품, 완제품], 사과 → [과일, 무가열] 등 | `parse`: 조리법을 하나도 찾지 못했고 단백질 재료도 없을 때 재료로 조리법을 정함 |
| `oil_stds` | 재료 배열 | 참기름, 들기름, 식용유, 버터, 생크림 | `slotOf`: `유지`로 분류 |
| `water_stds` | 재료 배열 | 육수·스톡, 차·물 | `slotOf`: `수분`으로 분류 |
| `season_cats` | 분류 배열 | 양념, 당류, 유지 | `slotOf`: `양념`으로 분류. 보충 대상 |
| `grain_like` | 재료 배열 | 쌀, 현미, 보리 등 12개 | 레시피 보충 대상(engine.js 136행) |
| `complete_extra` | 재료 배열 | 육수·스톡, 차·물, 대파, 마늘, 양파, 생강 | 레시피 보충 대상(engine.js 136행) |
| `family_min` | 숫자 | 3 | `resolve`: '계열 레시피'로 묶을 최소 레시피 수 |
| `contained_min_len` | 숫자 | 3 | `resolve`: '이름에 든 레시피'로 인정할 최소 글자 수 |
| `roles` | `{역할: 조리법 배열}` | rice, soup, noodle, main, side, kimchi, snack | `g()`(dash.js 72행): 메뉴 역할. `p()`(app.js 39행): 그릇 모양 |
| `plant_signal` | 단어 배열 | 식물성, 비건, 채식, 콩고기, 대체육 등 9개 | `resolve`: 식물성 메뉴 신호 |
| `plant_replace_stds` | 재료 배열 | 육가공품, 어묵·어육가공 | `resolve`: 식물성 메뉴에서 대체육으로 바꿀 재료(육류·어패류 분류 외에 추가) |
| `slot_exempt_methods` | 조리법 배열 | 짜장면 | `resolve`: 주재료 슬롯 분량을 쓰지 않을 조리법 |
| `plant_exclude_min_g` | 숫자(g) | 10 | `resolve`: 식물성 대체육이 이만큼(× 분량 배율) 이상이면 계산에서 뺌 |

`roles`의 역할은 화면에서 다음 이름으로 바뀝니다(`g()`, dash.js 72행): `김치`, `밥`, `국·찌개`, `면`, `간식·후식`, `주찬`, `부찬`, `기타`. 볶음·조림·찜·구이·튀김·전은 단백질 재료가 있으면 `주찬`, 없으면 `부찬`입니다.

---

## 5. 배출계수·파라미터·출처: factors · parameters · sources

### 5.1 factors(배출계수)

- **용도**: 재료 1kg이 만들어져 식당에 오기까지(그리고 일부는 폐기까지) 나오는 온실가스(kg CO₂e)입니다.
- **구조**: `{ 표준재료: 계수 기록 }`. 공개판에 130종이 있습니다.
- **공개 여부**: 공개. 내보내기 스크립트가 S012를 인용한 계수가 없는지 확인합니다.

**계수 기록의 필드**

| 필드 | 형식·단위 | 뜻 | 코드에서 |
|---|---|---|---|
| `std` | 문자열 | 표준 재료 이름. 키와 같음 | 키로 찾음 |
| `category` | 문자열 | 재료 분류. 4개는 비어 있음 | 엔진은 이 값 대신 `std_category`를 씀 |
| `stages` | 객체, kg CO₂e/kg | 9개 배출 단계별 값(아래 표) | `Engine.emissions`(engine.js 414~422행) |
| `total` | 숫자, kg CO₂e/kg | `stages` 합계 | `Engine.monteCarlo`(engine.js 527행), 화면의 '배출계수' |
| `quality` | 문자열 | 근거의 종류(아래 표) | `Engine.provenance`에 담김 |
| `sigma` | 숫자 | 불확실성(로그정규 σ). `quality`로 정해짐 | `Engine.monteCarlo`(engine.js 493행) |
| `sources` | 출처 ID 배열 | 근거 자료 | `Engine.provenance`에만 담김(지금 화면에는 나오지 않음) |
| `basis` | 문자열 | 계수를 만든 방법 | `Engine.provenance` |
| `components` | `[{share, label, total}]` | 여러 값을 섞은 계수의 구성. 대부분 빈 배열 | `Engine.provenance` |
| `note` | 문자열 | 참고 | `Engine.provenance` |
| `variants` | `{이름: 계수 기록}`(일부만) | 원산지별 계수. 소고기·돼지고기·닭고기·육류(불명)에만 있음 | `Engine.provenance`가 이름만 담음. 계산에는 쓰지 않음 |

`Engine.provenance`(engine.js 557행)는 계산 근거를 묶어 돌려주는 함수입니다. 지금 화면은 계수 기록 가운데 `total`만 보여 줍니다.

**stages의 9개 배출 단계**

| 필드 | 배출 단계 | 결과 묶음 |
|---|---|---|
| `luc` | 토지 이용 변화 | 생산(`production`) |
| `farm` | 농장 | 생산 |
| `feed` | 사료 | 생산 |
| `processing` | 가공 | 가공(`processing`) |
| `transport` | 운송 | 유통(`distribution`) |
| `retail` | 소매 | 유통 |
| `packaging` | 포장 | 유통 |
| `losses` | 공급망 손실 | 유통 |
| `disposal` | 폐기 | 폐기(`disposal`) |

`luc`는 음수일 수 있습니다(예: 쌀 −0.012).
다섯째 결과 묶음인 조리(`consumption`)는 계수가 아니라 파라미터로 계산합니다(아래 계산식).

**quality와 sigma**

`sigma`는 `parameters.sigma_by_quality`의 대응표로 정해 두었습니다. 앱은 이 대응표를 실행 중에 읽지 않고, 계수마다 저장된 `sigma`를 씁니다.

| quality | 뜻 | sigma | 공개판 개수 | 예 |
|---|---|---|---|---|
| `direct` | 출처에 그 재료의 값이 있어 그대로 씀. 소고기·돼지고기·닭고기는 원산지별 값을 자급률로 섞음 | 0.3 | 47 | 배추(P&N 'Brassicas'), 소고기(기후솔루션, 혼합) |
| `direct_product` | 환경성적표지 인증 제품값의 kg당 중앙값 + P&N 유통값 | 0.2 | 10 | 두부, 육가공품 |
| `group_mean` | 한국 식품군 평균(S003)을 P&N 배출 단계 비율로 나눔 | 0.35 | 41 | 쌀 |
| `proxy` | 비슷한 다른 재료의 값으로 대신함 | 0.45 | 29 | 전분(P&N 'Potatoes'), 육류(불명)(돼지고기 혼합값으로 대신함) |
| `pending` | 직접 자료가 없어 배합을 가정해 계산 | 0.6 | 3 | 김치·절임류, 육수·스톡, 조리완제품 |
| `assumption` | 가정값(파라미터에만 씀) | 0.5 | 0 | — |

**예시(실제 값)**: 단일 출처 계수

```json
"배추": {
  "std": "배추", "category": "채소",
  "stages": {"luc": 0.0022, "farm": 0.2777, "feed": 0, "processing": 0, "transport": 0.0946,
             "retail": 0.0168, "packaging": 0.0453, "losses": 0.0778, "disposal": 0},
  "total": 0.5144, "quality": "direct", "sigma": 0.3, "sources": ["S001"],
  "basis": "P&N 2018 'Brassicas' 단계별 값 (전세계 평균)", "components": [], "note": ""
}
```

**예시(실제 값)**: 섞은 계수의 `components`(소고기, 일부)

```json
"basis": "자급률 가중 혼합(국내산 42%): 기후솔루션 2026 단계별 값",
"components": [
  {"share": 0.42,   "label": "국내산 소고기 (S002) 비중 42%", "total": 58.16},
  {"share": 0.281,  "label": "US산 쇠고기 (S002) 비중 28.1%", "total": 32.05},
  {"share": 0.281,  "label": "AU산 쇠고기 (S002) 비중 28.1%", "total": 26.82},
  {"share": 0.0179, "label": "NZ산 쇠고기 (S002) 비중 1.8%",  "total": 20.51}
]
```

**계산식**(`Engine.emissions`, engine.js 364행)

1. 재료 질량 m(kg) = Σ(포함률 × 1인분 중앙값 g) ÷ 1000
2. 생산·가공·유통·재료 폐기 = Σ(재료별 질량 × 해당 배출 단계 계수)
3. 조리 = m × `cook_mj_per_kg[가열 방식]` × 연료 계수
   - 도시가스: `gas_kgco2e_per_mj` (0.0561 kg CO₂e/MJ)
   - 전기: `elec_kgco2e_per_kwh` ÷ 3.6 (0.4173 kg CO₂e/kWh를 MJ당으로)
4. 음식물 쓰레기 = m × `waste_rate`(0.15) × `waste_treatment_kgco2e_per_kg`(0.1756)
5. 1인분 합계 = 생산 + 가공 + 유통 + 조리 + 폐기(재료 폐기 + 음식물 쓰레기)

계수가 없는 재료는 `기타채소` 계수로 계산합니다(engine.js 415·493·527행). 그래서 `factors`에는 `기타채소`가 꼭 있어야 합니다.

**불확실성**(`Engine.monteCarlo`, engine.js 466행)

- 반복 횟수는 `mc_iterations`(기본 2,000번)입니다.
- 반복마다 재료 계수에 평균이 1인 로그정규 배수 exp(σZ − σ²/2)를 곱합니다.
- 분량, 분량 배율, 조리 에너지, 쓰레기 비율, 처리 계수도 각자의 σ로 흔듭니다.
- 대체값으로 계산한 메뉴는 재료별로 흔들지 않고, 합계 전체에 로그정규 배수를 곱합니다. σ는 `method_prior`이면 0.6, `weighted_median`이면 1입니다(engine.js 520~522행).
- 화면의 '가능한 범위'는 그 결과의 10~90% 구간입니다.

### 5.2 parameters(계산 파라미터)

- **용도**: 재료 계수 밖에서 쓰는 값(조리 에너지, 연료, 쓰레기, 불확실성 등)입니다.
- **구조**: `{ 이름: {value, unit, src, quality, sigma, note} }`

| 필드 | 뜻 |
|---|---|
| `value` | 값. 숫자, 문자열, 또는 객체 |
| `unit` | 단위 |
| `src` | 출처 ID. 출처 없이 정한 가정값(`sigma_scale`, `sigma_qty_default`, `mc_iterations`, `sigma_by_quality`)은 빈 문자열 |
| `quality` | `direct`, `proxy`, `assumption` 가운데 하나 |
| `sigma` | 이 값 자체의 불확실성(로그정규 σ). 몬테카를로에서는 `cook_mj_per_kg`, `waste_rate`, `waste_treatment_kgco2e_per_kg`의 σ만 씀 |
| `note` | 설명 |

- **공개 여부**: 공개.

| 이름 | 값 | 단위 | 출처 | 앱에서 |
|---|---|---|---|---|
| `elec_kgco2e_per_kwh` | 0.4173 | kgCO2e/kWh | S009 | 전기 조리(`fuelFactor`), 교육 모듈의 스마트폰·전기 환산 |
| `gas_kgco2e_per_mj` | 0.0561 | kgCO2e/MJ | S008 | 도시가스 조리(`fuelFactor`) |
| `cooking_fuel_default` | `"gas"` | — | S008 | 기본 연료 |
| `cook_mj_per_kg` | 끓임·조림·찜·데침·기타 3.5 / 볶음·부침·튀김 7.5 / 구이 8.5 / 무가열·완제품 0 | MJ/kg 재료 | S006 | 조리 에너지. 가열 방식이 없으면 `기타` |
| `waste_rate` | 0.15 | 조리량 대비 비율 | S011 | 음식물 쓰레기 비율 |
| `waste_treatment_kgco2e_per_kg` | 0.1756 | kgCO2e/kg 습중량 | S007 | 쓰레기 처리(퇴비화) 계수 |
| `sigma_scale` | 0.15 | 로그정규 σ | — | 분량 배율의 불확실성 |
| `sigma_qty_default` | 0.35 | 로그정규 σ | — | p25·p75가 없을 때 분량 불확실성(`Engine.sigmaQ`, engine.js 143행) |
| `mc_iterations` | 2000 | 회 | — | 몬테카를로 반복 수 |
| `truck_kgco2e_per_tkm` | 0.192 | kgCO2e/t·km | S002 | 읽지 않음(note: 유통값에 이미 포함) |
| `self_sufficiency_beef` | 0.42 | 비율 | S002 | 읽지 않음. 소고기 계수의 국내산 비중과 같은 값 |
| `self_sufficiency_pork` | 0.71 | 비율 | S002 | 읽지 않음. 돼지고기 계수의 국내산 비중과 같은 값 |
| `self_sufficiency_chicken` | 0.75 | 비율 | S002 | 읽지 않음. 닭고기 계수의 국내산 비중과 같은 값 |
| `imported_beef_shares` | US 0.47, AU 0.47, NZ 0.03 | 비율 | S002 | 읽지 않음. 소고기 `components`의 수입 비중(합 0.97을 정규화)과 맞음 |
| `mil_kcal_per_day` | 3000 | kcal/일 | S010 | 읽지 않음 |
| `gwp` | CH4 28, N2O 265 | kgCO2e/kg | S002 | 읽지 않음. 쓰레기 처리 계수 0.1756을 만들 때 쓴 값(S007 비고) |
| `sigma_by_quality` | direct 0.3, direct_product 0.2, group_mean 0.35, proxy 0.45, pending 0.6, assumption 0.5 | 로그정규 σ | — | 읽지 않음. 계수의 `sigma`를 정한 대응표 |
| `national_daily_kgco2e` | 5.08 | kgCO2e/인·일 | S003 | 읽지 않음 |
| `national_daily_kcal` | 2000 | kcal/인·일 | S003 | 읽지 않음 |

'읽지 않음'은 현재 앱 코드(`app.bundle.js`, `rolehub.js`)에서 이 이름을 찾을 수 없다는 뜻입니다. 기록용이거나 DB를 만들 때 참고한 값입니다.

### 5.3 sources(출처)

- **용도**: 계수·파라미터·세그먼트가 인용하는 출처 목록입니다.
- **구조**: `{ 출처ID: {source_id, title, publisher, url, year, accessed, license, boundary, region, note} }`

| 필드 | 뜻 |
|---|---|
| `source_id` | 출처 ID. 키와 같음 |
| `title`, `publisher`, `url`, `year` | 서지 정보 |
| `accessed` | 확인한 날짜 |
| `license` | 이용 조건 |
| `boundary` | 이 앱이 쓴 범위(어느 배출 단계를 다루는지) |
| `region` | 지역 |
| `note` | 이 앱에서 쓴 값과 참고 |

- **코드**: `Engine.provenance`(engine.js 560행)가 ID로 제목·URL을 찾습니다. dash.js의 출처 표(dash.js 1048행)는 각 기록의 `source_id`를 씁니다.
- **코드에 적힌 출처 번호**: 화면과 `provenance`의 출처 번호 가운데 일부는 데이터가 아니라 코드에 적혀 있습니다.
  - '계산 방법' 탭의 출처 버튼은 `L("S001", "S002", "S003")`처럼 ID를 직접 적습니다. 레시피 설명과 기준 식단 설명에는 `S012`가 붙습니다(dash.js 1029·1032행).
  - `Engine.provenance`도 분량의 근거에 `S012`를 코드로 붙입니다(engine.js 569~613행).
  - 그래서 자기 레시피로 DB를 채웠다면 `sources`의 S012 기록을 자기 자료 설명으로 바꿔야 합니다. 그대로 두면 여러분 데이터의 출처가 '급식회사 내부 조리지침서(비공개)'로 나옵니다.
- **공개 여부**: 공개. S012는 제목을 '급식회사 내부 조리지침서(비공개)'로, 발행처를 '비공개'로 바꾸고 URL을 비웠습니다. 이용 조건과 비고도 바꿔 적었고, 연도·확인일·범위·지역 필드는 뺐습니다.

**출처 12개**(`data/sources.json`)

| ID | 제목 | 발행처 | 이용 조건 | 이 앱에서 |
|---|---|---|---|---|
| S001 | Reducing food's environmental impacts through producers and consumers (data via Our World in Data: ghg-per-kg-poore, food-emissions-supply-chain) | Poore J., Nemecek T., Science 360(6392) / Our World in Data | CC BY (OWID) | 배출계수 126종의 근거(단독 또는 함께) |
| S002 | 고기, 농장에서 매장까지; 육류 소비의 전과정 탄소발자국 분석 | 기후솔루션(Solutions for Our Climate) | 보도자료 공개 | 계수 5종(육류 4종, 조리완제품), 자급률·수입 비중 파라미터 |
| S003 | Development of the Food Systems-Related Greenhouse Gas Emissions Factor Database Using the KNHANES (2016-2018) | Hong JY, Kim MK. Environmental Health Perspectives 133(6), DOI 10.1289/EHP15534 | open access | 계수 43종(식품군 평균 41종 포함) |
| S004 | 통계자료를 활용한 국내 과수 농산물의 전과정평가 연구 | 이지선 외, 한국기후변화학회지 13(6) | 학술지 | 목록에만 있음(note: kg당 환산 보류) |
| S005 | 환경성적표지 인증제품 유효현황(2025.12.31) - 유효인증현황 시트, 탄소발자국 항목 | 기후에너지환경부 사전정보공표 | 공공데이터 | 제품값 계수 10종 |
| S006 | Environmental impact of the main household cooking systems - A survey | Italian Journal of Food Science | open access | `cook_mj_per_kg` |
| S007 | 2006 IPCC Guidelines for National GHG Inventories, Vol.5 Ch.4 Biological Treatment of Solid Waste, Table 4.1 | IPCC | public | `waste_treatment_kgco2e_per_kg` |
| S008 | 2006 IPCC Guidelines Vol.2 Energy, Ch.2 Table 2.2 default CO2 emission factors | IPCC | public | `gas_kgco2e_per_mj` |
| S009 | 2023년 전력배출계수 확정 공표 | 기후에너지환경부 (에너지신문 2025-12-18 보도) | 보도자료 | `elec_kgco2e_per_kwh` |
| S010 | 군 급식 1일 영양 기준 | 국방부 / 육군훈련소 (식품음료신문 2017-01-24 보도) | 공개 | `mil_kcal_per_day`, 분량 배율 근거 |
| S011 | 군부대 환경 통계, 급식 잔반량 감소 도움된다 | 대한급식신문 | 보도 | `waste_rate` |
| S012 | 급식회사 내부 조리지침서(비공개) | 비공개 | 비공개 — 이 저장소의 공개 데이터에는 포함하지 않음 | 분량 데이터(6·7장) |

제목이 긴 S006, S008~S011은 괄호나 콜론 뒤를 줄였습니다. 전체 제목은 `data/sources.json`에 있습니다.
'이 앱에서'의 개수는 `emission_factors.json`의 `sources` 필드를 센 것입니다.

결과 화면의 환산 카드(승용차 km, 스마트폰 충전, 소나무)에 쓰는 S013~S015는 DB가 아니라 `dash.js` 코드 안(dash.js 239행)에 있습니다.

---

## 6. 분량 데이터(비공개): recipes · core_index · templates · global_qty · segments · complete_segments

이 장의 항목은 모두 비공개입니다. 급식회사 내부 조리지침서(S012)에서 만든 값이기 때문입니다. 아래 예시는 모두 **형식 예시(실제 값 아님)** 입니다.

### 6.0 공통 개념

- **블록**: 조리지침서에 메뉴가 한 번 나온 기록입니다. 레시피 1건에 해당합니다. 화면에는 '레시피 N건'으로 나옵니다(dash.js 915행).
- **세그먼트**: 급식 대상(기관·연령) 묶음입니다. 대상마다 1인분 양이 다릅니다.
- **기준 세그먼트**: 분량을 정규화한 기준입니다. 현재 DB는 `지역아동센터`입니다(engine.js 574행의 문구). 분량 배율이 1입니다.
- **앱이 쓰는 세그먼트**: 성인 구내식당 `산업체오피스` 하나입니다(dash.js 7행, app.js 5행에 이름이 적혀 있음).
- **분량 튜플**: 여러 항목이 같은 다섯 칸 배열을 씁니다.

| 위치 | 뜻 | 단위 |
|---|---|---|
| 0 | 포함률: 그 재료가 나온 블록의 비율 | 0~1 |
| 1 | 1인분 분량 중앙값 | g(기준 세그먼트) |
| 2 | 1인분 분량 25% 분위수(p25) | g |
| 3 | 1인분 분량 75% 분위수(p75) | g |
| 4 | 건수. 엔진은 읽지 않음(뜻은 [10.2](#102-확인하지-못한-것)) | 건 |

엔진은 0~3번만 읽습니다. 4번은 읽지 않습니다.
포함률은 계산에서 분량의 가중치(포함률 × 중앙값)이고, 몬테카를로에서는 그 재료가 들어갈 확률입니다.
p25와 p75로 분량 불확실성 σ = min(1, ln(p75/p25) ÷ 1.349)를 구합니다(`Engine.sigmaQ`, engine.js 143행).

### 6.1 recipes(레시피)

- **용도**: 메뉴 이름별 재료 1인분 분량 분포입니다. 가장 먼저 찾는 자료입니다.
- **구조**: `{ 정규화한 메뉴 이름: {n, segs, base, seg} }`. 키는 `Engine.normalize`를 거친 이름이라 공백이 없습니다.

| 필드 | 형식 | 뜻 |
|---|---|---|
| `n` | 정수 | 블록 수 |
| `segs` | `{세그먼트: 블록 수}` | 세그먼트별 블록 수. 합이 `n` |
| `base` | `{표준재료: 분량 튜플}` | 기준 세그먼트로 정규화한 분량 |
| `seg` | `{세그먼트: {표준재료: 분량 튜플}}` | 그 세그먼트 자체의 분량. 있으면 배율 없이 그대로 씀. 현재 DB에서는 모두 비어 있음 |

- **코드**: `Engine.resolve`(engine.js 151행)
  - `n`: 계열 레시피를 합칠 때 가중치(engine.js 209~230행), 이름에 든 레시피가 여럿일 때 순서(engine.js 194행), 화면의 '레시피 N건'.
  - `segs`: `complete_segments`의 블록이 있으면 템플릿 보충을 하지 않음(engine.js 231·242·248행).
  - `base`: 분량 × 세그먼트 배율(engine.js 244~247행).
  - `seg`: 앱 세그먼트의 분량이 있으면 그대로 씀(engine.js 236~242행).
  - 화면: '계산 방법' 탭의 레시피 수(dash.js 1029행).
- **예시(형식 예시, 실제 값 아님)**

```json
"recipes": {
  "예시국밥": {
    "n": 4,
    "segs": {"세그먼트A": 3, "세그먼트B": 1},
    "base": {
      "소고기": [1.0, 50, 40, 60, 4],
      "쌀":     [1.0, 100, 90, 110, 4],
      "무":     [0.5, 20, 10, 30, 2]
    },
    "seg": {}
  }
}
```

### 6.2 core_index(레시피 색인)

- **용도**: 수식어나 제품명이 붙은 이름을 레시피로 이어 줍니다. 예: 수식어를 뺀 핵심 이름이 같으면 같은 레시피를 씁니다.
- **구조**: `{ 핵심 이름: recipes의 키 }`. 핵심 이름은 `Engine.coreKey(이름)`(engine.js 119행)입니다. 단어 가운데 `수식어`와 `제품명`을 빼고 나머지를 이어 붙인 문자열입니다.
- **만드는 규칙**: 레시피마다 핵심 이름을 구하고, 같은 핵심 이름의 레시피가 여럿이면 블록 수(`n`)가 가장 많은 레시피를 가리키게 합니다. 현재 DB는 대부분 이 규칙대로 되어 있지만 몇 개는 다릅니다(이전 사전으로 만든 키, 손으로 뺀 키). 손으로 뺀 키 일부는 `meta.core_index_removed`에 적어 두었습니다.
- **빈 키 주의**: 이름이 수식어·제품명으로만 되어 있으면 핵심 이름이 빈 문자열(`""`)이 됩니다. 이 키를 넣으면 수식어만 입력한 이름(예: '매콤')도 그 레시피로 계산됩니다. 빈 키는 넣지 마세요(9.4의 코드).
- **코드**: `Engine.resolve`(engine.js 179~182행). 정확히 같은 이름의 레시피가 없을 때 두 번째로 찾습니다.
- **예시(형식 예시, 실제 값 아님)**: `{"예시국밥": "예시국밥", "예시볶음": "매콤예시볶음"}`. 레시피 '매콤예시볶음'의 핵심 이름은 수식어 '매콤'을 뺀 '예시볶음'입니다. 그래서 '예시볶음'이나 '얼큰예시볶음'도 이 레시피로 계산합니다.

### 6.3 templates(조리법 템플릿)

- **용도**: 레시피가 없는 메뉴를 조리법으로 어림할 때 씁니다. 조리법마다 흔한 재료와 분량입니다.
- **구조**: `{ 조리법: {n, n_complete, mode, slots, ings} }`. 키는 조리법 이름입니다. `methods`의 조리법 이름에 더해, `parse`가 붙이는 `기타`도 키로 씁니다.

| 필드 | 형식 | 뜻 | 엔진이 읽나 |
|---|---|---|---|
| `n` | 정수 | 이 조리법의 블록 수 | 읽지 않음 |
| `n_complete` | 정수 | 그 가운데 `complete_segments`의 블록 수 | 읽지 않음 |
| `mode` | 문자열 | 가열 방식 | 읽지 않음(가열 방식은 `methods`에서 옴) |
| `slots` | `{주재료·부재료·양념·유지: [중앙값, p25, p75, 블록 수] 또는 null}` | 역할별 분량 분포(g) | `주재료`만 읽음 |
| `ings` | `{표준재료: 분량 튜플}` | 이 조리법 블록의 재료별 분포 | 읽음 |

- **코드**: `Engine.resolve`의 2단계(engine.js 265~304행)와 1단계 보충(engine.js 256~263행). `slots.주재료`가 `null`이면 `global_qty` 또는 기본값을 씁니다.
- **예시(형식 예시, 실제 값 아님)**

```json
"templates": {
  "국밥": {
    "n": 10, "n_complete": 0, "mode": "끓임",
    "slots": {"주재료": [60, 40, 80, 10], "부재료": null, "양념": null, "유지": null},
    "ings": {"쌀": [0.9, 100, 80, 120, 9], "대파": [0.5, 5, 3, 8, 5]}
  }
}
```

### 6.4 global_qty(재료별 분량)

- **용도**: 조리법과 상관없이, 재료 하나가 1인분에 보통 얼마나 들어가는지입니다.
- **구조**: `{ 표준재료: 분량 튜플 }`. 엔진은 1~3번(중앙값, p25, p75)만 읽고 포함률은 1로 둡니다.
- **코드**: `Engine.resolve`의 2·3단계와 이름에만 있는 재료(engine.js 253·276~289·307행). 재료가 없으면 코드의 기본값을 씁니다.

| 상황 | 기본값(중앙값, p25~p75) |
|---|---|
| 주재료, 3단계 재료, 이름에만 있는 재료 | 30g (20~45) |
| 템플릿의 부재료 | 15g (10~25) |
| 양념·유지·수분 | 3g (2~5) |

- **예시(형식 예시, 실제 값 아님)**: `{"소고기": [0.2, 40, 30, 50, 100], "대파": [0.5, 5, 3, 8, 250]}`

### 6.5 segments(세그먼트)

- **용도**: 급식 대상별 1인분 양의 배율입니다.
- **구조**: `{ 세그먼트: {scale, basis, src, sigma} }`

| 필드 | 뜻 | 코드에서 |
|---|---|---|
| `scale` | 기준 세그먼트 대비 분량 배율(기준 = 1) | 모든 g 분량에 곱함(engine.js 154행). `recipe-seg`에는 곱하지 않음 |
| `basis` | 배율의 근거를 적은 문장 | '계산 방법' 탭(dash.js 1029행), `provenance` |
| `src` | 출처 ID(S010, S012 등) | `provenance` |
| `sigma` | 배율의 불확실성 | `provenance`에만 담김. 몬테카를로는 `parameters.sigma_scale`을 씀 |

- **코드**: `resolve`는 세그먼트가 없으면 배율 1로 계산합니다. 하지만 dash.js는 시작할 때 `segments["산업체오피스"].scale`을 읽고(dash.js 8행), `provenance`는 `src`·`scale`·`basis`를 읽습니다. 그래서 `산업체오피스`가 꼭 있어야 합니다.
- **예시(형식 예시, 실제 값 아님)**

```json
"segments": {
  "지역아동센터": {"scale": 1,   "basis": "기준 세그먼트(형식 예시)", "src": "S012", "sigma": 0},
  "산업체오피스": {"scale": 2.0, "basis": "배율 근거 문장(형식 예시)", "src": "S012", "sigma": 0.1}
}
```

### 6.6 complete_segments(기본양념까지 적힌 세그먼트)

- **용도**: 조리지침서에 기본양념·유지·향미채소·쌀까지 적혀 있는 세그먼트 목록입니다. 기준 세그먼트의 지침서는 이런 재료를 생략한다고 적혀 있습니다(engine.js 602행의 문구).
- **구조**: 세그먼트 이름 배열.
- **코드**: 레시피에 이 세그먼트의 블록이 하나라도 있으면(`hasComplete`), 템플릿으로 기본양념 등을 보충하지 않습니다(engine.js 231·242·248·256행). 보충 대상은 `rules.season_cats`의 분류, `grain_like`, `complete_extra`의 재료 가운데 포함률이 `presence_min` 이상인 것입니다.
- **예시(형식 예시, 실제 값 아님)**: `["세그먼트C"]`

### 6.7 엔진이 분량을 고르는 순서

`Engine.resolve`(engine.js 151행)는 위 자료를 다음 순서로 찾습니다. 결과의 `tier`가 계산 단계이고, 재료마다 `origin`에 출처가 적힙니다.

| 계산 단계(`tier`) | 조건 | 분량 | `origin` |
|---|---|---|---|
| 1 레시피 | 아래 네 가지(exact·core·family·contained) 가운데 하나로 레시피를 찾음 | 레시피 분량 | `recipe-seg`, `recipe-base`, `recipe-family`, `template-named`, `template-supplement` |
| 2 템플릿 | 레시피는 없고 조리법 템플릿이 있음 | 이름의 재료 + 템플릿 | `template-named`, `template-slot`, `template-sub`, `template-hidden`, `template-unknown-main` |
| 3 재료 평균 | 템플릿도 없고 이름에서 재료를 찾음 | `global_qty` 또는 기본값 | `global-std` |
| 4 모름 | 레시피·템플릿이 없고 이름에서 재료도 못 찾음(조리법을 찾았어도 템플릿이 없으면 여기에 옴) | 없음 | 합계를 `corpus.weighted_median`으로 대신함(조건은 아래) |

1단계에서 레시피를 찾는 순서(`how`에 기록)는 다음과 같습니다.

1. **exact**: `recipes[정규화한 이름]`
2. **core**: `recipes[core_index[coreKey(이름)]]`
3. **family**: 이름이 2글자 이상이고, 이 이름으로 끝나는 다른 레시피가 `rules.family_min`개 이상이면 모두 합칩니다. 재료마다 블록 수로 가중한 중앙값을 씁니다.
4. **contained**: 이름이 4글자 이상이고 어떤 레시피 이름(`contained_min_len`글자 이상)으로 끝나면, 그 가운데 가장 긴 레시피를 씁니다.
   - 형식 예시: 레시피 '예시국밥'이 있으면 '특제예시국밥'은 '예시국밥'의 레시피를 씁니다.
   - 이름에는 있지만 그 레시피에 없는 재료는 템플릿이나 `global_qty`로 더합니다.

`how`는 1단계일 때만 뜻이 있습니다. 2~4단계에서는 기본값 `exact`가 그대로 남습니다.

그 밖의 규칙입니다.

- **조리법만 있는 메뉴**: 2단계이고, 이름에 식재료가 없고, 템플릿 식재료가 20g 미만이면 `corpus.method_prior`를 씁니다(engine.js 388~412행). 이때 `emissions`의 `fallback`은 `"method"`입니다.
- **4단계 대체값**: 이름에 한글이 있고 '행사', '연휴', '적용', 'REF', '없음', '휴무', '방학', '명절'이 없을 때만 대체값(`corpus.weighted_median`)을 씁니다. 그 밖에는 0입니다(engine.js 435~438행). 이때 `fallback`은 `true`입니다.
- **대체값으로 계산한 메뉴**(위 두 경우)는 이렇게 다룹니다.
  - 화면에는 '모르는 메뉴예요'로 나옵니다(dash.js 304행). 안내 상자에는 `method_prior`를 쓴 경우에도 '기존 식단 데이터의 중간값으로 대신했어요'라고 나옵니다(dash.js 323~324행).
  - 대체 메뉴를 제안하지 않습니다(dash.js 103행).
  - 주소의 `?a=`·`?b=`로 교육 모듈 메뉴를 정할 때 받지 않습니다(app.js 86행).
  - 몬테카를로에서는 합계 전체를 흔듭니다(5.1 '불확실성').
- **식물성 메뉴**: 이름에 `rules.plant_signal`의 단어가 있으면 고기·생선 재료를 `식물성대체육`으로 바꿉니다(engine.js 159~171·312~340행).
  - 대체육 양이 `plant_exclude_min_g` × 배율 이상이면 메뉴 전체를 계산에서 빼고(`excluded: "plant"`), 화면에 '아직 계산하지 않아요'라고 보여 줍니다.
  - 그보다 적으면 `식물성대체육` 항목을 재료 목록에서 지우고, 나머지 재료로만 계산합니다.

---

## 7. corpus(비공개)

- **용도**: 기존 식단표에 나온 메뉴의 빈도와 배출량 분포입니다. 입력창 자동완성, 대체 메뉴 제안, 모르는 메뉴의 대체값에 씁니다.
- **공개 여부**: 비공개. 내부 식단표(S012)에서 만든 값입니다.
- **구조와 코드**

| 필드 | 구조 | 코드에서 | 없으면 |
|---|---|---|---|
| `freq` | `{메뉴: 나온 횟수}` | 자동완성 순서(dash.js 134행), 대체 메뉴 순서와 최소 3회 조건(dash.js 110행) | `results`를 채우면 필요 |
| `results` | `{메뉴: [계산 단계, 1인분 kg CO₂e, 역할, 조리법]}` | 자동완성 후보(dash.js 132행), 대체 메뉴 후보(dash.js 107행) | 빈 객체면 자동완성·대체 메뉴가 없음. 키를 빼면 dash.js가 시작할 때 멈추고 교육 모듈도 뜨지 않음 |
| `menu_bounds` | 숫자 4개 배열 | `Engine.menuGrade`(engine.js 546행): A~E 등급 경계 | 지금 화면은 부르지 않음 |
| `meal_bounds` | `{세그먼트: {bounds, n, median, quantiles, by_meal, day}}` | `Engine.mealGrade`(engine.js 547행) | 지금 화면은 부르지 않음 |
| `method_prior` | `{조리법: {median, shares, mass_g, n}}` | `Engine.emissions`(engine.js 388행): 조리법만 있는 메뉴 | 생략 가능(`&&`로 확인함) |
| `weighted_median` | 숫자(kg CO₂e/1인분) | 4단계 메뉴의 합계(engine.js 438행), 화면 안내 문구(dash.js 324행) | 필수 |
| `hidden` | `{메뉴: 목록에서 뺀 이유}` | 읽지 않음 | 생략 가능 |

**results 튜플**

| 위치 | 뜻 |
|---|---|
| 0 | 계산 단계(`tier`, 1~4) |
| 1 | 1인분 kg CO₂e. 기준 세그먼트(배율 1) 기준으로 빌드 때 계산해 둔 값 |
| 2 | 메뉴 역할. dash.js `g()`와 같은 이름(`김치`, `밥`, `국·찌개`, `면`, `간식·후식`, `주찬`, `부찬`, `기타`) |
| 3 | 조리법 |

- **자동완성**(dash.js 132행): 계산 단계가 3 이하이고 이름에 `/`, `+`가 없는 메뉴를 `freq` 순으로 보여 줍니다.
- **대체 메뉴**(`y()`, dash.js 101행): 후보 조건은 다음과 같습니다.
  1. `results`에서 1단계로 계산됐고, 역할이 같습니다.
  2. 배출량이 0.05 이상이고 지금 메뉴의 절반 이하입니다. 두 값 모두 기준 세그먼트 기준입니다.
  3. `freq`가 3 이상이고, 이름에 `/`·`&`·`+`가 없습니다.
  - 같은 조리법 후보가 있으면 그것만 봅니다.
  - 핵심 이름(`coreKey`)이 같은 후보는 하나만 남깁니다.
  - 후보는 다시 계산해 실제로 줄어드는 것만 남깁니다.
  - 단백질 재료(`protein_stds`·`protein_like_stds`)가 든 메뉴는 단백질 재료가 든 메뉴로만 바꿉니다.
  - 지금 메뉴가 0.15 미만이거나, 역할이 `김치`·`기타`이거나, 대체값으로 계산한 메뉴면 제안하지 않습니다.
- **시뮬레이터**: '고기 메뉴 줄이기'는 대체 메뉴 가운데 소고기가 없는 첫 메뉴로 바꿉니다(`Q()`, dash.js 457행). 대체 메뉴가 없으면 그 막대를 움직여도 바뀌지 않습니다.

**method_prior 기록**: `median`(기준 세그먼트 1인분 kg CO₂e, 배율을 곱해 씀), `shares`(`production`·`processing`·`distribution`·`consumption`·`disposal` 비율, 합 1), `mass_g`(재료 질량), `n`(건수. 무엇을 센 값인지 코드로는 알 수 없고, 엔진은 읽지 않음).

**meal_bounds 기록**: `bounds`(등급 경계 4개), `n`(끼니 수), `median`, `quantiles`(분위수 배열), `by_meal`(끼니 이름별로 같은 구조: `아침`, `점심`, `저녁`, `오전간식`, `오후간식`), `day`(`n`, `median`, `quantiles`, `meals_per_day`).

`weighted_median`은 화면에 '기존 식단 데이터의 중간값'으로 나옵니다. 만드는 방법은 [10.2](#102-확인하지-못한-것)에 적었습니다.

**예시(형식 예시, 실제 값 아님)**

```json
"corpus": {
  "freq": {"예시국밥": 10, "예시나물": 12},
  "results": {"예시국밥": [1, 1.0, "국·찌개", "국밥"], "예시나물": [2, 0.1, "부찬", "나물"]},
  "menu_bounds": [1, 2, 3, 4],
  "meal_bounds": {
    "세그먼트A": {
      "bounds": [1, 2, 3, 4], "n": 100, "median": 2.5, "quantiles": [1, 2, 3],
      "by_meal": {"점심": {"bounds": [1, 2, 3, 4], "n": 50, "median": 2.5, "quantiles": [1, 2, 3]}},
      "day": {"n": 20, "median": 5, "quantiles": [4, 5, 6], "meals_per_day": 2}
    }
  },
  "method_prior": {
    "국밥": {"median": 1.0, "mass_g": 300, "n": 10,
             "shares": {"production": 0.6, "processing": 0.1, "distribution": 0.1, "consumption": 0.1, "disposal": 0.1}}
  },
  "weighted_median": 1.0,
  "hidden": {"예시메뉴": "목록에서 뺀 이유(형식 예시)"}
}
```

---

## 8. meta(비공개)

- **용도**: DB를 만든 때의 기록입니다. 앱 코드는 읽지 않습니다.
- **공개 여부**: 비공개. 내부 자료의 건수가 들어 있습니다. 공개판 목록은 `data/MANIFEST.json`이 대신합니다.

| 필드 | 형식 | 뜻 |
|---|---|---|
| `version` | 문자열 | DB 버전 |
| `built` | 문자열(날짜) | 만든 날 |
| `baseline_segment` | 문자열 | 기준 세그먼트 이름 |
| `base_kcal` | 정수 | 뜻을 확인하지 못함([10.2](#102-확인하지-못한-것)) |
| `n_recipes`, `n_blocks`, `n_templates`, `n_factors`, `n_corpus_menus` | 정수 | 항목별 건수 |
| `decisions` | 정수 배열 | 번호 목록. 뜻은 [10.2](#102-확인하지-못한-것) |
| `stages` | 문자열 배열 | 결과 묶음 이름(`production`, `processing`, `distribution`, `consumption`, `disposal`) |
| `core_index_removed` | 문자열 배열 | `core_index`에서 손으로 뺀 키(일부) |
| `patched` | 문자열 | 고친 내용 기록 |

**예시(형식 예시, 실제 값 아님)**

```json
"meta": {
  "version": "v0.0-예시", "built": "2000-01-01", "baseline_segment": "세그먼트A", "base_kcal": 0,
  "n_recipes": 0, "n_blocks": 0, "n_templates": 0, "n_factors": 0, "n_corpus_menus": 0,
  "decisions": [1, 2], "stages": ["production", "processing", "distribution", "consumption", "disposal"],
  "core_index_removed": [], "patched": "2000-01-01 고친 내용(형식 예시)"
}
```

---

## 9. 내 데이터로 채우기

이 장은 비공개 항목을 여러분 데이터로 채우는 방법을 자세히 적습니다. 앱을 묶고 화면을 확인하는 전체 순서는 [제작 가이드 5장](BUILD_GUIDE.md#5-내-식당-데이터로-만들기)에 있습니다.

비공개 항목을 빈 구조로 두어도 계산 엔진과 시뮬레이터 계산은 오류 없이 돕니다(Node.js로 확인). 항목 키 자체를 빼면 안 됩니다(9.2). 이때 모든 메뉴는 3단계(재료 평균)나 4단계(모름)로 계산됩니다. 화면 전체가 어떻게 동작하는지는 브라우저에서 확인하지 않았습니다. 묶은 뒤 브라우저에서 확인하세요.
여러분 식당의 레시피와 식단표로 비공개 항목을 채우면 1·2단계 계산이 살아납니다.

### 9.1 최소 구조

아래 스크립트를 저장소 맨 위 폴더에서 실행하면 `my_payload.json`이 생깁니다.

```python
import json
d = lambda p: json.load(open("data/" + p, encoding="utf-8"))
P = {
    # 공개 데이터 그대로
    "rules": d("dictionary/rules.json"), "sources": d("sources.json"), "parameters": d("parameters.json"),
    "tokens": d("dictionary/tokens.json"), "methods": d("dictionary/methods.json"),
    "alias": d("dictionary/alias.json"), "std_category": d("dictionary/std_category.json"),
    "factors": d("emission_factors.json"),
    # 직접 채울 부분(빈 구조)
    "segments": {"산업체오피스": {"scale": 1, "basis": "우리 식당 1인분 그대로", "src": "", "sigma": 0}},
    "complete_segments": [],
    "recipes": {}, "core_index": {}, "templates": {}, "global_qty": {},
    "corpus": {"weighted_median": 1.0, "results": {}, "freq": {}},  # 1.0은 형식 예시(실제 값 아님)
}
json.dump(P, open("my_payload.json", "w", encoding="utf-8"), ensure_ascii=False)
```

- `weighted_median`은 모르는 메뉴에 쓸 1인분 배출량(kg CO₂e)입니다. 여러분 식단표의 값으로 바꾸세요.
- 분량을 성인 1인분 그대로 적는다면 `산업체오피스`의 `scale`을 1로 두면 됩니다.
- `sources`의 S012 기록은 공개판 그대로면 '급식회사 내부 조리지침서(비공개)'입니다. 자기 레시피를 채웠다면 자기 자료 설명으로 바꾸세요(5.3).

이 구조로 돌려 본 결과입니다(Node.js).

- '소고기국밥'은 3단계로, 소고기 30g(기본값)으로 계산됩니다.
- 코드에 고정된 예시 4주 식단은 한 메뉴(무생채)만 4단계이고 나머지는 모두 3단계입니다([10.1](#101-주의할-점)).
- `corpus.results`가 비어 있어 '고기 메뉴 줄이기' 막대는 효과가 없습니다.

### 9.2 항목이 비었을 때

| 항목 | 최소 형태 | 비었을 때 일어나는 일 |
|---|---|---|
| `rules`, `tokens`, `alias`, `methods`, `std_category` | 공개 파일 | 필수. 엔진이 확인 없이 읽습니다 |
| `factors` | 공개 파일 | 필수. `기타채소`가 있어야 합니다 |
| `parameters` | 공개 파일 | 필수. 5.2의 '앱에서' 칸에 쓰임이 적힌 9개가 있어야 합니다 |
| `sources` | 공개 파일 | 출처 표와 근거 표시에 씁니다. 각 기록에 `source_id`가 있어야 합니다 |
| `segments` | `산업체오피스` 하나 | 이 키가 없으면 dash.js가 시작할 때 멈춥니다. 같은 묶음으로 실행되는 교육 모듈(app.js)도 뜨지 않습니다 |
| `complete_segments` | `[]` | 레시피마다 템플릿으로 기본양념 등을 보충합니다(템플릿이 있을 때) |
| `recipes` | `{}` | 1단계를 건너뜁니다 |
| `core_index` | `{}` | 수식어·제품명이 붙은 이름을 레시피로 잇지 못합니다. contained 방식(이름 끝이 레시피 이름)은 그대로 됩니다 |
| `templates` | `{}` | 2단계와 레시피 보충을 건너뜁니다. 조리법을 찾았지만 재료가 없는 이름은 4단계가 됩니다 |
| `global_qty` | `{}` | 6.4의 기본값(30g, 15g, 3g)을 씁니다 |
| `corpus.weighted_median` | 숫자 | 필수. 없으면 4단계 메뉴의 합계가 숫자가 아니게 되고 화면에서 오류가 납니다 |
| `corpus.results`, `corpus.freq` | `{}` | 자동완성 제안과 대체 메뉴 제안이 없습니다. 시뮬레이터의 '고기 메뉴 줄이기' 막대가 효과가 없습니다. 키를 빼면 dash.js가 시작할 때 멈추고 교육 모듈도 뜨지 않습니다 |
| `corpus.method_prior` | 생략 | 조리법만 있는 메뉴도 템플릿 재료로 계산합니다 |
| `corpus.menu_bounds`, `meal_bounds`, `hidden` | 생략 | 지금 화면에서 쓰지 않습니다 |
| `meta` | 생략 | 코드가 읽지 않습니다 |

`rules.plant_signal`, `plant_replace_stds`, `slot_exempt_methods`, `plant_exclude_min_g`는 코드에 기본값이 있어 빠져도 됩니다. 나머지 `rules` 필드는 모두 있어야 합니다.

### 9.3 채우는 순서

1. **메뉴 이름부터 확인합니다.** 여러분 식단표의 메뉴가 `tokens`로 잘 나뉘는지 봅니다(9.4의 확인 방법). `미등록`이 많으면 `tokens`에 단어를 더하고, `alias`나 `methods`에도 같은 단어를 넣습니다. 제품명은 유형 `제품명`으로 더합니다.
2. **recipes를 채웁니다.** 레시피 1건을 블록 1개로 보고, 메뉴마다 재료별 1인분 g을 모읍니다.
   - 재료 이름은 표준 재료(`factors`의 키)로 바꿉니다.
   - 재료마다 포함률, 중앙값, p25, p75, 나온 블록 수를 계산해 `base`에 넣습니다.
   - 키는 공백 없는 메뉴 이름으로 씁니다.
3. **core_index를 만듭니다.** 6.2의 규칙대로 만듭니다(9.4의 코드).
4. **templates를 채웁니다.** 레시피를 조리법으로 묶고, 조리법마다 재료별 분량 튜플(`ings`)과 주재료 분량(`slots.주재료`)을 구합니다.
   - 조리법은 `methods` 값을 직접 보지 말고 `Engine.parse(이름).method`로 구하세요. 그래야 엔진이 찾는 키와 맞습니다.
   - `parse`는 단백질 재료만 있고 조리법 단어가 없는 이름(예: '소고기')에 조리법 `기타`를 붙입니다. 이런 메뉴가 있으면 `기타` 템플릿도 만드세요.
5. **global_qty를 채웁니다.** 모든 레시피를 재료별로 모아 분량 튜플을 구합니다.
6. **segments를 정합니다.** 대상이 하나면 `산업체오피스` 하나로 충분합니다. 여러 대상의 레시피를 섞었다면, 기준 대상을 정해 분량을 그 기준으로 나누고 대상별 `scale`을 적습니다.
7. **corpus를 채웁니다.** 식단표의 메뉴별 횟수로 `freq`를, 엔진 계산 결과로 `results`를 만듭니다(9.4의 코드). `weighted_median`도 함께 정합니다.
8. **sources의 S012를 바꿉니다.** 코드가 분량 근거에 `S012`를 붙이므로, 그 기록을 여러분 레시피 자료 설명으로 바꿉니다(5.3).

형식 예시(실제 값 아님): 레시피 3건에서 `base` 한 줄 만들기

| 블록 | 소고기 g |
|---|---|
| 1 | 40 |
| 2 | 50 |
| 3 | (없음) |

→ `"소고기": [0.667, 45, 42.5, 47.5, 2]` (포함률 2/3, 나온 블록의 중앙값·분위수, 나온 블록 수). 분위수를 구하는 방식은 원래 DB 코드에 없으므로 여러분이 정하면 됩니다.

### 9.4 확인하고 묶기

**계산 확인**(Node.js). 저장소 맨 위 폴더에 `check.js`로 저장하고 `node check.js`로 실행합니다.

```js
global.window = {};                                   // engine.js 끝의 window.Engine 대입용
const Engine = require("./src/readable/engine.js");
const P = require("./my_payload.json");
Engine.init(P);

const r = Engine.resolve("소고기국밥", "산업체오피스");
const e = Engine.emissions(r, {});
console.log(r.tier, r.how, r.ings.map((i) => `${i.std} ${i.med}g (${i.origin})`), e.total.toFixed(2));
console.log(Engine.parse(Engine.normalize("소고기국밥")).unknown);   // 미등록 단어
```

9.1의 최소 구조라면 `3 exact [ '소고기 30g (global-std)' ] 1.25`가 나옵니다.

**core_index 만들기**(같은 파일에 이어서)

```js
const ci = {};
for (const k of Object.keys(P.recipes)) {
  const c = Engine.coreKey(k);
  if (!c) continue;                 // 수식어·제품명만 있는 이름은 색인하지 않음
  if (!ci[c] || P.recipes[k].n > P.recipes[ci[c]].n) ci[c] = k;
}
P.core_index = ci;
```

**corpus.results 만들기**. 역할 판단은 `g()`(dash.js 72행)와 같아야 대체 메뉴 제안이 맞게 동작합니다.

```js
function role(res, rules) {
  const m = res.method, f = rules.roles;
  const protein = res.parse.stds.some((s) => rules.protein_stds.includes(s) || rules.protein_like_stds.includes(s));
  if (f.kimchi.includes(m)) return "김치";
  if (f.rice.includes(m)) return "밥";
  if (f.soup.includes(m)) return "국·찌개";
  if (f.noodle.includes(m)) return "면";
  if (f.snack.includes(m)) return "간식·후식";
  if (["볶음", "조림", "찜", "구이", "튀김", "전"].includes(m)) return protein ? "주찬" : "부찬";
  if (f.main.includes(m)) return "주찬";
  if (f.side.includes(m)) return protein && m === "잡채" ? "주찬" : "부찬";
  return protein ? "주찬" : "기타";
}
const BASE = "산업체오피스";   // 기준 세그먼트(배율 1)의 이름으로 바꾸세요
P.corpus.results = {};
for (const name of Object.keys(P.corpus.freq)) {
  const r = Engine.resolve(name, BASE), e = Engine.emissions(r, {});
  P.corpus.results[name] = [r.tier, Math.round(e.total * 1000) / 1000, role(r, P.rules), r.method];
}
require("fs").writeFileSync("my_payload.json", JSON.stringify(P));
```

**앱으로 묶기**. `src/build/`에는 `payload.json`이 없으므로 `--payload`를 꼭 붙입니다.

```bash
python3 tools/pack.py src/build my_index.html --payload my_payload.json
```

`my_index.html`을 브라우저로 열면 여러분 데이터로 계산합니다. 주소 뒤 `?a=메뉴&b=메뉴`로 교육 모듈의 두 메뉴를 바꿀 때는 1~3단계로 계산되고 대체값(`method_prior`·`weighted_median`)을 쓰지 않은 이름만 받습니다(app.js 86행). 식물성 대체육이라 계산에서 뺀 메뉴도 받지 않습니다.
묶은 뒤 확인할 항목은 [제작 가이드 5-4](BUILD_GUIDE.md#5-4-묶은-뒤-확인할-것)에 있습니다.

---

## 10. 알려진 빈칸과 주의할 점

### 10.1 주의할 점

- **분류가 빈 재료 4개**: `수수`, `귀리`, `양고기`, `식빵·기본빵`은 `factors`의 `category`가 비어 있고 `std_category`에도 없습니다. `Engine.cat`이 빈 문자열을 돌려주므로, 시뮬레이터의 재료군 그래프에서는 '가공식품·양념'으로 묶입니다.
- **식물성대체육**: `alias`의 값에는 있지만 `factors`와 `std_category`에는 없습니다. 검증된 배출계수가 없어 의도적으로 계산에서 뺍니다.
- **results는 빌드 때의 값**: `corpus.results`의 배출량은 DB를 만들 때 계산해 둔 값입니다. 배출계수를 바꾸면 대체 메뉴 후보를 거르는 기준이 어긋나므로 다시 만드세요. 화면에 보이는 숫자는 매번 새로 계산합니다.
- **세그먼트 이름이 코드에 있음**: 앱은 `산업체오피스`를 코드에 적어 두고 씁니다(dash.js 7행, app.js 5행). 다른 이름을 쓰려면 코드도 고쳐야 합니다.
- **출처 번호 S012가 코드에 있음**: '계산 방법' 탭(dash.js 1029·1032행)과 `Engine.provenance`(engine.js 569~613행)가 분량 근거에 `S012`를 코드로 붙입니다. 자기 데이터를 쓰면 `sources`의 S012 기록을 바꾸세요(5.3).
- **메뉴 이름이 코드에 있음**: 다음 메뉴는 DB가 아니라 코드에 적혀 있습니다. 여러분 DB에 이 메뉴의 레시피가 없으면 2~4단계로 어림하게 됩니다.
  - 예시 4주 기준 식단(`R`)과 고기 없는 날 식단(`K`): dash.js 405~427행
  - '메뉴별 CO₂e 비교'의 비교 조합(`T`): dash.js 347~356행
  - 기본 메뉴 소고기국밥·시래기국: dash.js 286·357·1027행, app.js 77행. 교육 모듈은 이 두 메뉴에만 전용 그림을 씁니다(app.js 154~157행).
  - 9.1의 최소 구조에서는 4주 식단 가운데 무생채만 4단계이고 나머지는 모두 3단계입니다. 메뉴를 바꾸는 방법은 [제작 가이드 4장](BUILD_GUIDE.md#4-자주-하는-수정)에 있습니다.
- **제품명을 뺀 사전**: 공개판 `tokens`로 DB를 만들면 같은 메뉴라도 라이브 사이트와 결과가 다를 수 있습니다(4.1).
- **쓰지 않는 값**: 현재 코드가 읽지 않거나 화면에 쓰지 않는 값입니다.
  - 파라미터 10개(5.2 표의 '읽지 않음')
  - `tokens`의 2~4번 칸, `factors`의 `category`
  - `factors`의 `quality`·`sources`·`basis`·`components`·`note`·`variants`(`provenance`에만 담기고 화면에는 나오지 않음)
  - `segments`의 `sigma`(`provenance`에만 담김)
  - 템플릿의 `n`·`n_complete`·`mode`, `slots` 가운데 `주재료` 밖의 칸
  - 분량 튜플의 4번 칸
  - `corpus.menu_bounds`·`meal_bounds`·`hidden`, `corpus.method_prior`의 `n`
  - `meta` 전체(`base_kcal` 포함)
- **S004**: 출처 목록에는 있지만 배출계수와 파라미터가 인용하지 않습니다(`note`: kg당 환산 보류).
- **엔진 함수 가운데 화면에서 부르지 않는 것**: `Engine.grade`, `Engine.menuGrade`, `Engine.mealGrade`, `Engine.parseInput`(식단표 글 읽기)은 정의만 되어 있습니다.

### 10.2 확인하지 못한 것

DB를 만든 코드가 이 저장소에 없어, 다음 값은 이름과 구조로만 뜻을 짐작했습니다.

| 값 | 짐작한 뜻 | 확인한 범위 |
|---|---|---|
| 분량 튜플의 4번 칸 | 그 재료가 나온 블록 수 | 레시피 블록 수(`n`)를 넘지 않지만, 포함률 × `n`과 모두 맞지는 않습니다 |
| `corpus.weighted_median` | 메뉴 빈도로 가중한 1인분 배출량 중앙값 | `results`와 `freq`로 다시 구하면 거의 같은 값이 나오지만, 정확히 같지는 않습니다 |
| `corpus.method_prior`의 `n` | 건수 | 같은 조리법의 `results` 수, 레시피 수, `templates.n`과 견줘 보았지만 맞지 않았습니다 |
| `meta.base_kcal` | 기준 세그먼트의 열량 기준 | 이름으로만 짐작했습니다 |
| `meta.decisions` | 적용한 방법론 결정 번호(계수·파라미터 비고의 '결정 5' 같은 번호) | 이름과 비고로만 짐작했습니다 |

`weighted_median`을 뺀 나머지는 엔진이 읽지 않습니다. 여러분 DB에서 위 뜻대로 채워도 계산 결과는 바뀌지 않습니다. `weighted_median`은 4단계 메뉴의 합계로 쓰이니 여러분 식단에 맞는 값을 정하세요.
