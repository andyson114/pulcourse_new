[한국어](BUILD_GUIDE.md) | **English**

# Build Guide

This document explains how "Lunch Choices for the Planet" (Korean original: 지구를 지키는 점심 선택) is put together. It also lists the steps you need if you want to rebuild the app or adapt it to your own cafeteria.

- The format of the calculation data is described separately in the [data guide](DATA.md) (Korean).
- The calculation steps and formulas are in [How It's Calculated](METHODOLOGY.en.md).
- The app overview and screen flow are in the [README](../README.en.md).

You will need:

- Python 3. The tools (`tools/*.py`) use only the standard library.
- A text editor and an up-to-date browser.
- git (optional), to download the repository.
- Node.js (optional), to check edited code for syntax errors.
- The `fonttools` and `brotli` packages, only if you want to inspect the fonts.

> The full calculation data is not published as a separate file (`payload.json`). When you repack the app, you use your own data ([section 5](#5-building-with-your-own-cafeterias-data)). What is published and what you may reuse is summarized in [7-5](#7-5-what-is-public-and-licenses).

---

## 1. Structure at a glance

### 1-1. A single-file app

- One file, `index.html`, holds the screens, styles, code, calculation data, fonts and images.
- Once the page is open, it sends no outside requests. The only internet addresses in the code are source links.
- So it runs anywhere you can host static files.
- It is about 3.07MB.
- The English version, `en/index.html`, is built the same way from translated pieces ([3-6](#3-6-building-the-english-version)).

### 1-2. Order inside the file

`index.html` is laid out top to bottom as shown below. Open `src/build/shell.html` to see the same order. Large blocks are left empty with `@@NAME@@` markers.

```
index.html
├─ header comment                  how to use URL parameters
├─ <head>
│  ├─ 3 fonts                      <script type="text/plain" id="f500" / "f700" / "f900">  base64 woff2
│  ├─ font loader                  <script>  decodes the fonts and registers them with FontFace
│  └─ CSS
│     ├─ <style>                   main styles (Education module, Dashboard), minified to one line
│     ├─ <style id="role-hub">     first screen and Monthly Menu styles
│     └─ <style id="road-motion-fix">, "restaurant-layout", "mobile-fixes"   layout fixes
└─ <body class="s-intro blur dim rh-still">
   ├─ mobile check <script>        adds the mobile class to body before the first paint
   ├─ hidden <svg> <symbol>        corporate logo (CI)
   ├─ #viewport > #stage           desktop cafeteria scene (#bg, menu info, tray, bowls, thought bubble)
   ├─ #mob, #msheet                mobile cafeteria scene and bottom sheet
   ├─ #roleHub                     purpose selection (first screen)
   ├─ header.hud, 5 panels         #pIntro, #pBeef, #pStory, #pResult, #pClose (Education module)
   ├─ #dash                        Dashboard (6 tab buttons, pane-detail·compare·sim·method)
   ├─ <script type="text/plain" id="restaurant-svg">   cafeteria background SVG fragment
   ├─ <script type="text/plain" id="payload">          calculation data (JSON), gzip + base64
   ├─ <script type="text/plain" id="code">             app code (JS), gzip + base64
   ├─ <script id="role-hub-js">    first-screen script
   └─ startup script               unpack data and code → run code → RoleHub.init()
```

The browser does not run `<script>` elements with `type="text/plain"`. They serve as boxes that hold the fonts, data, code and background picture as text.

### 1-3. How the page loads

1. The font loader decodes the three base64 fonts and registers them under the name `Noto Sans KR`.
2. The first script in `<body>` checks the screen size and adds `body.mobile`. This stops the desktop layout from flashing before it switches while the data is being unpacked.
3. The markup is drawn. The first screen (`#roleHub`) sits on top.
4. `role-hub-js` runs right away so the first screen can accept clicks. If someone taps a card before the app code is ready, the choice is remembered and handled in step 7.
5. The startup script unpacks the `payload` and `code` blocks with `DecompressionStream("gzip")`.
6. The data goes into `window.PAYLOAD`, and the code runs via `new Function(code)()`. The code runs in the order engine → dash → app.
7. Finally, `RoleHub.init()` activates the first screen.

Here is the startup script (the error-message part is shortened):

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
    // show a full-screen "please open this page in an up-to-date browser" message and stop
    return;
  }
  window.PAYLOAD = P;
  new Function(code)();               // engine → window.Engine, dash → window.Dash, app → starts the Education module
  window.RoleHub && RoleHub.init();   // activate the purpose selection screen
})();
```

(`"DecompressionStream 없음"` means "DecompressionStream missing".)

### 1-4. The three parts of the app code

`app.bundle.js` is three parts joined together and minified.

| Part | Global name | What it does | Readable copy |
|---|---|---|---|
| engine | `window.Engine` | menu-name parsing → recipe and amounts → emission factors → CO₂e per serving | `src/readable/engine.js` |
| dash | `window.Dash` | Dashboard tabs (CO₂e by Menu, Menu Swap Comparison, Cafeteria Simulator, How It's Calculated) | `src/readable/dash.js` |
| app | none (only the two menu names are left in `window.LUNCH_MENU` for dash to read) | Education module (Start → Choose → Story → Result → Pledge) | `src/readable/app.js` |

- For the cafeteria background, the app code puts the contents of the `restaurant-svg` block into `#bg`, then draws the menu board (today's menu and the two menu names) on top in code.
- The two bowl pictures for the default menus (소고기국밥, beef rice soup; 시래기국, dried radish-greens soup) are not in `assets/`. They are embedded in `app.bundle.js` as data URIs. For any other menu, the code draws the bowl.

### 1-5. The first screen (purpose selection) and its hooks

The first screen is a layer added on top of the original app (Education module + 4 Dashboard tabs). The original code was left almost unchanged; only the hooks below were added.

The setup for each purpose is in `ROLES` in `rolehub.js`.

| Purpose | `data-role` | Opens | Dashboard tabs (in order) | Slider starting values |
|---|---|---|---|---|
| Menu Planning (for dietitians) | `nutri` | Dashboard | Menu Swap · Monthly Menu · CO₂e by Menu · How It's Calculated | current menu as is (all sliders at defaults) |
| Impact Tracking (for companies & operators) | `corp` | Dashboard | Monthly Menu · Dashboard · CO₂e by Menu · How It's Calculated | current menu as is |
| Climate Education (for diners) | `user` | Education module (from Start) | CO₂e by Menu · Cafeteria Simulator · How It's Calculated | original example setting (Beef dishes −50%, Meat-free days once a week) |
| View All | `all` | Education module (from Start) | CO₂e by Menu · Menu Swap Comparison · Cafeteria Simulator · How It's Calculated | original example setting |

- Monthly Menu and Dashboard are not separate screens. They show the one Cafeteria Simulator screen (`#pane-sim`) split two ways, so they share the same slider settings.
- Menu Swap is the Menu Planning name for the Menu Swap Comparison tab.

The hooks are:

| Hook | Where | What it does |
|---|---|---|
| `window.__tabMap(tab)` | defined in `rolehub.js`, called by dash's tab-switch function `vt()` | swaps a tab that the chosen purpose does not have for the right one |
| `#dash[data-view]` | set by dash's `vt()` | based on the value (`month`, `board`), `rolehub.css` shows the simulator screen as Monthly Menu or Dashboard |
| `Dash._sim` | exported by dash | values and functions used by the Monthly Menu calendar: baseline menu `R`, meat-free-day menu `K`, lunch days `Y`, current settings `tt`, defaults `et`, original example setting `st`, etc. |
| `window.__onDashClose` | defined in `rolehub.js`, called when dash closes | in Menu Planning and Impact Tracking, closing the Dashboard returns to the first screen |
| `RoleHub.init()` | called by the startup script | activates the first screen after the code runs and handles any waiting choice |

---

## 2. Repository layout

| Path | Contents |
|---|---|
| `index.html` | The deployed app. A single file with all pieces packed in. |
| `en/index.html` | The English app (single file), served at `/pulcourse_new/en/`. |
| `README.md`, `README.en.md` | App overview (Korean, English) |
| `LICENSE` | Code license (MIT) |
| `LICENSE-DATA.md` | Data and docs license (CC BY 4.0) |
| `NOTICE.md` | Third-party material (fonts, logos, data sources) and terms of use |
| `docs/BUILD_GUIDE.md`, `docs/BUILD_GUIDE.en.md` | This document (Korean, English) |
| `docs/DATA.md` | Calculation data guide (Korean only) |
| `docs/METHODOLOGY.md`, `docs/METHODOLOGY.en.md` | Calculation method (Korean, English) |
| `docs/flow-1-overview.svg` and 2 more | Flow diagrams used in the README (purpose selection, education flow, calculation) |
| `docs/flow-*.en.svg` | English versions of the flow diagrams, used in `README.en.md` |
| `src/build/shell.html` | The app skeleton: main CSS, markup, font loader, startup script. |
| `src/build/app.bundle.js` | App code (engine + dash + app). `pack.py` reads this file when packing. |
| `src/build/rolehub.css`, `rolehub.js` | First screen (purpose selection) and Monthly Menu calendar |
| `src/build/restaurant.svg` | Cafeteria background picture (SVG fragment) |
| `src/build/fonts/` | `f500.woff2`, `f700.woff2`, `f900.woff2` (Noto Sans KR subsets) and the full font license `OFL.txt` |
| `src/build/assets/` | 7 images: logos, tray, story scenes, etc. |
| `src/build/manifest.json` | List of pieces and their SHA-256, recorded at unpack time |
| `src/build-en/` | Translated pieces only: `shell.html`, `app.bundle.js`, `rolehub.js`, `rolehub.css`. Everything else is shared from `src/build/` ([3-6](#3-6-building-the-english-version)). |
| `src/readable/` | `engine.js`, `dash.js`, `app.js`: tidied copies of the code for reading. **Not used in the build.** |
| `tools/unpack.py` | Splits `index.html` into pieces. |
| `tools/pack.py` | Packs the pieces back into `index.html`. |
| `tools/verify.py` | Compares two `index.html` files piece by piece. |
| `tools/export_public_data.py` | Exports only the publishable part of the calculation data to `data/`. |
| `data/` | Public data (emission factors, parameters, sources, menu-name dictionary). Emission factors, parameters and sources come as both JSON and CSV; the file list is in `MANIFEST.json`. See the [data guide](DATA.md) (Korean). |

---

## 3. Unpack, edit, repack

### 3-1. Pieces and markers

`src/build/` holds the pieces of an unpacked `index.html`. Each piece goes into a marker in `shell.html`.

| Piece | Marker in `shell.html` | Contents | In repo |
|---|---|---|---|
| `shell.html` | (skeleton) | main CSS, markup, font loader, startup script | yes |
| `app.bundle.js` | `@@CODE@@` | app code, inserted as gzip + base64 | yes |
| `payload.json` | `@@PAYLOAD@@` | the full calculation data, inserted as gzip + base64 | **no** ([7-5](#7-5-what-is-public-and-licenses)) |
| `rolehub.css` | `@@ROLEHUB_CSS@@` | first screen and Monthly Menu styles | yes |
| `rolehub.js` | `@@ROLEHUB_JS@@` | first screen and Monthly Menu script | yes |
| `restaurant.svg` | `@@RESTAURANT_SVG@@` | cafeteria background picture | yes |
| `fonts/f500.woff2` etc. | `@@F500@@`, `@@F700@@`, `@@F900@@` | fonts, inserted as base64 | yes |
| `assets/*` | `@@ASSET:assets/filename\|MIME@@` | images, inserted as data URIs | yes |
| `manifest.json` | (none) | record left at unpack time; `pack.py` does not read it | yes |

`pack.py` checks that each marker appears exactly once. Image markers (`@@ASSET:…@@`) may appear more than once. If any marker is left unfilled, it stops and tells you.

### 3-2. Repacking

```bash
git clone https://github.com/andyson114/pulcourse_new.git
cd pulcourse_new

# after editing the pieces in src/build/
python3 tools/pack.py src/build index.html --payload my_payload.json
```

- On success it prints the size, like `[pack] src/build → index.html  (3.07MB)`.
- Without `--payload`, it looks for `src/build/payload.json`. That file is not in the repository, so it stops with `FileNotFoundError`.
- How to make `my_payload.json` is in [section 5](#5-building-with-your-own-cafeterias-data).
- Compression is gzip at maximum level with the timestamp set to 0. Packing the same pieces in the same Python environment gives the same file. In a different environment the compressed bytes may differ, so use `verify.py` to check that the contents are the same ([3-3](#3-3-checking-with-a-comparison)).
- On the computer used to build the app, packing the pieces in `src/build/` with the original data produced a file byte-for-byte identical to the deployed `index.html`.

### 3-3. Checking with a comparison

`verify.py` unpacks both files and compares them piece by piece. It compares the uncompressed contents, not the gzip bytes.

```bash
python3 tools/verify.py before.html index.html
```

First it prints one line per unpacked file (the Korean reads "16 pieces, 7 images"):

```
[unpack] before.html → /…/verify-xxxxxxxx  (조각 16개, 이미지 7개)
[unpack] index.html → /…/verify-xxxxxxxx  (조각 16개, 이미지 7개)
```

Then one result line:

| Case | Last line | Exit code |
|---|---|---|
| Same | `[verify] 같음 — 조각 16개 모두 일치` ("same — all 16 pieces match") | 0 |
| Different | `[verify] 다른 조각: app.bundle.js` ("different pieces: …"; lists every piece that differs) | 1 |

`payload.json` is compared too. So if you compare the repository's `index.html` with a file packed from your own data, `payload.json` will always show as different. To check that only your edits changed:

1. Pack with your own data before editing anything.
   ```bash
   python3 tools/pack.py src/build before.html --payload my_payload.json
   ```
2. Edit the pieces and pack again.
   ```bash
   python3 tools/pack.py src/build index.html --payload my_payload.json
   ```
3. Compare the two files. Only the pieces you edited should be listed.
   ```bash
   python3 tools/verify.py before.html index.html
   ```

`verify.py` unpacks into a temporary folder (starting with `verify-`) and deletes it as soon as the comparison ends, because that folder also contains `payload.json`.

### 3-4. Unpacking index.html again

Use this to split an `index.html` you packed yourself back into pieces.

```bash
python3 tools/unpack.py index.html work/
# [unpack] index.html → work/  (조각 16개, 이미지 7개)
```

- Image file names are the first 10 characters of the image's SHA-256. Identical images are merged into one file.
- Unpacking also writes the calculation data you packed in as `payload.json`.
- To keep this file out of the repository by accident, the repository's `.gitignore` blocks `payload.json`, any JSON with `payload` in its name, and the `work/` and `build/` folders (`data/` and `src/build/` are exceptions).

### 3-5. Tips for editing app.bundle.js

- `app.bundle.js` is minified, so its first line alone is over 500,000 characters. Use your editor's search to find the place to edit.
- Read the place first in the copies in `src/readable/`. These copies were run through prettier for line breaks and spacing, with explanatory comments added at the top.
- Variable names (`R`, `K`, `Y`, etc.) and string contents match, but spacing and brackets differ, so searching for a code fragment copied from a readable copy will not find it. Search `app.bundle.js` for text inside a string (e.g. `예시 4주(20끼) 점심을`, "the example 4 weeks (20 lunches) of lunches") or a short fragment without spaces (e.g. `const R=[`).
- Make the actual edits in `app.bundle.js`. `pack.py` does not use the readable copies.
- Do not join the readable copies and use them in place of `app.bundle.js`. In the `app.js` copy, the two bowl pictures are replaced with placeholder text.
- After editing, check for syntax errors (requires Node.js).
  ```bash
  node --check src/build/app.bundle.js
  ```
- Once you edit `app.bundle.js`, it no longer matches the readable copies. The repository has no tool to bring the copies back in sync.

### 3-6. Building the English version

The English app, `en/index.html`, is packed from translated pieces plus the shared pieces of the Korean build.

| Folder | Holds |
|---|---|
| `src/build-en/` | Translated pieces only: `shell.html`, `app.bundle.js`, `rolehub.js`, `rolehub.css` |
| `src/build/` | Everything else, shared by both pages: `fonts/`, `assets/`, `restaurant.svg` |

`tools/pack.py` has an option `--base DIR`: any piece missing from the source folder is read from `DIR` instead. Build the English page with:

```bash
python3 tools/pack.py src/build-en en/index.html --payload my_payload.json --base src/build
```

- Use the same payload as the Korean build. The calculation data (the payload and `data/`) stays Korean, so both pages compute the same numbers.
- The English page shows English names through a display-name dictionary, `EN_NAMES`, at the top of `src/build-en/app.bundle.js`. Menu and ingredient names that are not in this dictionary are shown in Korean. If your data adds menus, add their English names to `EN_NAMES`.
- The menu box on the English page accepts the English names from its list, or any Korean menu name.
- Both pages have a language link (English / 한국어) on the first screen, so each links to the other.
- The embedded Noto Sans KR subsets include basic Latin (U+0020–007E), so English text renders with the embedded fonts ([7-1](#7-1-the-fonts-are-subsets)).
- **Keep the two builds in sync by hand.** No tool copies changes across. When you change a Korean UI piece (`shell.html`, `app.bundle.js`, `rolehub.js`, `rolehub.css` in `src/build/`), make the matching change in the translated piece in `src/build-en/`, then repack both pages.
- The checks in [3-3](#3-3-checking-with-a-comparison) and [3-5](#3-5-tips-for-editing-appbundlejs) work the same way, e.g. `node --check src/build-en/app.bundle.js`.

The search strings in [section 4](#4-common-edits) refer to the Korean pieces in `src/build/`. In `src/build-en/`, the same code carries English text, so search for the translated wording or for a short code fragment such as `const R=[`.

---

## 4. Common edits

### 4-1. Changing the two menus in the Education module

No repacking needed. Add parameters to the URL.

```
https://andyson114.github.io/pulcourse_new/?a=김치볶음밥&b=순두부찌개&d=9월%2021일
```

(Here `a` is 김치볶음밥, kimchi fried rice; `b` is 순두부찌개, soft tofu stew; `d` is "September 21".)

| Parameter | Meaning |
|---|---|
| `a`, `b` | Two menu names, in any order. The one with higher CO₂e becomes the first menu. |
| `d` | Date text shown on the Start screen (optional). Shown as "today's menu · date" when at least one menu is recognized. |

- Menu names are Korean data keys, because the engine parses Korean menu names.
- Names the engine does not recognize are dropped, with a one-line warning in the browser console.
- If only one menu is recognized, the other is filled with a default menu. If none are, the page opens with the default menus (소고기국밥, 시래기국).
- The cattle-farming scene appears only when beef makes up 50% or more of the first menu.
- Menu names on the menu board are drawn in bold (700). Characters missing from the bold font may show at regular weight ([7-1](#7-1-the-fonts-are-subsets)).

To change the default menus themselves in code, edit `const f=["소고기국밥","시래기국"]` in `app.bundle.js`. URL parameters are enough in most cases. If you change them in code, also check the places below. Search for all of them in `app.bundle.js`.

| Search for | Part | What it does |
|---|---|---|
| `"소고기국밥"===nm`, `"시래기국"===nm` | app, function `j()` | Uses the dedicated bowl picture only when the name matches. New menus get a code-drawn bowl. |
| `고기 대신 시래기를 넣어서` ("using dried radish greens instead of meat") | app, menu info in the cafeteria scene (`#loWhy`) | Text added when the two menus equal `f`. If you change `f`, this text will be attached to the new menus too, so edit it as well. |
| `window.LUNCH_MENU\|\|{hi:"소고기국밥",lo:"시래기국"}` | dash, How It's Calculated tab | Default used when the Education module has not set two menus. |
| `const _={A:"소고기국밥",B:"시래기국"}`, `j={A:"소고기국밥",B:"시래기국"}` | dash, CO₂e by Menu and Menu Swap Comparison | The first two menus in the comparison tabs. Replaced by the Education module's two menus when those exist. |

The places below use 소고기국밥 (beef rice soup) as the reference example regardless of `f`. If your data cannot calculate this menu, or you want a different example, edit them too.

| Search for | Where it appears |
|---|---|
| `const T=[[` | example pair buttons in Menu Swap Comparison |
| `소고기국밥으로 치면` ("in bowls of beef rice soup") | conversion in the simulator result ("equal to N bowls of beef rice soup") |
| `소고기국밥 → 소고기 · 국밥` ("beef rice soup → beef · rice soup") | the "at a glance" part of How It's Calculated |
| `소고기국밥은 1인분` ("beef rice soup, per serving") | the conversion explanation in How It's Calculated |

### 4-2. Changing the example 4 weeks in Monthly Menu

The baseline menu used by Monthly Menu and the simulator is inside the dash code.

- To read: `const R = [` in `src/readable/dash.js` (currently around line 405)
- To edit: search `src/build/app.bundle.js` for `const R=[["11/2(월)"`.

Each entry has the form `["date label", "dish, dish, dish"]`. Dishes are separated by commas. (In date labels, 월/화/수/목/금 = Mon/Tue/Wed/Thu/Fri.)

```js
const R=[["11/2(월)","쌀밥, 소고기무국, 제육볶음, 콩나물무침, 배추김치"],["11/3(화)","혼합잡곡밥, 근대된장국, 소불고기, 시금치나물, 깍두기"], ... ]
```

Rules when you change it:

1. The first entry must be a Monday, followed by Monday–Friday with no gaps.
   - The calendar's weekday columns come from entry order (`const wd = i % 5` in `rolehub.js`). The weekdays chosen for meat-free days (`VEG_DAYS`) follow this order too.
   - The date label (e.g. `11/4(수)`, Wed) is only displayed in the cell; it is not used to decide the weekday.
   - If you drop a day for a holiday, every later cell shifts by one.
2. Make the number of days a multiple of 5. The calendar groups every 5 entries into a week.
3. If it is not 20 entries (4 weeks × 5 days), also edit the text below.
   - Places that say "20끼" (20 lunches) — 4 places
     - `shell.html`: `기준 식단 4주(20끼)에 조절 막대 설정을 적용해요.` ("Applies the slider settings to the 4-week (20-lunch) baseline menu.")
     - `app.bundle.js`: `예시 4주(20끼) 점심을` ("the example 4 weeks (20 lunches) of lunches")
     - `app.bundle.js`: `20끼 중 ${e}끼에` ("in ${e} of 20 lunches"; How It's Calculated tab. The number of lunches with a beef dish is calculated, but 20 is fixed.)
     - `app.bundle.js`: `기준 식단 20끼 중 10끼에 소고기 메뉴가 있어요.` ("10 of the 20 baseline lunches have a beef dish."; the Beef dishes slider description. Update "10끼" (10 lunches) to fit the new menu too.)
   - Other places that say "4주" (4 weeks) — 4 places
     - `shell.html`: `4주 식단표에서 보기` ("view in the 4-week menu"), `예시 식단 4주를` ("the 4-week example menu")
     - `rolehub.js`: `기준 식단 4주(` ("baseline menu, 4 weeks ("), `aria-label="4주 식단표` ("4-week menu table")
4. The engine must be able to recognize the menu names. After packing, enter the names in the CO₂e by Menu tab and check that the ingredients come out right.

Related values:

| Value | Location (search `app.bundle.js`) | Notes |
|---|---|---|
| Meat-free-day menu | `K=["잡곡밥","시래기된장국","두부양념조림","시금치나물","배추김치"]` (multigrain rice, dried radish-greens doenjang soup, braised seasoned tofu, seasoned spinach, napa cabbage kimchi) | On meat-free days the whole lunch is replaced with this menu. The same names are written out as text in two places, which you should edit too: the Meat-free days slider description (`그날 점심은 …로 바꿔요.`, "that day's lunch becomes …") and the How It's Calculated tab (`점심 전체를 잡곡밥·…로 바꿔요`, "replace the whole lunch with multigrain rice · …"). |
| Lunch days | `Y=260` | 52 weeks × 5 days |
| Daily diners | `id:"diners"` | default 500; range 100–3,000 in steps of 50 |
| Original example setting | `const st=Object.assign({},et,{beef:50,veg:1})` | starting values for Climate Education and View All |
| Meat-free weekdays (calendar display) | `VEG_DAYS` in `rolehub.js` | once a week: Wed; twice: Tue·Thu; 3 times: Mon·Wed·Fri; 4 times: Mon·Tue·Thu·Fri; 5 times: every day |

The substitute dishes used when cutting meat dishes are not written in the code. The code picks, from the data (`corpus`), the first dish without beef among the same-role dishes that Menu Swap Comparison suggests. So if `corpus` is empty, there are no substitute dishes ([5-3](#5-3-things-that-must-match)).

### 4-3. Changing first-screen text

| What | File | Where |
|---|---|---|
| Title, intro sentence | `shell.html` | `<h1 id="rhTitle">` inside `#roleHub`, and the `<p>` below it |
| Card purpose name, audience, description, module list | `shell.html` | `<button class="rh-card" data-role="…">` and `<button class="rh-all" data-role="all">` inside `#roleHub` |
| Dashboard tab names | `rolehub.js` | `LABEL` (shared), `ROLES.nutri.label` (Menu Swap, in Menu Planning) |
| Tabs and their order per purpose | `rolehub.js` | `tabs`, `map` in `ROLES` |
| Dashboard header title, Change purpose badge | `rolehub.js` | `name`, `who` in `ROLES`, function `badges()` |
| Card colors, layout | `rolehub.css` | `#roleHub [data-role=nutri]{--rc:…}` etc. |
| Monthly Menu calendar text | `rolehub.js` | function `renderMonth()` |

- Once a purpose is chosen, `rolehub.js` overwrites the text of the `#dtabs` buttons in `shell.html` with `LABEL`. Change tab names in `LABEL`.
- The `data-role` values (`nutri`, `corp`, `user`, `all`) must match the keys of `ROLES`.
- Try not to change the element structure inside the cards (`.rh-top` etc.). The reason is in [7-2](#7-2-change-the-first-screen-structure-in-small-steps-and-test-on-a-real-iphone).
- New characters in bold text may make the font look mixed. See [7-1](#7-1-the-fonts-are-subsets).
- For the English page, make the same edits in `src/build-en/` ([3-6](#3-6-building-the-english-version)).

### 4-4. Changing logos and images

| File | Contents | Used in `shell.html` |
|---|---|---|
| `assets/9212ee11ca.png` | app logo | top bar of the education screens, Dashboard title (2 places) |
| `assets/a92181de85.png` | logo of the National Climate Crisis Response Committee (국가기후위기대응위원회) | `.logo-partnership` (3 places: first screen, Start, Pledge) |
| `assets/1ec47fcdad.png` | tray picture | desktop and mobile tray (2 places) |
| `assets/a61b5cb1cf.webp` and 3 more | story-scene pictures (cow, tree, fallen cow, stump) | `cowPhoto`, `treePhoto`, `deadCowPhoto`, `stumpPhoto` in `#storySvg` |

The corporate logo (CI) is not an image file. It is a `<symbol>` inside the hidden `<svg>` near the start of `<body>`, pulled in with `<use href="#…">` in the 3 `.logo-partnership` places.

Steps to replace an image:

1. If the format stays the same (PNG for PNG, WebP for WebP), overwrite the file with the same name and repack.
2. If the format changes, rename the file and update every marker in `shell.html`. Example: `@@ASSET:assets/my-logo.webp|image/webp@@`
3. Update the `alt` text (e.g. `alt="국가기후위기대응위원회"`) to match the new logo.
4. To remove a logo, delete the `.logo-partnership` block.

- The file name does not have to match its content hash. `pack.py` simply reads the file at the path in the marker.
- `manifest.json` is not updated automatically. This does not affect the build.
- Images are shared by both pages, so a replaced image shows up in both after you repack each one. Text such as `alt` must be edited in both `shell.html` files.
- Institutional and corporate logos (the committee logo and the corporate CI) are trademarks of their owners. They are not covered by this repository's licenses, so replace them with your own or remove them when reusing. The app logo and illustrations were made by the team ([7-5](#7-5-what-is-public-and-licenses), [NOTICE.md](../NOTICE.md)).

---

## 5. Building with your own cafeteria's data

### 5-1. What goes into payload.json

The calculation data is a single file, `payload.json`. The app code reads the entries below. The format of each entry is in the [data guide](DATA.md) (Korean).

| Entry | Contents | How to prepare |
|---|---|---|
| `factors` | emission factors per kg of each ingredient | `data/emission_factors.json` as is |
| `parameters` | calculation parameters such as cooking energy and food-waste rate | `data/parameters.json` as is |
| `sources` | source list | `data/sources.json`; replace S012 with your own source |
| `tokens` | words used to split menu names | `data/dictionary/tokens.json`; product-name words are removed |
| `alias` | ingredient synonyms | `data/dictionary/alias.json` as is |
| `methods` | cooking methods | `data/dictionary/methods.json` as is |
| `std_category` | ingredient categories | `data/dictionary/std_category.json` as is |
| `rules` | menu parsing rules | `data/dictionary/rules.json` as is |
| `recipes` | per-serving ingredient amounts for each menu | **prepare yourself** |
| `core_index` | recipe-name index | **prepare yourself** |
| `templates` | ingredient makeup per cooking method | **prepare yourself** |
| `global_qty` | per-serving amount for each ingredient | **prepare yourself** |
| `segments` | per-serving multipliers by age and institution (`scale`, `basis`, `src`, `sigma`) | **prepare yourself** |
| `complete_segments` | list of segment names whose recipes already include basic seasonings (`[]` if none) | **prepare yourself** |
| `corpus` | menu usage frequency and emission distribution | **prepare yourself** |

- The JSON files in `data/` are exports of the matching `payload.json` entries in the same format. Only the S012 content in `sources` and the product-name words in `tokens` were changed or removed. So you can put them back without changing the format.
- The public data is CC BY 4.0. Each source's own terms are given in `data/sources.json`.
- `meta` is not read by the app code, so you can leave it out.
- `data/` is produced by `tools/export_public_data.py`. Running it requires the full data.
  ```bash
  python3 tools/export_public_data.py payload.json data/
  ```
  It stops if there is a top-level entry whose publication status is not set, or if an emission factor or parameter cites S012. Details are in [data guide 3.3](DATA.md#33-다시-만드는-방법) (Korean).

### 5-2. Merging example

This example assumes you have collected the entries you prepared in `my_data/own.json`.

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

If you have not prepared your own entries yet, you can first pack with the minimal structure in [data guide 9.1](DATA.md#91-최소-구조) (Korean). That example also shows the sub-keys each entry must have.

### 5-3. Things that must match

- **Portion multiplier name**: for the adult workplace-cafeteria multiplier, the code uses the `산업체오피스` (industrial/office) entry in `segments`. This name is hard-coded at the start of the dash and app code (two places in `app.bundle.js`: `"산업체오피스"`).
- If this entry is missing, the dash code stops during startup, and the Education module in the same bundle does not run either. To use a different name, change those two places too.
- **Recipe source number S012**: `S012` is hard-coded in several places. The engine attaches `S012` to every ingredient amount taken from a recipe or template, so it also appears in the per-ingredient sources in CO₂e by Menu. It is also attached to the recipe and baseline-menu explanations in How It's Calculated. If you put your own recipe source in the S012 slot of `sources`, the source labels come out right.
- **Conversion card sources**: the sources S013–S015 for the conversion cards on the Result screen (car, smartphone, pine tree) are inside `app.bundle.js`, not in the data.
- **Values and source notes written as text**: the text below is written into the code rather than read from the data. If you change `data/parameters.json` or your data sources, edit these too.

  | Search for (`app.bundle.js`) | Where it appears | Related data |
  |---|---|---|
  | `0.4173` (3 places) | cooking-energy slider description, simulator explanation in How It's Calculated, smartphone conversion source note (S014) | `elec_kgco2e_per_kwh` in `parameters` |
  | `조리량의 15%` ("15% of the amount cooked"; 3 places) | Reduce food waste slider description, simulator explanation and example menu table in How It's Calculated | `waste_rate` in `parameters` |
  | `국내 육류는 기후솔루션(2026), 그 밖은 Poore & Nemecek(2018)과 한국 식품 DB` ("domestic meat from Solutions for Our Climate (2026), the rest from Poore & Nemecek (2018) and Korean food DBs") | How It's Calculated tab | sources of `factors` |
  | `기존 식단 데이터` ("existing menu data"; 5 places) | explanations in CO₂e by Menu, Menu Swap Comparison and How It's Calculated | the material used to build `recipes` and `corpus` |
  | `성인 구내식당(산업체·오피스)` ("adult workplace cafeteria (industrial/office)") | How It's Calculated tab | reference name in `segments` |

- **`shell.html` header comment**: the comment at the very top of the file names the original cafeteria and explains the URL parameters. Edit it for your cafeteria. The `Object.keys(Engine.P.recipes)` mentioned in the comment lists the recipe menu names in the packed data; with your own data, it shows your recipe names.
- **Product names**: product-name (brand) words were removed from the public dictionary. If brand names appear often in your menus, add them to `tokens` yourself.

**Entries that may and may not be empty**

| Entry | Can be empty? | What happens if empty |
|---|---|---|
| `recipes`, `core_index`, `templates`, `global_qty` | yes (`{}`) | Only the ingredients read from the menu name are added, at default amounts. Results will be far from real menus. |
| `complete_segments` | yes (`[]`) | Menus with recipes also get basic seasonings etc. filled in from templates (when templates exist). |
| `segments` | no; it must have a `산업체오피스` entry | Without it, the app stops during startup. |
| `corpus.results`, `corpus.freq` | the keys must exist; values may be `{}` | Without the keys, the app stops during startup. With empty values, there is no menu autocomplete or substitute-dish suggestion, and the simulator's meat-dish sliders have no effect. |
| `corpus.weighted_median` | no; must be a number | The per-serving value used for menus whose names cannot be parsed. Without it, totals for such menus are not numbers. |

More detail per entry is in [data guide 9.2](DATA.md#92-항목이-비었을-때) (Korean). For trustworthy results, you need your own cafeteria's recipe amounts.

### 5-4. Checks after packing

1. Open the console in the browser's developer tools and reload the page. There should be no red errors.
2. Choose each of the four purposes and open every tab.
3. In CO₂e by Menu, enter a few common menus and check the ingredients and amounts.
4. In Monthly Menu, move the sliders and check that the calendar and the annual effect change.
5. Go through the Education module from Start to Pledge.

If you also build the English page, repeat these checks there.

---

## 6. Deployment (GitHub Pages)

1. Create a repository on GitHub and upload `index.html` to the top folder.
2. Go to the repository's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Set **Branch** to `main` and the folder to `/ (root)`, then click **Save**.
5. After a few minutes it opens at `https://<account>.github.io/<repo>/`. The address is shown at the top of the same Pages screen.

- With a free account, Pages works only for public repositories.
- If you also deploy the English page, upload `en/index.html`; it opens at `https://<account>.github.io/<repo>/en/`.
- After editing, upload the new `index.html` to redeploy. If it does not change right away, wait a few minutes and do a hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on macOS).
- To check on your own computer before uploading, run the command below in the repository folder and open `http://localhost:8000/`.
  ```bash
  python3 -m http.server 8000
  ```
- `index.html` contains the calculation data you packed in, compressed but otherwise as is. Anyone can unpack it with `tools/unpack.py`, so only pack and deploy data that may be made public.

---

## 7. Caveats

### 7-1. The fonts are subsets

To keep the file small, only the characters in use were kept from Noto Sans KR.

| File | Weight | Hangul included | Notes |
|---|---|---|---|
| `f500.woff2` | 500 | 2,357 syllables | body text; no `data-range` (used for all characters) |
| `f700.woff2` | 700 | 904 syllables | selected characters for bold text |
| `f900.woff2` | 900 | no syllables (only the jamo ㄹ and ㅇ) | digits, Latin letters, some symbols |

- All three files include basic Latin (U+0020–007E), so English text renders with the embedded fonts at every weight.
- The font loader registers `f500` at weights 500, 700 and 900, and `f700` at weights 700 and 900. `f700` and `f900` are used only for the characters listed in their `data-range` in `shell.html`.
- So if bold (700) text contains a character not in `f700`, that character alone shows at weight 500. Weights may look mixed within one word.
- Hangul syllables at weight 900 are not in `f900`, so the browser looks in `f700` and then `f500`.
- Characters missing from `f500` too are shown in a system font.

Before adding new bold text, check that the characters exist.

```bash
pip install fonttools brotli
python3 - <<'EOF'
from fontTools.ttLib import TTFont
text = "새로 넣을 굵은 글씨"  # the new bold text you want to add
cmap = TTFont("src/build/fonts/f700.woff2").getBestCmap()
print("Missing from f700:", "".join(sorted({c for c in text if not c.isspace() and ord(c) not in cmap})) or "none")
EOF
```

If any characters are missing, pick one of these:

- Reword the text using characters that already exist. This is the simplest.
- Rebuild the subset from the original Noto Sans KR (SIL OFL 1.1) with the characters you need (e.g. fontTools' `pyftsubset`). You must also add the new characters to the matching `data-range` in `shell.html`. Characters outside the range are not used even if the font file has them. The fonts are shared, so a rebuilt font applies to both pages; update `data-range` in both `shell.html` files.

### 7-2. Change the first-screen structure in small steps and test on a real iPhone

- On mobile, the first-screen cards are laid out by giving `.rh-top` inside `<button class="rh-card">` `display:contents` (`body.mobile .rh-top{display:contents}` in `rolehub.css`).
- During development, a change to this card structure (using `display:contents` inside a `<button>`) made the cards stop responding to taps on iPhone (WebKit).
- Change the first-screen structure only as much as you need. Afterwards, tap all four cards on a real iPhone.

### 7-3. File size

- The current `index.html` is about 3.07MB: about 1.7MB of `assets/` images, about 0.5MB of app code (including the two bowl pictures), about 0.3MB of fonts, and the rest is calculation data and HTML/CSS.
- Each image is inserted as a separate data URI wherever its marker appears. The tray picture (`1ec47fcdad.png`, about 430KB) is used in two places and inserted twice, so it alone accounts for about 1.15MB.
- base64 makes images about 4/3 their size. Shrink new images (e.g. to WebP) before adding them.
- The startup script is at the very end of the file, so the app works only after the whole file has downloaded. Test on a slow mobile connection too.

### 7-4. Browser support

- The startup script needs `DecompressionStream` to unpack the data and code.
- Without it, the page shows a full-screen message, "이 페이지는 최신 브라우저에서 열어 주세요" ("Please open this page in an up-to-date browser") and "크롬·엣지 80, 파이어폭스 113, 사파리 16.4 이상이면 볼 수 있어요." ("Works in Chrome/Edge 80, Firefox 113, Safari 16.4 or later."), and stops.
- The same message appears if an error occurs while decompressing or parsing the JSON. If you see it after changing the data, first check that `payload.json` is valid JSON.
- Errors that occur while the code runs are not caught by this message. If the screen freezes, check the browser console.
- In browsers without `FontFace` support, the font loader does nothing and a system font is used.

### 7-5. What is public, and licenses

**Calculation data**

- The full calculation data is not published as a separate file (`payload.json`).
- The entries not in `data/` (`recipes`, `core_index`, `templates`, `global_qty`, `segments`, `complete_segments`, `corpus`, `meta`) and the product-name words in `tokens` come from the caterer's internal cooking guidelines (S012, not public) or are internal build information. They are not under a public license and may not be reused or redistributed.
- The only public data you may reuse is what is in `data/`. When you repack the app, use `data/` plus your own data ([section 5](#5-building-with-your-own-cafeterias-data)).

**Licenses**

| What | License |
|---|---|
| Code (scripts in `index.html` and `en/index.html`, `src/`, `tools/`) | MIT ([LICENSE](../LICENSE)) |
| Data (`data/`) and documents (`docs/`) | CC BY 4.0 ([LICENSE-DATA.md](../LICENSE-DATA.md)) |
| Source materials | each source's own terms (`data/sources.json`) |
| Fonts (Noto Sans KR subsets) | SIL OFL 1.1 (`src/build/fonts/OFL.txt`) |
| Illustrations and app logo (pictures in `src/build/assets/`, `restaurant.svg`, bowl pictures in the code) | MIT (made by the team) |
| Institutional and corporate logos (National Climate Crisis Response Committee logo, corporate CI) | trademarks of their owners; not licensed |
| Data derived from internal material (S012) | not licensed |

Detailed terms and sources for each item are in [NOTICE.md](../NOTICE.md).
