[한국어](METHODOLOGY.md) | **English**

# Calculation Methodology

This document explains how Lunch Choices for the Planet takes a single menu name, works out the CO₂e of one serving, and scales that value up to a whole cafeteria's emissions over a year. Every description is taken from the actual code.

- The code behind it is [engine.js](../src/readable/engine.js) (calculation engine), [dash.js](../src/readable/dash.js) (menu comparison and simulator), [app.js](../src/readable/app.js) (education module) and [rolehub.js](../src/build/rolehub.js) (Monthly Menu calendar).
- The files in `src/readable/` are readable, un-minified copies of the minified original (`src/build/app.bundle.js`). That is why function names are one or two letters, such as `Q` and `rt`. The short function names in this document are the names in this unpacked copy of the current build. They may change if the code is minified again.
- Numbers come only from the public data ([parameters.json](../data/parameters.json), [emission_factors.json](../data/emission_factors.json), [rules.json](../data/dictionary/rules.json)) and from values written in the app code.
- The per-serving quantity data was built from a caterer's internal cooking guidelines (S012) and is not included in the public data (`data/`). For that part, this document describes only the calculation rules and the data format. What is published and what may be reused is described in section 7-5 of the [Build Guide](BUILD_GUIDE.en.md).
- No quantities from the internal material are shown here. The quantities in the format example and in the worked example of section 3-6 are made up. The defaults in section 2-6 are the real values written in the code.
- Field-by-field descriptions of the data files are in the [data reference](DATA.md) (Korean).
- The data keys are Korean, as in the data files: ingredient names (e.g. 소고기), segment names (e.g. 산업체오피스), method names (e.g. 국밥) and so on. This document keeps them in Korean and gives an English gloss on first use.

## Contents

- [At a glance](#at-a-glance)
- [Data used in the calculation](#data-used-in-the-calculation)
- [1. Parsing the menu name](#1-parsing-the-menu-name)
- [2. Ingredient quantities per serving](#2-ingredient-quantities-per-serving)
- [3. Emission calculation](#3-emission-calculation)
- [4. Uncertainty and the 'plausible range'](#4-uncertainty-and-the-plausible-range)
- [5. Cafeteria Simulator](#5-cafeteria-simulator)
- [6. Numbers in the education module](#6-numbers-in-the-education-module)
- [7. Calculating with public data only](#7-calculating-with-public-data-only)
- [8. Limitations](#8-limitations)
- [9. Sources](#9-sources)
- [10. License](#10-license)

## At a glance

1. Clean up the menu name and split it into words. Find ingredients, methods and modifiers among the words.
2. Set a per-serving quantity for each ingredient. Look in this order: recipe, method template, per-ingredient distribution, default value.
3. Multiply each quantity (kg) by the ingredient's emission factor per kg. Emission factors are split into 9 stages.
4. From the total ingredient mass, compute cooking-energy and food-waste-treatment emissions and add them.
5. The simulator multiplies the per-serving value by daily diners and lunch days (260) to get annual emissions.

```
CO₂e per serving = Σ(ingredient quantity kg × ingredient emission factor)     quantity = inclusion rate × median
                 + total ingredient mass kg × cooking energy MJ/kg × fuel emission factor
                 + total ingredient mass kg × 0.15 × 0.1756
```

All calculations run inside the browser. No values are sent to a server.

### Where it is in the code

| Task | File | Function |
|---|---|---|
| Clean up the name | engine.js | `normalize` |
| Split into words | engine.js | `tokenize` |
| Read ingredients and method | engine.js | `parse`, `coreKey` |
| Set per-serving quantities | engine.js | `resolve` |
| Emissions | engine.js | `emissions`, `fuelFactor` |
| Uncertainty | engine.js | `monteCarlo`, `stats` |
| Provenance display | engine.js | `provenance` |
| Calculate one dish (Dashboard) | dash.js | `d` |
| Dish role and substitute dish | dash.js | `g`, `y` |
| Simulator | dash.js | `Q`, `lt`, `rt`, `ct`, `gt`. `Dash._sim` exposes `R`, `Q`, `rt`, `ct`, `nt`, `K`, `Y`, `gt` and the settings `tt` (current), `et` (default) and `st` (example). `lt` is not exposed |
| Monthly Menu calendar | rolehub.js | `renderMonth` |
| Education module | app.js | `u`, equivalents table `Tt` |

engine.js also contains `menuGrade`, `mealGrade` (grades) and `parseInput` (parsing a pasted menu table). The current screens do not call these functions.

## Data used in the calculation

Inside the app, the data is a single JSON object (`window.PAYLOAD`). Each public file has the same format as the entry of the same name in this JSON. "Not public" in the table below means the item is not included in the public data (`data/`) and is not covered by the public license.

| Item | Content | Public | Public file |
|---|---|---|---|
| `tokens` | Words used to split menu names. `[word, type, ingredient, method, cooking mode]` | Public (except 56 brand-name words) | [tokens.json](../data/dictionary/tokens.json) |
| `alias` | Word → standard ingredient name | Public | [alias.json](../data/dictionary/alias.json) |
| `methods` | Word → `[method, cooking mode]` | Public | [methods.json](../data/dictionary/methods.json) |
| `std_category` | Standard ingredient → category (meat, vegetables, etc.) | Public | [std_category.json](../data/dictionary/std_category.json) |
| `rules` | Parsing rules and thresholds | Public | [rules.json](../data/dictionary/rules.json) |
| `factors` | Emission factors per kg of ingredient (9 stages) | Public | [emission_factors.json](../data/emission_factors.json) |
| `parameters` | Cooking, disposal and uncertainty parameters | Public | [parameters.json](../data/parameters.json) |
| `sources` | List of sources | Public (S012 is listed only as not public) | [sources.json](../data/sources.json) |
| `recipes` | Per-serving quantity distributions of ingredients, by dish | Not public | None |
| `core_index` | Name without modifiers → recipe name | Not public | None |
| `templates` | Ingredient composition and quantity distributions, by method | Not public | None |
| `global_qty` | Per-serving quantity distribution for each ingredient (across all recipes) | Not public | None |
| `segments` | Quantity scale factor by segment (age group or institution) | Not public | None |
| `complete_segments` | Segments whose cooking guidelines list every ingredient, down to basic seasonings | Not public | None |
| `corpus` | Dish frequencies in historical menus, per-dish results, fallback values | Not public | None |
| `meta` | Internal build information (counts, version). Not used in calculations | Not public | None |

Every quantity distribution is an array `[inclusion rate, median g, p25 g, p75 g, count]`.

- Inclusion rate: the share (0–1) of the cooking guidelines for that dish (for a template, that method) that contain this ingredient.
- Median, p25, p75: the median and the 25th and 75th percentiles of the per-serving quantity (g).
- Count: the number of records behind the distribution. The calculation engine does not read it.

The non-public items look like this.

**Format example (not real values)**

```json
{
  "recipes": {
    "예시메뉴국": {
      "n": 10,
      "segs": { "세그먼트A": 10 },
      "base": { "재료A": [1, 100, 80, 120, 10], "재료B": [0.5, 10, 5, 15, 5] },
      "seg": {}
    }
  },
  "core_index": { "예시메뉴국": "예시메뉴국" },
  "templates": {
    "예시조리법": {
      "n": 10, "n_complete": 5, "mode": "끓임",
      "slots": { "주재료": [100, 80, 120, 10], "부재료": [20, 10, 30, 10], "양념": [5, 3, 8, 10], "유지": null },
      "ings": { "재료A": [0.9, 100, 80, 120, 9] }
    }
  },
  "global_qty": { "재료A": [1, 50, 30, 70, 10] },
  "segments": {
    "기준세그먼트": { "scale": 1, "basis": "근거 설명", "src": "S0XX", "sigma": 0.1 },
    "세그먼트A": { "scale": 2.0, "basis": "근거 설명", "src": "S0XX", "sigma": 0.1 }
  },
  "complete_segments": ["세그먼트A"],
  "corpus": {
    "freq": { "예시메뉴국": 10 },
    "results": { "예시메뉴국": [1, 1.0, "국·찌개", "국"] },
    "method_prior": { "국": { "median": 1.0, "shares": { "production": 0.6, "processing": 0.1, "distribution": 0.1, "consumption": 0.1, "disposal": 0.1 }, "mass_g": 100, "n": 10 } },
    "weighted_median": 1.0
  }
}
```

The Korean strings in the example are placeholders or real data keys: 예시메뉴국 (example soup), 예시조리법 (example method), 재료A/B (ingredient A/B), 세그먼트A (segment A), 기준세그먼트 (base segment), 근거 설명 (description of basis), 끓임 (simmering, a cooking mode), 주재료 / 부재료 / 양념 / 유지 (main ingredient / secondary ingredients / seasoning / fat & oil slots), 국·찌개 (soup/stew, a role), 국 (soup, a method).

- `recipes[name].n` is the number of records behind the recipe (the code calls them "blocks"), `segs` is the count per segment, `base` is the distribution adjusted to the base segment, and `seg` holds segment-specific distributions.
- The arrays in `templates[method].slots` are `[median, p25, p75, count]`. The engine reads only the `주재료` (main ingredient) slot.
- `corpus.results[dish]` is `[calculation tier, CO₂e per serving for the base segment, role, method]`. The calculation tier is 1–4 as described in chapter 2.
- `corpus.freq[dish]` is how many times the dish appears in the historical menus.
- `corpus.results` and `corpus.freq` are used in two places. One is finding substitute dishes (section 5-4). The other is the autocomplete list of the menu input box. The autocomplete list contains dishes with calculation tier 3 or lower and no `/` or `+` in the name, sorted by `freq` in descending order.
- `corpus` also holds the bins for the grade functions (`menu_bounds`, `meal_bounds`) and some items the engine does not read.

## 1. Parsing the menu name

### 1-1. Cleaning the name

Code: engine.js `normalize`

1. Normalize to Unicode NFC and remove all whitespace.
2. Remove `( )`, `[ ]`, `{ }` and the text inside them.
3. Remove the decorative symbols `☆★♡♥※◎○●▶▷◆◇■□◈▲△▼▽*`.
4. Remove digits, commas, periods and slashes at the end of the name (prices, numbers, etc.).
5. Remove leading and trailing `-`, `~`, `·`, `.`.

Example: `소고기국밥(1,200)` → `소고기국밥`, `★김치볶음밥★` → `김치볶음밥`

Recipe lookup also uses the cleaned name.

### 1-2. Splitting into words

Code: engine.js `tokenize`

1. Cut the name into pieces at the symbols `( ) [ ] & * + / · , - _ ' " ~ ! ? . :`.
2. In each piece, from the left, pick the longest dictionary (`tokens`) word that starts at the current position.
3. If no word matches, group everything up to the position where the next dictionary word starts into one "unregistered" word.

Coverage (`coverage`) is `1 − unregistered characters ÷ total characters`, rounded to three decimal places. Total characters counts only Hangul, Latin letters and digits. Unregistered characters counts every character of the unregistered pieces. Coverage is stored with the result but is not used in the emission calculation.

| Word type | Count in public version | Role in the calculation |
|---|---:|---|
| Ingredient (재료) | 591 | Looks up the standard ingredient in `alias`. |
| Method (조리법) | 80 | Looks up the method and cooking mode in `methods`. |
| Modifier (수식어) | 215 | Words such as 매콤 (spicy) or 옛날 (old-fashioned). Dropped when looking up the recipe name. |
| Sauce modifier (양념수식) | 13 | Words such as 데리야키 (teriyaki) or 갈릭 (garlic). Not used as an ingredient or method. |
| Brand name (제품명) | 0 (56 in the internal version) | Dropped when looking up the recipe name. Not in the public version. |

### 1-3. Reading ingredients and the method

Code: engine.js `parse`

**Ingredients**: if a word is in `alias`, its standard ingredient is used. Each ingredient is added only once.

**The method** is decided in this order.

1. A word found in `methods` is a method candidate. Words that are also ingredients (불고기 bulgogi, 제육 spicy pork, 김치 kimchi, etc.) are "secondary candidates"; the rest are "primary candidates". If there are several candidates of the same kind, the one appearing later in the name is used.
2. For ingredient words not in `methods`, look at the ending. Shorten the ending from the longest down to 2 characters and check whether it is in `methods`; if it is, use it as a primary candidate. Example: 김치찌개 (kimchi stew) → 찌개 (stew), 닭갈비 (spicy stir-fried chicken) → 갈비 (ribs).
3. Use the primary candidate if there is one; otherwise the secondary candidate.
4. If there is no candidate and the ingredients include a protein ingredient (`protein_stds`), set both the method and the cooking mode to 기타 (other).
5. If there is still none, apply the ready-made product rule (`product_std_method`). Example: 우유 (milk) → 유제품·완제품 (dairy, ready-made); 사과 (apple) → 과일·무가열 (fruit, no heat). If several ingredients match, non-fruit ones come first, and among them the one appearing later in the name is used.

**Words that themselves mean a meat** (`dual_protein_tokens`): words such as 불고기 (bulgogi), 제육 (spicy pork) and 설렁탕 (ox-bone soup) map to a specific meat in `alias` (불고기 → 소고기 beef, 제육 → 돼지고기 pork). If the same name contains a separate protein ingredient that is not one of these words, the other meats are removed. Example: 오리불고기 (duck bulgogi) contains 오리 (duck), so the beef implied by 불고기 is removed and only 오리고기 (duck meat) remains.

갈비 (ribs), which is in `dual_protein_tokens`, is not in `alias`. So it is never read as an ingredient; it is used only as a method (갈비 · 구이, ribs · grilling).

**Meat of unknown species**: an ingredient whose species is unknown, such as 고기 (meat) (`육류(불명)`, meat, unspecified), is removed if the same name contains 돼지고기 (pork), 소고기 (beef), 닭고기 (chicken), 오리고기 (duck), 양고기 (lamb) or 육가공품 (processed meat). This is handled in `resolve`.

Examples parsed with the public dictionary:

| Menu name | Words | Method · cooking mode | Ingredients |
|---|---|---|---|
| 소고기국밥 (beef soup with rice) | 소고기 (ingredient) + 국밥 (method) | 국밥 (soup with rice) · 끓임 (simmering) | 소고기 (beef) |
| 시래기국 (dried radish greens soup) | 시래기 (ingredient) + 국 (method) | 국 (soup) · 끓임 | 건나물·묵나물 (dried greens) |
| 김치볶음밥 (kimchi fried rice) | 김치 (ingredient and method) + 볶음밥 (method) | 볶음밥 (fried rice) · 볶음 (stir-frying) | 김치·절임류 (kimchi & pickles) |
| 매콤제육볶음 (spicy stir-fried pork) | 매콤 (modifier) + 제육 (ingredient and method) + 볶음 (method) | 볶음 · 볶음 | 돼지고기 (pork) |
| 오리불고기 (duck bulgogi) | 오리 (ingredient) + 불고기 (ingredient and method) | 불고기 · 볶음 | 오리고기 (duck) |
| 돼지갈비찜 (braised pork ribs) | 돼지갈비 (ingredient) + 찜 (method) | 찜 · 찜 (steaming/braising) | 돼지고기 |

### 1-4. Plant-based meat rule

There is no verified emission factor for plant-based meat substitutes (none in `emission_factors.json`). So dishes whose main ingredient is a meat substitute are excluded from the calculation.

1. If any word in the name is in `plant_signal` (식물성 plant-based, 비건 vegan, 채식 vegetarian, 콩고기 soy meat, 대체육 meat substitute, etc.), the dish is treated as having a plant-based signal. All words are checked, whatever their type. For example, 콩고기 is an ingredient-type word but is still caught as a plant-based signal.
2. In such a dish, all meat and seafood ingredients are replaced by a single `식물성대체육` (plant-based meat substitute). Meat and seafood means ingredients in the categories 육류 (meat) or 어패류 (fish & shellfish), plus `plant_replace_stds` (육가공품 processed meat, 어묵·어육가공 fish cake & processed fish).
3. After the quantities are set (chapter 2), meat and seafood ingredients that were added as implicit template ingredients (`template-hidden`) or supplements (`template-supplement`) are discarded. Meat and seafood that were originally in the recipe are not discarded, even if they are not in the name. They are merged with the remaining meat and seafood into a single `식물성대체육`. The inclusion rate takes the larger value; the quantities (median, p25, p75) are summed.
4. If `inclusion rate × median` of `식물성대체육` is at least `10 g × segment scale factor` (`plant_exclude_min_g`), the whole dish is marked "excluded from calculation". Its emissions are 0, and the screen shows "Plant-based meat dish · not calculated".
5. If it is below that, only `식물성대체육` is removed and the dish is calculated from the remaining ingredients.

Example: 콩고기불고기 (soy-meat bulgogi) → 콩고기 (식물성대체육) + 불고기 (소고기) → the beef is replaced by 식물성대체육 → excluded from calculation.

## 2. Ingredient quantities per serving

Quantities are set by engine.js `resolve`. Depending on what data is found, the calculation tier (`tier`) is 1–4.

| Calculation tier | Condition | Source of quantities | On-screen label (CO₂e by Menu tab) |
|---|---|---|---|
| 1 | A recipe is found | The recipe's per-ingredient distributions | "Calculated from its own recipe", etc. |
| 2 | No recipe, but a method template exists (works even if no ingredient is read) | Method template | No label |
| 3 | No recipe or template, but ingredients are read | Per-ingredient overall distribution, or the default if none | "Estimated from ingredients only" |
| 4 | No recipe or template, and no ingredient read | None | "Unknown dish" |

Dishes that use a fallback value (section 3-5) show "Unknown dish" regardless of their calculation tier.

### 2-1. Finding a recipe

1. **Same name** (`exact`): if the cleaned name is in `recipes` as is, use it.
2. **Name without modifiers** (`core`): look up `core_index` with the name stripped of modifier and brand-name words (`coreKey`). Example: 매콤제육볶음 → 제육볶음.
3. **Recipe family** (`family`): if 3 or more (`family_min`) recipe names end with the input name, combine them. Only applies when the input name is 2 or more characters long.
4. **Recipe contained in the name** (`contained`): if the input name ends with a recipe name, use that recipe. The input name must be at least 4 characters and the recipe name at least 3 characters (`contained_min_len`). If several match, the longest name wins; on a tie, the one with more records.

The on-screen label is "Calculated from its own recipe" for 1 and 2, "Calculated from similar recipes" for 3, and "Calculated from the recipe named inside it" for 4.

### 2-2. Tier 1: recipe quantities

- By default, `quantity = recipe base distribution × segment scale factor` (provenance tag `recipe-base`).
- If the recipe has a distribution specific to the segment the app uses (`seg`), that distribution is used without scaling (`recipe-seg`). The current DB has no segment-specific distributions, so this path is not used.
- A recipe family (`family`) combines the member recipes, weighted by their record counts (`n`).

```
inclusion rate_j = Σ(n_r × inclusion rate_r,j) ÷ Σ n_r     (sum over all member recipes; a missing ingredient counts as 0)
median_j, p25_j, p75_j = n_r-weighted median of the values of the recipes that contain ingredient j
quantity = the above × segment scale factor                (provenance tag recipe-family)
```

- When a contained recipe (`contained`) is used, ingredients that are in the name but not in that recipe are added separately. Their quantity is looked up in the order template → per-ingredient overall distribution → 30 g (20–45 g), with inclusion rate 1. If there is a plant-based signal and the recipe contains meat or seafood, `식물성대체육` is not added separately (it is merged in step 3 of section 1-4).
- **Basic-seasoning supplement**: some segments' cooking guidelines do not list ingredients such as basic seasonings. The basis text in the code states that this is the case for the guidelines of the base segment, 지역아동센터 (community children's centres). So if none of a recipe's records come from `complete_segments` and a template exists for its method, the following ingredients are added from the template (`template-supplement`).
  - Target: ingredients in the categories 양념 (seasonings), 당류 (sugars) or 유지 (fats & oils); 쌀·잡곡 (rice & grains, `grain_like`); 육수·물·대파·마늘·양파·생강 (stock, water, green onion, garlic, onion, ginger; `complete_extra`)
  - Condition: template inclusion rate at least 0.3 (`presence_min`), and the ingredient is not already present
  - Quantity: template distribution × scale factor; the inclusion rate is the template value as is

### 2-3. Tier 2: method template

Without a recipe, quantities come from the method template. First, the ingredients read from the name are assigned to slots (`slotOf`), checking the rows from the top.

| Slot | Ingredients |
|---|---|
| Fat & oil | `oil_stds` (참기름 sesame oil, 들기름 perilla oil, 식용유 cooking oil, 버터 butter, 생크림 cream) |
| Seasoning | Ingredients in the categories 양념, 당류 or 유지 |
| Liquid | Ingredients in `water_stds` whose category is not 양념, 당류 or 유지 (currently 차·물, tea & water). 육수·스톡 (broth & stock) is in the 양념 category, so it goes to the seasoning slot |
| Food ingredient | Everything else |

Seasoning, fat & oil and liquid are handled by the same rules below. So the result is the same whichever slot 육수·스톡 goes to.

In some cases the list of food ingredients is trimmed before quantities are looked up. If the method is a ready-made product type (`product_methods`: 견과 nuts, 과일 fruit, 과자 snacks, 디저트 dessert, 떡 rice cake, 빵 bread, 유제품 dairy, 음료 beverages) and not fruit, and the food ingredients include items in the `product_cats` categories (가공식품 processed food, 견과 nuts, 곡류 grains, 면류 noodles, 유제품 dairy, 음료 beverages), only the one of those appearing latest in the name is kept as a food ingredient.

Of the remaining food ingredients, the one appearing **last** in the name is the main ingredient. All ingredients written in the name are included with inclusion rate 1, and their quantities are looked up in the order below. Every quantity is multiplied by the segment scale factor.

| Ingredient | Lookup order for the quantity |
|---|---|
| Main ingredient, in the template | The template's distribution for that ingredient |
| Main ingredient, not in the template | The template's `주재료` (main ingredient) slot distribution → per-ingredient overall distribution → 30 g (20–45 g) |
| Other food ingredients | The template's distribution for that ingredient → per-ingredient overall distribution → 15 g (10–25 g) |
| Seasoning, fat & oil, liquid | The template's distribution for that ingredient → per-ingredient overall distribution → 3 g (2–5 g) |

For `slot_exempt_methods` (짜장면, jjajangmyeon), a main ingredient not in the template does not use the `주재료` slot and follows the "other food ingredients" rule instead.

Then the following are applied.

1. **Implicit ingredients** (`template-hidden`): add ingredients that are not in the name but often appear in that method. Ingredients with a template inclusion rate of at least 0.3 are added in proportion to that rate (`inclusion rate × quantity`). However, if the main ingredient is a protein ingredient, other protein ingredients are not added. This step is skipped for ready-made product methods.
2. **Unknown main ingredient** (`template-unknown-main`): if no food ingredient was read from the name, the implicit ingredients include no food ingredient, and the template has a `주재료` slot distribution, that quantity is added as `기타채소` (other vegetables).

Protein ingredients are those in the categories 육류 or 어패류, or in `protein_like_stds` (만두류 dumplings, 식물성대체육, 어묵·어육가공, 육가공품, 조리완제품 ready-cooked foods, 튀김·완제품 fried & ready-made foods).

### 2-4. Tier 3: estimate from ingredients only

Without a method template, the per-ingredient overall distribution (`global_qty`) is used for each ingredient read from the name. If there is none, 30 g (20–45 g) is used. The inclusion rate is 1 and the segment scale factor is applied (`global-std`).

### 2-5. Tier 4: unreadable dishes

If there is no recipe, no method template, and not a single ingredient can be read, there are no quantities. Emissions then follow the fallback rules in section 3-5. If a method template exists, the dish is calculated at tier 2 even when no ingredient is read (see "Unknown main ingredient" in section 2-3).

### 2-6. Default values in the code

| Where used | Median | p25–p75 |
|---|---:|---:|
| Main ingredient, or an ingredient with no per-ingredient distribution (tiers 1–3) | 30 g | 20–45 g |
| Other food ingredients (tier 2) | 15 g | 10–25 g |
| Seasoning, fat & oil, liquid (tier 2) | 3 g | 2–5 g |

### 2-7. Segment scale factor

- All quantity distributions in the DB (`recipes.base`, `templates`, `global_qty`) are adjusted to one serving for the base segment (지역아동센터).
- Each segment records a scale factor (`scale`), basis (`basis`), source (`src`) and uncertainty (`sigma`). The base segment's scale factor is 1.
- The app always calculates with the **산업체오피스** segment (industrial sites & offices, i.e. adult workplace cafeterias). This is written as a constant in dash.js and app.js. The on-screen note "Per serving · adult workplace cafeteria" refers to this.
- The scale factor is applied to tier 1–3 quantities (except segment-specific distributions), the 10 g plant-based meat threshold, and the method fallback (section 3-5).
- The scale factors were built from internal material and are not included in the public data (`data/`).

## 3. Emission calculation

Emissions are computed by engine.js `emissions`. The default fuel is city gas (`cooking_fuel_default`).

### 3-1. Ingredient emissions

```
q_i = inclusion rate_i × median_i ÷ 1000             (kg)
E_i,stage = q_i × EF_i,stage                          (9 stages)
```

- The quantity is the **median** (not the mean) multiplied by the inclusion rate.
- The emission factor `EF` is `factors[ingredient]`. Ingredients not in the table use the `기타채소` factor.
- Emission factors are split into 9 stages. The first 8 stages (`luc` to `losses`) follow the breakdown of Poore & Nemecek (2018), hereafter P&N. The last stage, `disposal`, holds the disposal stage of product values from 환경성적표지 (Korea's Environmental Product Declaration certification, EPD; S005). Currently 11 ingredients have a value in this field (the 10 `direct_product` ingredients that use EPD values, plus 김치·절임류). For all others it is 0.
- On screen, the 9 stages are grouped into five.

| Screen stage | Values included |
|---|---|
| Production | `luc` (land-use change) + `farm` + `feed` |
| Processing | `processing` |
| Distribution | `transport` + `retail` + `packaging` + `losses` |
| Cooking | Cooking energy (section 3-2) |
| Disposal | `disposal` (disposal stage in the factor) + food-waste treatment (section 3-3) |

How the emission factor was built differs by ingredient. Details are in the `basis`, `note` and `components` fields of `emission_factors.json` and in the [data reference](DATA.md) (Korean).

| Quality grade | Ingredients | How it was built (typical example) |
|---|---:|---|
| `direct` | 47 | Source value used as is. Domestic beef, pork and chicken blend domestic and imported values by self-sufficiency rate (below) |
| `direct_product` | 10 | Median per kg of EPD-certified products (S005) + P&N distribution stages as a proxy |
| `group_mean` | 41 | Korean food-group mean (S003) split by P&N stage shares |
| `proxy` | 29 | Value of a similar food used instead (e.g. 오리고기 duck → P&N poultry) |
| `pending` | 3 | Provisional value; data not yet obtained |

Beef, pork and chicken are blended as follows.

- The domestic share is the 2024 self-sufficiency rate: beef 42%, pork 71%, chicken 75%. Domestic values are the stage-by-stage values from 기후솔루션 (Solutions for Our Climate, S002).
- Imported beef blends the US, Australia and New Zealand values from S002. The shares are `imported_beef_shares` (US 0.47, Australia 0.47, New Zealand 0.03); they sum to 0.97, so they are normalized to 1.
- Imported pork and chicken use P&N (S001) values instead.

### 3-2. Cooking energy

```
Q = Σ q_i                                            (total mass of all ingredients, kg)
E_cook = Q × MJ(cooking mode) × EF_fuel
EF_citygas    = 0.0561 kg CO₂e/MJ                    (natural gas 56,100 kg/TJ, S008)
EF_electricity = 0.4173 kg CO₂e/kWh ÷ 3.6 = 0.1159 kg CO₂e/MJ   (S009)
```

- `Q` includes not only seasonings and fats but also broth/stock and water (차·물). If these ingredients come in through a recipe, a template, or the basic-seasoning supplement (section 2-2), they are added too.
- The note on `cook_mj_per_kg` in `parameters.json` says '재료 질량(물 제외) 기준 적용' (applied to ingredient mass excluding water). The code does not exclude water.

The cooking mode is the one read in section 1-3, or 기타 (other) if none. Energy by cooking mode is `cook_mj_per_kg` (S006, household cooking energy intensities).

| Cooking mode | MJ/kg ingredients | kg CO₂e per kg ingredients (city gas) | kg CO₂e per kg ingredients (electricity) |
|---|---:|---:|---:|
| 끓임 simmering, 조림 braising, 찜 steaming, 데침 blanching, 기타 other | 3.5 | 0.1964 | 0.4057 |
| 볶음 stir-frying, 부침 pan-frying, 튀김 deep-frying | 7.5 | 0.4208 | 0.8694 |
| 구이 grilling/roasting | 8.5 | 0.4769 | 0.9853 |
| 무가열 no heat, 완제품 ready-made | 0 | 0 | 0 |

The emission factor of electricity per MJ is about 2.07 times that of city gas. That is why switching the cooking fuel to electricity in the simulator increases emissions.

### 3-3. Food waste

```
E_waste = Q × 0.15 × 0.1756                           (= Q × 0.02634)
```

- 0.15 is the ratio of food waste to cooked food (`waste_rate`, S011). Instead of the amount cooked, the code uses the total ingredient mass `Q` (including water and broth, section 3-2).
- 0.1756 kg CO₂e/kg is the composting treatment factor (`waste_treatment_kgco2e_per_kg`, S007). Per kg of wet weight: CH₄ 4 g × 28 + N₂O 0.24 g × 265 = 175.6 g (GWP: IPCC AR5 100-year values).
- Only treatment emissions are added here. Emissions from producing the ingredients of the discarded food are already included in ingredient emissions (section 3-1).

### 3-4. Total

```
Production   = Σ q_i × (luc + farm + feed)
Processing   = Σ q_i × processing
Distribution = Σ q_i × (transport + retail + packaging + losses)
Cooking      = E_cook
Disposal     = Σ q_i × disposal + E_waste
CO₂e per serving = Production + Processing + Distribution + Cooking + Disposal
Ingredient mass (on screen: 'ingredients ○○ g') = Q × 1000
```

For dishes that use the method fallback, the ingredient mass on screen is different (section 3-5).

### 3-5. Fallback values

Dishes that cannot be calculated from quantities use the values below.

| Case | Condition | Value used | On screen |
|---|---|---|---|
| Plant-based meat | Rule in section 1-4 | 0 (excluded from calculation) | "Plant-based meat dish · not calculated" |
| Method fallback | All four conditions below are met | Median emissions of dishes with that method in the historical menus × segment scale factor | "Unknown dish" + explanatory note (the note shows the overall weighted median) |
| Overall weighted median | Tier 4, the name contains Hangul, and it is not non-menu text | Weighted median of the historical menu data (`corpus.weighted_median`) | "Unknown dish" + explanatory note |
| Non-menu text | Tier 4 and none of the above applies | 0 | "Unknown dish" |

**Conditions for the method fallback**

1. The calculation tier is 2.
2. No food ingredient (an ingredient in the food-ingredient slot) was read from the name.
3. Among the quantities set, the sum of `inclusion rate × median` over food ingredients is below 20 g. The comparison uses the value after scaling.
4. A fallback value exists for that method (`corpus.method_prior[method]`).

When the method fallback is used, the calculation is:

- The total is split into production, processing, distribution, cooking and disposal using the shares in `method_prior.shares`.
- Waste-treatment emissions (`waste`) are not computed separately and are set to 0. The cooking share is the same regardless of fuel.
- The 'ingredients ○○ g' on screen is `method_prior.mass_g × segment scale factor`, not `Q`.

**Non-menu text**: if the name contains any of 행사 (event), 연휴 (holiday break), 적용 (applied), REF, 없음 (none), 휴무 (closed), 방학 (school vacation) or 명절 (national holiday), it is treated as text that is not a dish and 0 is used. This rule applies only at tier 4. So text that contains a dictionary word is calculated at tier 3 (chapter 8).

The two fallback values (median by method, overall weighted median) were built from internal menu data and are not included in the public data (`data/`). The explanatory note in the app calls the overall weighted median the "middle value".

### 3-6. Worked example

The example below is made up to illustrate the formulas. **The quantity is an assumption for explanation, not a real recipe quantity.** Assume a simmered dish with only 100 g of beef per serving, cooked with city gas. The public emission factor for beef is 41.3394 kg CO₂e/kg.

| Item | Calculation | kg CO₂e |
|---|---|---:|
| Production | 0.1 × (0 + 40.2947 + 0) | 4.0295 |
| Processing | 0.1 × 0.6857 | 0.0686 |
| Distribution | 0.1 × (0.359 + 0 + 0 + 0) | 0.0359 |
| Cooking | 0.1 × 3.5 × 0.0561 | 0.0196 |
| Disposal | 0.1 × 0 + 0.1 × 0.15 × 0.1756 | 0.0026 |
| Total | | 4.1562 |

## 4. Uncertainty and the 'plausible range'

### 4-1. Where it appears

- In the How It's Calculated tab, the total row of the example table shows "plausible range ○–○ kg CO₂e". The example uses the two dishes shown in the education module (by default 소고기국밥 and 시래기국), and the range is computed only for these two dishes.
- The education module computes the range of its two dishes in the same way but does not show it.
- The CO₂e by Menu tab, the Menu Swap Comparison tab and the simulator show no range.

### 4-2. Method

A Monte Carlo simulation in engine.js `monteCarlo`.

1. Run 2,000 iterations (`mc_iterations`).
2. Random numbers come from a mulberry32 generator with the seed fixed at 12345. So the same dish always gets the same range. Normally distributed random numbers are generated with the Box–Muller method.
3. Each uncertain value is multiplied by a lognormal multiplier with mean 1.

```
LN(σ) = exp(σ·z − σ²/2),  z ~ standard normal
```

4. In each iteration, the per-serving value is recalculated as follows.

```
Multipliers drawn once per iteration:  S = LN(0.15),  C = LN(0.4),  W = LN(0.3),  T = LN(0.5)
                                       B_j = LN(σ_EF,j)   (one per ingredient type j)
Multiplier drawn anew per ingredient:  LN(σ_q,i)

Include ingredient i?  If inclusion rate_i < 1, include it with probability inclusion rate_i
m_i = median_i ÷ 1000 × LN(σ_q,i) × S                (1 instead of S for a segment-specific distribution)
E = Σ m_i × EFtotal_i × B_j(i)
  + (Σ m_i) × MJ(cooking mode) × C × EF_fuel
  + (Σ m_i) × 0.15 × W × 0.1756 × T
```

- `B_j` is applied identically to the same ingredient within one iteration.
- The σ for quantities is set from the interquartile range of the distribution: `σ_q = min(1, ln(p75 ÷ p25) ÷ 1.349)`. If p75 is not greater than p25 or p25 is 0 or less, it is 0.35 (`sigma_qty_default`). 1.349 is the interquartile range of the standard normal distribution.
- For dishes calculated with a fallback value, `E = fallback value × LN(σ)`. σ is 0.6 for the method fallback and 1.0 for the overall weighted median (constants in the code).
- The fuel emission factor is not varied. For emission factors, the total (`total`) is varied, not the stage values.

5. Sort the 2,000 values and take the 10th percentile (p10) and the 90th percentile (p90). The position is the `round(fraction × (N − 1))`-th value.

| Varied value | σ (lognormal) | Parameter |
|---|---:|---|
| Ingredient quantity | Computed per distribution, default 0.35 | `sigma_qty_default` |
| Segment scale factor | 0.15 | `sigma_scale` |
| Emission factor (`direct_product`) | 0.2 | Per-ingredient `sigma` (`emission_factors.json`) |
| Emission factor (`direct`) | 0.3 | Per-ingredient `sigma` |
| Emission factor (`group_mean`) | 0.35 | Per-ingredient `sigma` |
| Emission factor (`proxy`) | 0.45 | Per-ingredient `sigma` |
| Emission factor (`pending`) | 0.6 | Per-ingredient `sigma` |
| Cooking energy | 0.4 | `cook_mj_per_kg.sigma` |
| Food waste ratio | 0.3 | `waste_rate.sigma` |
| Waste treatment factor | 0.5 | `waste_treatment_kgco2e_per_kg.sigma` |

The emission-factor σ is read from the per-ingredient `sigma` in `emission_factors.json`, not from `sigma_by_quality` in `parameters.json`. At present all 130 ingredients match the per-quality values in `sigma_by_quality`, so they can be summarized by grade as in the table above.

### 4-3. Reading the results

- The total on screen is the deterministic value from chapter 3, not the Monte Carlo median. So the total may not sit in the middle of the range.
- Because the multipliers have mean 1 and the inclusion probability equals the inclusion rate, the expected value of the iterations equals the deterministic value.
- The σ values are provisional assumptions. The note on `sigma_by_quality` says they convert "출처 1개 계수 ±30% 잠정" (single-source factor ±30%, provisional) into lognormal σ.

## 5. Cafeteria Simulator

Monthly Menu and Dashboard show the same simulator (`pane-sim`) split across two screens. They share the slider settings. All dish values in the simulator are 산업체오피스 per-serving values computed by the method in chapter 3.

### 5-1. Baseline menu

The baseline menu is the 4 weeks (20 lunches) of lunches written in dash.js (`R`). It is assumed to repeat over the year. The meat classification is based on the ingredients read from the dish names (section 5-2). Dish names are given in Korean as in the code, with an English gloss on first appearance.

| Date | Menu | Beef dishes | Pork, chicken & duck dishes |
|---|---|---|---|
| 11/2 (Mon) | 쌀밥 (white rice), 소고기무국 (beef & radish soup), 제육볶음 (spicy stir-fried pork), 콩나물무침 (seasoned bean sprouts), 배추김치 (napa cabbage kimchi) | 소고기무국 | 제육볶음 |
| 11/3 (Tue) | 혼합잡곡밥 (mixed-grain rice), 근대된장국 (chard soybean-paste soup), 소불고기 (beef bulgogi), 시금치나물 (seasoned spinach), 깍두기 (cubed radish kimchi) | 소불고기 | |
| 11/4 (Wed) | 흑미밥 (black rice), 순두부찌개 (soft tofu stew), 순살고등어구이 (grilled boneless mackerel), 감자채볶음 (stir-fried julienned potato), 배추김치 | | |
| 11/5 (Thu) | 소고기국밥 (beef soup with rice), 김계란말이 (rolled omelette with laver), 무말랭이무침 (seasoned dried radish), 깍두기 | 소고기국밥 | |
| 11/6 (Fri) | 기장밥 (millet rice), 콩비지찌개 (soybean-pulp stew), 돼지갈비찜 (braised pork ribs), 숙주나물 (seasoned mung bean sprouts), 배추김치 | | 돼지갈비찜 |
| 11/9 (Mon) | 현미밥 (brown rice), 소고기미역국 (beef seaweed soup), 가자미구이 (grilled flounder), 애호박나물 (sautéed zucchini), 배추김치 | 소고기미역국 | |
| 11/10 (Tue) | 잡곡밥 (multigrain rice), 아욱된장국 (mallow soybean-paste soup), 소고기숙주볶음 (beef & mung bean sprout stir-fry), 도라지무침 (seasoned bellflower root), 깍두기 | 소고기숙주볶음 | |
| 11/11 (Wed) | 쌀밥, 부대찌개 (army stew), 두부양념조림 (braised seasoned tofu), 오이무침 (seasoned cucumber), 배추김치 | | 부대찌개 |
| 11/12 (Thu) | 차조밥 (glutinous millet rice), 닭개장 (spicy chicken soup), 훈제오리구이 (grilled smoked duck), 청경채나물 (seasoned bok choy), 열무김치 (young radish kimchi) | | 닭개장, 훈제오리구이 |
| 11/13 (Fri) | 귀리밥 (oat rice), 시래기된장국 (dried radish greens soybean-paste soup), 국물소불고기 (beef bulgogi in broth), 느타리버섯볶음 (stir-fried oyster mushrooms), 배추김치 | 국물소불고기 | |
| 11/16 (Mon) | 보리밥 (barley rice), 오징어무국 (squid & radish soup), 안동찜닭 (Andong braised chicken), 가지나물 (seasoned eggplant), 깍두기 | | 안동찜닭 |
| 11/17 (Tue) | 쌀밥, 참치김치찌개 (tuna kimchi stew), 달달볶은어니언떡갈비 (tteokgalbi patties with caramelized onion), 연근조림 (braised lotus root), 배추김치 | | 달달볶은어니언떡갈비 |
| 11/18 (Wed) | 흑미밥, 우거지된장국 (cabbage-leaf soybean-paste soup), 소고기청경채볶음 (beef & bok choy stir-fry), 참나물무침 (seasoned chamnamul greens), 총각김치 (ponytail radish kimchi) | 소고기청경채볶음 | |
| 11/19 (Thu) | 수수밥 (sorghum rice), 계란파국 (egg & green onion soup), 순살삼치구이 (grilled boneless Spanish mackerel), 한식잡채 (japchae glass noodles), 배추김치 | | |
| 11/20 (Fri) | 잡곡밥, 황태무국 (dried pollack & radish soup), 매실청돈육간장불고기 (soy-sauce pork bulgogi with plum syrup), 미역줄기볶음 (stir-fried seaweed stems), 깍두기 | | 매실청돈육간장불고기 |
| 11/23 (Mon) | 혼합잡곡밥, 설렁탕&소면 (ox-bone soup with thin noodles), 메추리알조림 (braised quail eggs), 부추겉절이 (fresh chive salad), 깍두기 | 설렁탕&소면 | |
| 11/24 (Tue) | 현미밥, 얼갈이된장국 (young cabbage soybean-paste soup), 오리불고기 (duck bulgogi), 고사리나물 (seasoned bracken), 배추김치 | | 오리불고기 |
| 11/25 (Wed) | 쌀밥, 콩나물국 (bean sprout soup), 파채소불고기 (beef bulgogi with shredded green onion), 무생채 (spicy radish salad), 배추김치 | 파채소불고기 | |
| 11/26 (Thu) | 기장밥, 꽃게탕 (spicy blue crab stew), 매콤오징어볶음 (spicy stir-fried squid), 알감자조림 (braised baby potatoes), 배추김치 | | |
| 11/27 (Fri) | 쌀밥, 들깨미역국 (perilla seaweed soup), 소고기당면볶음 (beef & glass noodle stir-fry), 취나물무침 (seasoned aster greens), 깍두기 | 소고기당면볶음 | |

The meat-free day menu is **잡곡밥, 시래기된장국, 두부양념조림, 시금치나물, 배추김치** (multigrain rice, dried radish greens soybean-paste soup, braised seasoned tofu, seasoned spinach, napa cabbage kimchi) (`K`).

None of the 20 baseline lunches or the meat-free day menu contain a dish calculated with a fallback value (section 3-5).

### 5-2. Splitting one dish

The simulator stores each dish's per-serving emissions in four parts (dash.js `Q`).

| Part | Value |
|---|---|
| Ingredient emissions | Sum of the 9-stage emissions of all ingredients. For fallback dishes, `total − cooking − waste treatment` goes into 'Processed foods & seasonings' |
| Cooking (city gas) | Cooking emissions calculated with city gas |
| Cooking (electricity) | Cooking emissions recalculated with electricity. Equal to the city-gas value for method-fallback dishes |
| Waste treatment | `E_waste` from section 3-3. 0 for method-fallback dishes |

For method-fallback dishes, section 3-5 splits off the cooking share regardless of fuel. So switching the fuel to electricity does not change these dishes. Choosing renewable energy sets the cooking share to 0. The baseline menu has no such dishes, so the example results are not affected.

Ingredient emissions are grouped into seven groups by ingredient category for the charts.

| Group | Ingredients |
|---|---|
| Beef | 소고기 |
| Pork, chicken & other meat | Ingredients in the 육류 (meat) category except beef, plus 육가공품 |
| Fish, eggs & dairy | Ingredients in the categories 어패류, 난류 (eggs) or 유제품 (dairy) |
| Rice, grains & noodles | Ingredients in the categories 곡류 (grains) or 면류 (noodles) |
| Vegetables, fruit & legumes | Ingredients in the categories 채소 (vegetables), 과일 (fruit), 버섯 (mushrooms), 해조류 (seaweed), 두류 (legumes) or 견과 (nuts) |
| Processed foods & seasonings | All other ingredients |
| Cooking energy & food waste | Cooking emissions + waste-treatment emissions |

A dish's meat class is set by its ingredients. If it contains 소고기, it is 'beef'; otherwise, if it contains 돼지고기 or 육가공품, it is 'pork'; otherwise, if it contains 닭고기 or 오리고기, it is 'chicken & duck'. Each meat dish is assigned one substitute dish (section 5-4).

A dish in which only 양고기 (lamb) or `육류(불명)` is read belongs to none of the three meat sliders. So moving the sliders does not change it. The baseline menu has no such dishes.

### 5-3. Sliders

| Slider | Range (step) | Default | Effect on the calculation |
|---|---|---|---|
| Daily diners | 100–3,000 (50) | 500 | Multiplies the annual total. Applied equally to the current and the changed menu |
| Transition period | 0–12 months (1) | 0 (immediate) | Sets the effect ratio F for the annual total (section 5-6) |
| Beef dishes | 0–100% (5) | 100% (as now) | The reduced share `s = (100 − value) ÷ 100` is replaced by the substitute dish |
| Pork dishes | 0–100% (5) | 100% | Same as above (돼지고기 and 육가공품) |
| Chicken & duck dishes | 0–100% (5) | 100% | Same as above |
| Meat-free days | 0–5 per week (1) | 0 | Replaces `v ÷ 5` of the average lunch with the meat-free day menu |
| Portion size | 80–120% (5) | 100% | Multiplies ingredient, cooking and waste-treatment emissions by `k = value ÷ 100` |
| Reduce food waste | 0–50% (5) | 0 | Multiplies only waste-treatment emissions by `1 − value ÷ 100` |
| Cooking energy | City gas / Electricity / Renewable | City gas | Sets cooking emissions to the city-gas value, the electricity value, or 0 |

### 5-4. Rules for choosing a substitute dish

When meat dishes are cut, their place is assumed to be filled by a substitute dish with the same role. The recommendation list in the Menu Swap Comparison tab uses the same rules. The code is `g` (role) and `y` (candidate search) in dash.js.

**A dish's role** is set by its method, checking from the top.

| Order | Method | Role |
|---|---|---|
| 1 | `roles.kimchi` | 김치 (kimchi) |
| 2 | `roles.rice` | 밥 (rice) |
| 3 | `roles.soup` | 국·찌개 (soup/stew) |
| 4 | `roles.noodle` | 면 (noodles) |
| 5 | `roles.snack` | 간식·후식 (snack/dessert) |
| 6 | 볶음 stir-fry, 조림 braise, 찜 steam/braise, 구이 grill, 튀김 deep-fry, 전 pan-fried fritter | 주찬 (main side dish) if it has a protein ingredient, otherwise 부찬 (minor side dish) |
| 7 | `roles.main` | 주찬 |
| 8 | `roles.side` | 부찬 (주찬 if 잡채 japchae has a protein ingredient) |
| 9 | Anything else | 주찬 if it has a protein ingredient, otherwise 기타 (other) |

Here, protein ingredients are those in `protein_stds` or `protein_like_stds`.

**Substitute dish candidates** are taken from the list of dishes in the historical menu data (`corpus.results`, not public).

1. No search is made if the original dish's role is 김치 or 기타, or if it was calculated with a fallback value.
2. The original dish's value is divided by the segment scale factor to convert it to the base-segment value. If this is below 0.15 kg CO₂e, no search is made.
3. Only dishes that meet all of the following become candidates.
   - Calculated at calculation tier 1 (recipe).
   - Same role as the original dish.
   - Base-segment value at least 0.05 and no more than half the original dish's value.
   - Appeared 3 or more times in the historical menus (`corpus.freq`).
   - Name differs from the original dish and contains no `/`, `&` or `+`.
4. Candidates with the same method come first, then by frequency. If there is at least one candidate with the same method, only those are considered.
5. Up to 300 candidates are examined from the front. Of candidates with the same name after removing modifiers, only one is kept. If the original dish has a protein ingredient, only candidates with a protein ingredient are accepted.
6. Candidates are recalculated as 산업체오피스 servings, and only those with a lower value than the original are accepted. Up to 5 are collected.

The simulator uses **the first of these that contains no beef** as the substitute dish. If there is no substitute dish, that dish does not change when the sliders move.

### 5-5. Average per lunch

Under settings `c`, the per-serving emissions of one dish `m` (`lt`) are:

```
Cook_m(c)  = Cooking (city gas) for city gas, Cooking (electricity) for electricity, 0 for renewable
Waste_m(c) = Waste treatment_m × (1 − food-waste reduction rate)
E_m(c) = (Ingredient emissions_m + Cook_m(c) + Waste_m(c)) × k
```

The per-person emissions of one lunch on day `d` (`rt`) mix in substitute dishes in proportion to how much each meat class has been cut.

```
E_d(c) = Σ_m [ (1 − s_m) × E_m(c) + s_m × E_sub(m)(c) ]
s_m = reduced share for the dish's meat class (0 if it is not a meat dish or has no substitute dish)
```

The average per lunch over all 20 lunches (`ct`) is:

```
Ē(c) = (1/20) × Σ_d E_d(c)
With v meat-free days per week:
Ē(c) = (1 − v/5) × Ē(c) + (v/5) × E_meatfree(c)
```

Meat-dish cuts are not applied to the meat-free day menu. Portion size, food-waste reduction and cooking fuel are applied. Cuts do not pick specific days; every affected dish is mixed at the same ratio.

### 5-6. Annual total and transition period

Calculated inside dash.js `gt`.

```
Y0 = Ē(default settings) × daily diners × 260        (current menu)
Yt = Ē(current settings) × daily diners × 260        (after the changed menu is fully in place)
f_t = min(1, (t − 0.5) ÷ R),  t = 1…12                (R = transition period in months; if R = 0, f_t = 1)
F = (f_1 + … + f_12) ÷ 12
Y1 = Y0 + F × (Yt − Y0)                               (changed menu, first year)
CO₂e reduced over one year = Y0 − Y1,  ratio = (Y0 − Y1) ÷ Y0
```

- 260 is 52 weeks × 5 days.
- 'Default settings' means all sliders at their defaults. Daily diners alone uses the current value for both menus. So changing only daily diners gives a reduction of 0.
- f_t assumes the effect grows linearly, evaluated at the middle of each month.

| Transition period R | 0 (immediate) | 3 months | 6 months | 12 months |
|---|---:|---:|---:|---:|
| First-year effect ratio F | 1 | 0.875 | 0.75 | 0.5 |

- Cumulative chart: the current menu adds `Y0 ÷ 12` each month; the changed menu adds `(Y0 + f_t × (Yt − Y0)) ÷ 12` each month.
- Bars by food group: the annual value for each of the 7 groups is computed the same way.
- If the absolute reduction is below 0.5 kg, it is shown as 0.

### 5-7. Equivalents on the result card

| Display | Calculation |
|---|---|
| Distance by passenger car | `1000 × (absolute difference between Y0 and Y1) ÷ 141.3` km (S013) |
| Bowls of 소고기국밥 | `(absolute difference between Y0 and Y1) ÷ CO₂e per serving of 소고기국밥` bowls |
| Average per person per lunch | `Ē(default settings)` → `Ē(current settings)` kg CO₂e. The changed side is the value after the change is fully in place, regardless of the transition period |

The 소고기국밥 per-serving value is the 산업체오피스 value calculated by the method in chapter 3. The Korean page shortens numbers of 10,000 or more with the Korean unit 만 (ten thousand).

### 5-8. Monthly Menu calendar

Code: rolehub.js `renderMonth`

- Each cell shows that day's per-person lunch emissions `E_d(current settings)`. Cells whose value has changed also show the default-settings value, struck through.
- Meat-free days are spread evenly across the weekdays: 1 per week is Wednesday; 2 is Tuesday and Thursday; 3 is Monday, Wednesday and Friday; 4 is Monday, Tuesday, Thursday and Friday; 5 is every day. Those cells show the meat-free day menu value.
- The percentage next to a substitute dish is the share `s_m` of that dish being replaced. When everything is replaced at 100%, no percentage is shown; the original dish is struck through and dimmed.
- The bar colour in each cell is green below 1.6 kg, orange from 1.6 to 2.5 kg, and red at 2.5 kg or more.
- The summary at the top ('Average per person per lunch' and the annual effect) uses the same formulas as the Dashboard (sections 5-5 and 5-6). Unlike the calendar, which places meat-free days on specific weekdays, the average mixes them in at the ratio `v/5`, so it can differ slightly from a simple average of the 20 cells.
- 'Whole cafeteria for the month' is `Ē(current settings) × 20 lunches × daily diners`.

### 5-9. Starting settings

| Purpose | Initial slider settings |
|---|---|
| Menu Planning (for dietitians), Impact Tracking (for companies & operators) | All defaults ("current menu as is") |
| Climate Education (for diners), View All | Beef dishes −50%, meat-free days once a week (the original example settings) |

## 6. Numbers in the education module

The education module calculates two dishes (default: 소고기국밥 and 시래기국) by the method in chapter 3. Whichever has the higher value becomes the first dish.

The dishes can be changed by adding `?a=<menu name>&b=<menu name>` to the URL.

1. Only names at calculation tiers 1–3 that do not use a fallback value are accepted. Rejected names leave a warning in the browser console.
2. If only one name is accepted, the other is filled with a default dish: 소고기국밥 if the accepted name is 시래기국, otherwise 시래기국.
3. If no name is accepted, the two default dishes are used.
4. If at least one name is accepted, the Start screen shows a "Today's menu" label. If `d` is given a date text, it is appended after the label.

```
Δ = round2(round2(E_higher) − round2(E_lower))       (amount saved by one swap, kg CO₂e)
ratio = E_higher ÷ E_lower
```

| Equivalent | Calculation | Source |
|---|---|---|
| Passenger-car km | `round(1000 × Δ ÷ 141.3)` | S013 (excludes fuel production) |
| Smartphone charges | `Δ ÷ (0.019 kWh × 0.4173 kg/kWh)` | S014, S009 |
| Days of absorption by a pine tree | `Δ ÷ (6.6 kg ÷ 365 days)` | S015 |
| Electricity kWh | `Δ ÷ 0.4173` | S009 |
| Annual effect | `Δ × swaps per week (1–5) × 52` | The same equivalents applied to the annual value |

The numbers in the on-screen text are set as follows.

| Text | Calculation |
|---|---|
| '○ times more' | Integer if the ratio is 10 or more; otherwise one decimal place |
| 'N% of this comes from ○○' | Emissions of the highest-emitting ingredient ÷ the higher dish's total (`mainShare`), rounded as a percentage |
| 'only about N%' | `max(1, round(100 ÷ ratio))` |
| 'about N% comes from beef' | Beef emissions ÷ the higher dish's total (`beefShare`), rounded as a percentage |

Of the story scenes, the five cattle-farming scenes (`chFarm` to `chUndo`) appear only when the higher dish's `beefShare` is 0.5 or more. Otherwise only the first scene (taking one bowl apart) appears.

In the Menu Swap Comparison tab (called Menu Swap under Menu Planning), the difference is also computed after rounding both values to two decimal places. The reduction rate is `(A − B) ÷ A`.

## 7. Calculating with public data only

- The published `data/` has no per-serving quantities (`recipes`, `templates`, `global_qty`), segment scale factors (`segments`) or historical menu data (`corpus`). To reproduce the same numbers as this app, you must build quantity data of the same format yourself.
- If the quantity data is left empty, the engine calculates at tier 3, putting 30 g (20–45 g) for each ingredient read from the name. The method fallback and substitute-dish recommendations do not work either. As a result, cutting meat dishes in the simulator has no effect. The autocomplete list of the menu input box is also empty.
- Even when left empty, the keys must exist. The requirements are:
  - `segments` must contain an entry for '산업체오피스'. Without it, dash.js stops right at startup. With `scale` set to 1, the default quantities are used as is. `basis`, `src` and `sigma` are used for the provenance display and the How It's Calculated tab.
  - At startup, dash.js reads `segments["산업체오피스"].scale`, `corpus.results` and `corpus.freq` (autocomplete list). It also reads `corpus.results` and `corpus.freq` when finding substitute dishes.
  - The menu comparison screen uses `corpus.weighted_median` in the fallback explanatory note.
  - Depending on the case, the engine reads `recipes`, `core_index`, `templates`, `global_qty`, `complete_segments`, `corpus.method_prior` and `corpus.weighted_median`.
  - `meta` is not read.
- The public `tokens` lacks the 56 brand-name words. For menu names containing a brand name, word splitting and recipe lookup may give different results.
- The command to rebuild the app with your own data is below. The data JSON must contain every item in the table above (`meta` may be omitted).

```
python3 tools/pack.py src/build/ index.html --payload my_payload.json
```

- The public `src/build/` has no `payload.json`, so `--payload` is required. Without it, the build stops while looking for `src/build/payload.json`.
- The English page is built from `src/build-en/` with the same data: `python3 tools/pack.py src/build-en en/index.html --payload my_payload.json --base src/build`.
- The full build procedure and an example of merging data are in the [Build Guide](BUILD_GUIDE.en.md).

## 8. Limitations

These are the limitations stated on the app screens and in the notes of the public data, plus those found in the code.

| Part | Limitation |
|---|---|
| Baseline menu | It is an example menu, so it differs from a real cafeteria's menu and number of diners. |
| Per-serving quantities | An estimate: the median of the internal cooking-guideline distributions times the segment scale factor. Dishes without a recipe are estimated from a method template, per-ingredient distributions or defaults. |
| Unparsed dishes | Replaced by the overall weighted median or the median by method from the historical menu data. Even when the median by method is used, the explanatory note on screen shows the overall weighted median. |
| Non-menu text | The rule that filters text such as 휴무 (closed) applies only at tier 4. Text containing a dictionary word is calculated at tier 3. For example, with public data only, 휴무 is read as 무 (radish, an ingredient) and calculated as 30 g of radish. |
| Plant-based meat | Excluded from the calculation because there is no verified emission factor. It can be calculated once a factor is available. |
| Emission factors | Apart from domestic beef, pork and chicken, most use the global averages of Poore & Nemecek (2018) or Korean food-group means. There are 29 proxies (`proxy`) and 3 without data (`pending`). |
| Cooking energy | Household cooking energy intensities. Large-batch cooking in institutional food service may use less energy per kg, so these values are close to an upper bound. The cooking fuel is assumed to be city gas. Unlike the parameter note, the code also adds the mass of water and broth (section 3-2). |
| Food waste | 15% is the Ministry of National Defense estimate for military food service, used as a proxy elsewhere. Treatment is assumed to be composting; animal feed and anaerobic digestion have lower emissions. |
| Transport | The truck transport factor (`truck_kgco2e_per_tkm`) is already included in the P&N distribution values, so it is not used in the calculation. |
| Uncertainty | σ values are provisional assumptions. Uncertainty of the fuel emission factors is not included. |
| Simulator | Cut meat dishes are assumed to be replaced by a substitute dish with the same role. Without a substitute dish, nothing changes. Dishes in which only 양고기 or `육류(불명)` is read do not change either. The effect is assumed to grow linearly over the transition period, and emissions are assumed to scale with portion size. Food-waste reduction lowers only treatment emissions. Renewable electricity is treated as zero-emission. Method-fallback dishes do not change when the fuel is switched to electricity. |
| Equivalents | The passenger-car value of 141.3 g/km excludes emissions from producing the fuel. |

## 9. Sources

S001–S012 are in [sources.json](../data/sources.json). S013–S015 are written in the dash.js code, for the equivalents on the result screens. Titles and publishers are kept in their original language, with an English gloss in parentheses where they are Korean.

| ID | Source | Use in this calculation |
|---|---|---|
| S001 | Poore & Nemecek (2018), *Science* 360(6392) / Our World in Data | Stage-by-stage emission factors for most ingredients, proxy values for distribution stages, imported pork and chicken |
| S002 | 기후솔루션 (2026), 「고기, 농장에서 매장까지」 (Solutions for Our Climate, "Meat, from farm to store") | Emission factors for domestic beef, pork and chicken; imported beef (US, Australia, New Zealand); self-sufficiency rates and import shares |
| S003 | Hong & Kim (2025), *Environmental Health Perspectives* 133(6), greenhouse gas database of diets based on KNHANES (Korea National Health and Nutrition Examination Survey) | Korean food-group mean emission factors |
| S004 | 이지선 외 (2022), 「통계자료를 활용한 국내 과수 농산물의 전과정평가 연구」, 한국기후변화학회지 13(6) (Lee J. et al., life-cycle assessment of Korean fruit crops using statistical data, Journal of Climate Change Research) | On hold because there is no per-kg conversion data. Not used in the current emission factors |
| S005 | 환경성적표지 인증제품 유효현황 (2025.12.31) (list of currently valid Environmental Product Declaration–certified products, Korea) | Emission factors for processed products, `disposal` stage values |
| S006 | *Italian Journal of Food Science* (2021), "Environmental impact of the main household cooking systems - A survey" (citing Foster et al. 2006) | Energy by cooking mode (MJ/kg) |
| S007 | 2006 IPCC Guidelines, Vol. 5, Ch. 4, Table 4.1 | CH₄ and N₂O from composting food waste |
| S008 | 2006 IPCC Guidelines, Vol. 2, Ch. 2, Table 2.2 | City gas (natural gas) emission factor |
| S009 | 2023년 국가 전력배출계수 확정 공표 (final national electricity emission factor for 2023, Korea; 0.4173 tCO₂eq/MWh) | Electric cooking; smartphone and electricity equivalents |
| S010 | 군 급식 1일 영양 기준 (국방부, 2017) (daily nutrition standard for military food service, Ministry of National Defense) | Basis for the military segment scale factor |
| S011 | 대한급식신문 (2015) (Korea Food Service News), Ministry of National Defense estimate: food waste 15% of food cooked | Food waste ratio |
| S012 | Caterer's internal cooking guidelines (급식회사 내부 조리지침서; not public) | Per-serving quantity distributions, method templates, segment scale factors, historical menu data |
| S013 | 환경부 보도자료 (2022) (Ministry of Environment press release): actual average of passenger cars and vans sold in 2020, 141.3 g/km | Passenger-car equivalent |
| S014 | US EPA, Greenhouse Gases Equivalencies Calculator (one smartphone charge 0.019 kWh) | Smartphone-charge equivalent |
| S015 | 국립산림과학원 (2019), 「주요 산림수종의 표준 탄소흡수량」 (National Institute of Forest Science, standard carbon uptake of major forest tree species; 30-year-old pine 6.6 kg per year) | Pine-tree equivalent |

## 10. License

- This document and the data in `data/` are published under CC BY 4.0. A citation example is in [LICENSE-DATA.md](../LICENSE-DATA.md).
- The code is MIT ([LICENSE](../LICENSE)).
- Source materials (S001–S015) are subject to each publisher's terms of use. The terms for each source are in [sources.json](../data/sources.json) and [NOTICE.md](../NOTICE.md).
