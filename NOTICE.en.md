[한국어](NOTICE.md) | **English**

# Third-party materials and terms of use

Besides the code and data made by the team, this repository contains materials that come from elsewhere. Each item has its own terms of use, so please check the list below before reusing anything.

The English page (`en/index.html`) is built from the same fonts, illustrations and logos as the Korean page (`index.html`). The shared files live in `src/build/`, and everything below applies to both pages.

## License overview

| Covers | Location | Terms |
|---|---|---|
| Code | Scripts in `index.html` and `en/index.html`, `src/`, `tools/` | [MIT](LICENSE) |
| Data and documents | `data/`, `docs/` | [CC BY 4.0](LICENSE-DATA.md) |
| Font | `src/build/fonts/` (also embedded in `index.html` and `en/index.html`) | SIL OFL 1.1 — [full text](src/build/fonts/OFL.txt) |
| Illustrations and app logo | `src/build/assets/`, `src/build/restaurant.svg`, the tray drawing inside the code | Made by the team (partly with AI tools), MIT |
| Institution and company logos | See 'Logos' below | Not covered by any license |

## Font

- **Noto Sans KR** (weights 500 · 700 · 900, subset to only the characters used)
- Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'
- Distributed under the SIL Open Font License 1.1. The full text is in [`src/build/fonts/OFL.txt`](src/build/fonts/OFL.txt).

## Illustrations

- The tray, cow, fallen cow, tree, stump, cafeteria background and app logo were made by the team. Some were made with the help of AI image tools.
- They are released under the same MIT terms as the code. Whether AI-generated images are protected by copyright may differ from country to country.

## Logos

The following logos are marks of their respective institutions and companies. The licenses of this repository do not apply to them. If you use the app for another purpose, remove them or replace them with your own logo.

| Logo | Location |
|---|---|
| 국가기후위기대응위원회 (Korean national climate-crisis response committee) | `src/build/assets/a92181de85.png` |
| 풀무원 CI (Pulmuone corporate identity) | `<symbol id="ciPulmuone">` in `src/build/shell.html` |

## Data sources

The team compiled the emission factors and calculation parameters from the materials below. The compiled results (`data/`) are under CC BY 4.0; the original materials follow each publisher's terms. When citing, please name the original sources as well.

| id | Material | Publisher | Terms of use (as stated when collected) |
|---|---|---|---|
| S001 | Reducing food's environmental impacts through producers and consumers | Poore & Nemecek, *Science* (2018) / Our World in Data | CC BY (Our World in Data) |
| S002 | 고기, 농장에서 매장까지: 육류 소비의 전과정 탄소발자국 분석 (Meat from farm to store: life-cycle carbon footprint of meat consumption) | 기후솔루션 (Solutions for Our Climate) | Published press release |
| S003 | Food Systems-Related GHG Emissions Factor Database Using the KNHANES | Hong & Kim, *Environmental Health Perspectives* | Open access |
| S004 | 통계자료를 활용한 국내 과수 농산물의 전과정평가 연구 (Life-cycle assessment of Korean fruit crops using statistical data) | 이지선 외 (Lee et al.), 한국기후변화학회지 (Journal of Climate Change Research) | Journal article |
| S005 | 환경성적표지 인증제품 유효현황 (Currently valid products certified with the Environmental Product Declaration label) | 기후에너지환경부 (Ministry of Climate, Energy and Environment) | Public data |
| S006 | Environmental impact of the main household cooking systems | *Italian Journal of Food Science* | Open access |
| S007 | 2006 IPCC Guidelines, Vol.5 Ch.4 | IPCC | Public |
| S008 | 2006 IPCC Guidelines, Vol.2 Ch.2 | IPCC | Public |
| S009 | 2023년 전력배출계수 확정 공표 (Official 2023 electricity emission factor) | 기후에너지환경부 (Ministry of Climate, Energy and Environment; reported by 에너지신문 / Energy News) | Press release |
| S010 | 군 급식 1일 영양 기준 (Daily nutrition standards for military meals) | 국방부·육군훈련소 (Ministry of National Defense · Korea Army Training Center) | Public |
| S011 | 군부대 급식 잔반량 관련 보도 (News report on plate waste in military meals) | 대한급식신문 (a Korean food-service newspaper) | News report |
| S012 | 급식회사 내부 조리지침서 (Caterer's internal cooking guidelines) | Not public | **Not published** |

Full bibliographic details and URLs are in [`data/sources.csv`](data/sources.csv) (Korean).

## What is not published

Recipe amount distributions, templates, menu frequencies and portion multipliers by age and institution that come from S012 are not included in the public data, and the licenses above do not apply to them.
