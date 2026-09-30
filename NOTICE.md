# 제3자 자료와 이용 조건

이 저장소에는 팀이 만든 코드·데이터 외에 다른 곳에서 온 자료가 함께 들어 있습니다. 항목마다 이용 조건이 다르니 다시 쓸 때 아래를 확인해 주세요.

## 라이선스 한눈에 보기

| 대상 | 위치 | 조건 |
|---|---|---|
| 코드 | `index.html`의 스크립트, `src/`, `tools/` | [MIT](LICENSE) |
| 데이터·문서 | `data/`, `docs/` | [CC BY 4.0](LICENSE-DATA.md) |
| 글꼴 | `src/build/fonts/`(그리고 `index.html` 안에 내장) | SIL OFL 1.1 — [전문](src/build/fonts/OFL.txt) |
| 일러스트·앱 로고 | `src/build/assets/`, `src/build/restaurant.svg`, 코드 안 식판 그림 | 팀 제작(AI 도구 활용 포함), MIT |
| 기관·기업 로고 | 아래 '로고' 참고 | 라이선스 대상 아님 |

## 글꼴

- **Noto Sans KR** (굵기 500·700·900, 사용하는 글자만 남긴 부분 글꼴)
- Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'
- SIL Open Font License 1.1로 배포합니다. 전문은 [`src/build/fonts/OFL.txt`](src/build/fonts/OFL.txt)에 있습니다.

## 일러스트

- 식판, 소, 쓰러진 소, 나무, 그루터기, 식당 배경, 앱 로고는 팀이 직접 만들었습니다. 일부는 AI 이미지 도구를 활용했습니다.
- 코드와 같은 MIT 조건으로 공개합니다. AI로 만든 그림에 저작권이 인정되는지는 나라마다 다를 수 있습니다.

## 로고

다음 로고는 각 기관·기업의 표장입니다. 이 저장소의 라이선스가 적용되지 않습니다. 앱을 다른 용도로 쓸 때는 빼거나 자기 로고로 바꿔 주세요.

| 로고 | 위치 |
|---|---|
| 국가기후위기대응위원회 | `src/build/assets/a92181de85.png` |
| 풀무원 CI | `src/build/shell.html`의 `<symbol id="ciPulmuone">` |

## 데이터 출처

배출계수와 계산 파라미터는 아래 자료를 바탕으로 팀이 정리했습니다. 정리한 결과(`data/`)는 CC BY 4.0이고, 원자료는 각 발행처의 조건을 따릅니다. 인용할 때는 원출처도 함께 밝혀 주세요.

| id | 자료 | 발행처 | 이용 조건(수집 당시 표기) |
|---|---|---|---|
| S001 | Reducing food's environmental impacts through producers and consumers | Poore & Nemecek, *Science* (2018) / Our World in Data | CC BY (Our World in Data) |
| S002 | 고기, 농장에서 매장까지: 육류 소비의 전과정 탄소발자국 분석 | 기후솔루션 | 보도자료 공개 |
| S003 | Food Systems-Related GHG Emissions Factor Database Using the KNHANES | Hong & Kim, *Environmental Health Perspectives* | 오픈 액세스 |
| S004 | 통계자료를 활용한 국내 과수 농산물의 전과정평가 연구 | 이지선 외, 한국기후변화학회지 | 학술지 |
| S005 | 환경성적표지 인증제품 유효현황 | 기후에너지환경부 | 공공데이터 |
| S006 | Environmental impact of the main household cooking systems | *Italian Journal of Food Science* | 오픈 액세스 |
| S007 | 2006 IPCC Guidelines, Vol.5 Ch.4 | IPCC | 공개 |
| S008 | 2006 IPCC Guidelines, Vol.2 Ch.2 | IPCC | 공개 |
| S009 | 2023년 전력배출계수 확정 공표 | 기후에너지환경부(에너지신문 보도) | 보도자료 |
| S010 | 군 급식 1일 영양 기준 | 국방부·육군훈련소 | 공개 |
| S011 | 군부대 급식 잔반량 관련 보도 | 대한급식신문 | 보도 |
| S012 | 급식회사 내부 조리지침서 | 비공개 | **공개하지 않음** |

자세한 서지 정보와 URL은 [`data/sources.csv`](data/sources.csv)에 있습니다.

## 공개하지 않은 것

S012에서 나온 레시피 분량 분포, 템플릿, 메뉴 빈도, 연령·기관별 배율은 공개 데이터에 포함하지 않았고, 위 라이선스도 적용되지 않습니다.
