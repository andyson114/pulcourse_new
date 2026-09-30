// 대시보드(window.Dash): 메뉴별 비교·메뉴 바꾸기·시뮬레이터(한 달 식단/대시보드)·계산 방법 탭
// 읽기용 사본입니다. 실제 빌드에는 build/app.bundle.js(압축 해제 원문)를 씁니다.
const Dash = (function () {
  "use strict";
  const t = window.PAYLOAD;
  Engine.init(t);
  const e = "산업체오피스",
    s = t.segments[e].scale,
    i = (t, e = document) => e.querySelector(t),
    n = (t, e = document) => Array.from(e.querySelectorAll(t)),
    o = (t) =>
      String(t).replace(/[&<>"]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t]),
    a = (t) => {
      const e = String(t).charCodeAt(String(t).length - 1);
      if (!(e >= 44032 && e <= 55203)) return "(으)로";
      const s = (e - 44032) % 28;
      return 0 === s || 8 === s ? "로" : "으로";
    },
    l = (t) => t.toFixed(2),
    r = (t) =>
      Math.abs(t) >= 1e3
        ? (t / 1e3).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + "톤 CO₂e"
        : (Math.abs(t) >= 100 ? Math.round(t).toLocaleString("ko-KR") : t.toFixed(t >= 10 ? 1 : 2)) +
          "kg CO₂e",
    c = new Map();
  function d(t) {
    if (((t = String(t).trim()), c.has(t))) return c.get(t);
    const s = Engine.resolve(t, e),
      i = Engine.emissions(s, {}),
      n = { name: t, res: s, det: i, total: i.total };
    return (c.set(t, n), n);
  }
  const h = [
      ["production", "생산", "#2a78d6"],
      ["processing", "가공", "#eb6834"],
      ["distribution", "유통", "#1baf7a"],
      ["consumption", "조리", "#eda100"],
      ["disposal", "폐기", "#e87ba4"],
    ],
    p = {
      육류: "육류",
      어패류: "어패류",
      유제품: "유제품·달걀",
      난류: "유제품·달걀",
      곡류: "곡류·면",
      면류: "곡류·면",
      채소: "채소·과일·버섯",
      과일: "채소·과일·버섯",
      버섯: "채소·과일·버섯",
      해조류: "채소·과일·버섯",
      두류: "콩·견과",
      견과: "콩·견과",
      가공식품: "가공식품",
      "김치·절임": "김치·양념",
      양념: "김치·양념",
      당류: "김치·양념",
      유지: "김치·양념",
      음료: "가공식품",
    },
    u = {
      육류: "🥩",
      어패류: "🐟",
      "유제품·달걀": "🥚",
      "곡류·면": "🌾",
      "채소·과일·버섯": "🥬",
      "콩·견과": "🫘",
      가공식품: "🥫",
      "김치·양념": "🧂",
      기타: "🍽️",
    },
    f = t.rules.roles;
  function g(e) {
    const s = e.method,
      i = e.parse.stds.some((e) => t.rules.protein_stds.includes(e) || t.rules.protein_like_stds.includes(e));
    return f.kimchi.includes(s)
      ? "김치"
      : f.rice.includes(s)
        ? "밥"
        : f.soup.includes(s)
          ? "국·찌개"
          : f.noodle.includes(s)
            ? "면"
            : f.snack.includes(s)
              ? "간식·후식"
              : ["볶음", "조림", "찜", "구이", "튀김", "전"].includes(s)
                ? i
                  ? "주찬"
                  : "부찬"
                : f.main.includes(s)
                  ? "주찬"
                  : f.side.includes(s)
                    ? i && "잡채" === s
                      ? "주찬"
                      : "부찬"
                    : i
                      ? "주찬"
                      : "기타";
  }
  const m = (e) =>
    e.parse.stds.some((e) => t.rules.protein_stds.includes(e) || t.rules.protein_like_stds.includes(e));
  function y(e, i = 3) {
    const n = g(e.res);
    if ("김치" === n || "기타" === n || e.det.fallback) return [];
    const o = e.det.total / (e.res.recipeSeg ? 1 : s);
    if (o < 0.15) return [];
    const a = [];
    for (const s in t.corpus.results) {
      const [i, l, r, c] = t.corpus.results[s];
      if (r !== n || 1 !== i || l < 0.05 || l > 0.5 * o || s === e.res.key || /[\/&+]/.test(s)) continue;
      const d = t.corpus.freq[s] || 0;
      d < 3 || a.push({ m: s, fq: d, same: c === e.res.method });
    }
    a.sort((t, e) => e.same - t.same || e.fq - t.fq);
    const l = a.some((t) => t.same),
      r = m(e.res),
      c = [],
      h = new Set();
    let p = 0;
    for (const t of a) {
      if (l && !t.same) break;
      if (++p > 300) break;
      const s = Engine.coreKey(t.m);
      if (h.has(s)) continue;
      const n = d(t.m);
      if (r && !m(n.res)) continue;
      h.add(s);
      const o = e.total - n.total;
      if ((o > 0 && c.push({ name: t.m, total: n.total, saving: o, fq: t.fq }), c.length >= i)) break;
    }
    return c;
  }
  const x = Object.keys(t.corpus.results)
      .filter((e) => t.corpus.results[e][0] <= 3 && !/[\/+]/.test(e))
      .sort((e, s) => (t.corpus.freq[s] || 0) - (t.corpus.freq[e] || 0)),
    $ = x.map((t) => t.replace(/\s+/g, ""));
  function b(t, e, s) {
    t.insertAdjacentHTML(
      "beforeend",
      `<input type="text" autocomplete="off" aria-label="${o(t.querySelector("label") ? t.querySelector("label").textContent : "메뉴")}"><i class="mag"></i><div class="plist" role="listbox"></div>`,
    );
    const n = i("input", t),
      r = i(".plist", t);
    let c = [],
      h = -1,
      p = e;
    n.value = e;
    const u = () => {
        c = (function (t) {
          if (!(t = t.replace(/\s+/g, ""))) return x.slice(0, 8);
          const e = [],
            s = [];
          for (let i = 0; i < x.length && e.length < 8; i++) {
            const n = $[i];
            n.startsWith(t) ? e.push(x[i]) : s.length < 8 && n.includes(t) && s.push(x[i]);
          }
          return e.concat(s).slice(0, 8);
        })(n.value);
        const t = n.value.trim();
        ((r.innerHTML =
          (c.length
            ? c
                .map(
                  (t, e) =>
                    `<button type="button" data-i="${e}" class="${e === h ? "act" : ""}">${o(t)}<span>${l(d(t).total)}kg CO₂e</span></button>`,
                )
                .join("")
            : "") +
          (t && !c.includes(t)
            ? `<button type="button" data-free="1">'${o(t)}'${a(t)} 계산<span>직접 입력</span></button>`
            : "") +
          (c.length || t ? "" : '<div class="empty">메뉴 이름을 입력해 보세요</div>')),
          r.classList.add("open"));
      },
      f = (t) => {
        (t = t.trim()) ? ((p = t), (n.value = t), r.classList.remove("open"), (h = -1), s(t)) : (n.value = p);
      };
    return (
      n.addEventListener("focus", () => {
        (n.select(), (h = -1), u());
      }),
      n.addEventListener("input", () => {
        ((h = -1), u());
      }),
      n.addEventListener("keydown", (t) => {
        ("ArrowDown" === t.key
          ? ((h = Math.min(c.length - 1, h + 1)), u(), t.preventDefault())
          : "ArrowUp" === t.key
            ? ((h = Math.max(0, h - 1)), u(), t.preventDefault())
            : "Enter" === t.key
              ? (f(h >= 0 ? c[h] : n.value), n.blur(), t.preventDefault())
              : "Escape" === t.key && ((n.value = p), r.classList.remove("open"), n.blur()),
          t.stopPropagation());
      }),
      r.addEventListener("mousedown", (t) => {
        const e = t.target.closest("button");
        e && (t.preventDefault(), f(e.dataset.free ? n.value : c[+e.dataset.i]), n.blur());
      }),
      n.addEventListener("blur", () =>
        setTimeout(() => {
          (r.classList.remove("open"), n.value.trim() !== p && (n.value = p));
        }, 120),
      ),
      {
        set(t) {
          ((p = t), (n.value = t));
        },
        get: () => p,
      }
    );
  }
  const k = i("#tip");
  function v(t, e, s) {
    ((k.innerHTML = t), k.classList.add("show"));
    const i = k.getBoundingClientRect();
    let n = e + 16,
      o = s - i.height - 12;
    (n + i.width > innerWidth - 8 && (n = Math.max(8, e - i.width - 16)),
      o < 8 && (o = s + 16),
      (k.style.left = n + "px"),
      (k.style.top = o + "px"));
  }
  const w = () => k.classList.remove("show");
  function E(t, e) {
    const s = Engine.provenance(t.res, t.det),
      i = t.det.per.slice().sort((t, e) => e.total - t.total),
      n = i.length ? i[0].total : 1,
      a = t.det.total || 1;
    return i
      .slice(0, e || i.length)
      .map((t) => {
        const e = ((r = t.std), p[Engine.cat(r)] || "기타"),
          i = s.ingredients.find((e) => e.std === t.std);
        var r;
        const c = i ? i.factor.value : t.factor && t.factor.total;
        return `<div class="irow"><div class="ic">${u[e]}</div><div><div class="nm">${o(t.std)}</div><div class="ds">${(1e3 * t.q_kg).toFixed(0)}g · 배출계수 ${null != c ? (+c).toFixed(2) : "-"}kg/kg</div><div class="ib"><b style="width:${(t.total / n) * 100}%"></b></div></div><div class="v">${t.total < 0.01 ? t.total.toFixed(3) : l(t.total)}kg CO₂e<span>${((t.total / a) * 100).toFixed(0)}%</span></div></div>`;
      })
      .join("");
  }
  const F = {
      S013: {
        source_id: "S013",
        title: "2020년 판매 승용·승합차의 실제 평균 온실가스 배출량 141.3 g/km (연료 생산 과정 제외)",
        publisher: "환경부 보도자료 (2022)",
        url: "",
        note: "결과 화면 승용차 환산: kg CO₂e ÷ 0.1413 kg/km",
      },
      S014: {
        source_id: "S014",
        title:
          "Greenhouse Gases Equivalencies Calculator — Calculations and References: smartphones charged, 0.019 kWh per charge (2022 data)",
        publisher: "US EPA",
        url: "https://www.epa.gov/energy/greenhouse-gases-equivalencies-calculator-calculations-and-references",
        note: "결과 화면 스마트폰 환산: kg CO₂e ÷ (0.019 kWh × 0.4173 kg/kWh[S009])",
      },
      S015: {
        source_id: "S015",
        title:
          "주요 산림수종의 표준 탄소흡수량 (ver. 1.2): 30년생 소나무 1그루가 1년에 흡수하는 이산화탄소 6.6 kg",
        publisher: "국립산림과학원 산림정책이슈 제129호 (2019)",
        url: "https://book.nifos.go.kr/detailview.do?MASTER_ID=5816725",
        note: "결과 화면 소나무 환산: kg CO₂e ÷ (6.6 kg ÷ 365일)",
      },
    },
    M = Object.assign({}, t.sources, F),
    L = (...t) => {
      return (
        (e = t.map((t) => ({ id: t }))),
        [...new Set((e || []).map((t) => t.id))]
          .map(
            (t) =>
              `<button type="button" class="src" data-src="${t}" data-tip="${o(M[t] ? M[t].title : t)}" aria-label="출처 ${t} 보기">${t}</button>`,
          )
          .join("")
      );
      var e;
    },
    C = matchMedia("(hover: none)").matches;
  function A(t) {
    C ||
      (t.addEventListener("mousemove", (t) => {
        const e = t.target.closest("[data-tip]");
        e ? v(o(e.dataset.tip), t.clientX, t.clientY) : w();
      }),
      t.addEventListener("mouseleave", w));
  }
  const _ = { A: "소고기국밥", B: "시래기국" },
    B = {};
  function S(t) {
    const e = i("#det" + t);
    ((e.innerHTML = `<div class="dcard"><div class="picker"><label>${"A" === t ? "첫 번째 메뉴" : "두 번째 메뉴"}</label></div><div class="dsum"></div></div><div class="dcard dings"></div>`),
      (B[t] = b(i(".picker", e), _[t], (e) => {
        ((_[t] = e), D(t));
      })),
      A(e),
      D(t));
  }
  function D(e) {
    const s = i("#det" + e),
      n = d(_[e]),
      [o, a] =
        ((r = n.res),
        r.excluded
          ? ["warn", "식물성 대체육 메뉴는 아직 계산하지 않아요"]
          : n.det.fallback || r.tier >= 4
            ? ["warn", "모르는 메뉴예요"]
            : 1 === r.tier
              ? [
                  "ok",
                  r.how.startsWith("family")
                    ? "비슷한 레시피로 계산했어요"
                    : r.how.startsWith("contained")
                      ? "이름에 든 메뉴의 레시피로 계산했어요"
                      : "레시피 그대로 계산했어요",
                ]
              : 2 === r.tier
                ? ["", ""]
                : ["warn", "재료만 보고 어림했어요"]);
    var r;
    ((i(".dsum", s).innerHTML =
      `<div class="mhead"><div><div class="mtotal"><span class="cnt">0.00</span><small>kg CO₂e</small></div><p class="caption">${n.res.excluded ? "식물성 대체육 메뉴 · 계산 제외" : `1인분 · 성인 구내식당 기준 · 재료 ${n.det.mass_g.toFixed(0)}g`}</p></div>${a ? `<span class="badge2 ${o}">${a}</span>` : ""}</div>` +
      (n.res.excluded
        ? `<div class="warnbox">식물성 대체육(콩단백·소이로운·식물성 미트볼 등)은 검증된 배출계수가 없어 계산에서 제외했어요. 계수를 확보하면 다시 계산할 수 있어요.</div>`
        : n.det.fallback
          ? `<div class="warnbox">메뉴 이름을 해석하지 못해 기존 식단 데이터의 중간값(${l(t.corpus.weighted_median)}kg CO₂e)으로 대신했어요.</div>`
          : "") +
      (n.res.excluded
        ? ""
        : '<h3 style="margin-top:24px">단계별 배출량</h3><p class="sub">생산은 농장·사료·토지 이용 변화, 유통은 운송·소매·포장·손실을 포함해요.</p>' +
          (function (t) {
            const e = t.total || 1;
            return `<div class="stack" role="img" aria-label="단계별 배출량">${h.map(([s, i, n]) => `<i style="width:${(Math.max(0, t[s]) / e) * 100}%;background:${n}" data-tip="${i} ${l(t[s])}kg CO₂e (${((t[s] / e) * 100).toFixed(1)}%)"></i>`).join("")}</div><div class="legend2">${h.map(([s, i, n]) => `<div><span><i style="background:${n}"></i>${i}</span><b>${t[s] < 0.005 ? t[s].toFixed(3) : l(t[s])}<em>${((t[s] / e) * 100).toFixed(0)}%</em></b></div>`).join("")}</div>`;
          })(n.det))),
      n.res.excluded
        ? (i(".mtotal .cnt", s).textContent = "—")
        : (function (t, e) {
            const s = performance.now(),
              i = (n) => {
                const o = Math.min(1, (n - s) / 1100),
                  a = 1 - Math.pow(1 - o, 3);
                ((t.textContent = l(e * a)), o < 1 && t.isConnected && requestAnimationFrame(i));
              };
            ((t.textContent = "0.00"), requestAnimationFrame(i));
          })(i(".mtotal .cnt", s), n.total),
      (i(".dings", s).innerHTML =
        `<h3>재료별 배출량</h3><p class="sub">배출계수는 재료 1kg당 kg CO₂e예요.</p><div style="margin-top:8px">${n.det.per.length ? E(n) : '<p class="sub">재료 정보가 없어요.</p>'}</div>`));
  }
  const T = [
      ["소고기국밥", "시래기국"],
      ["소고기국밥", "돼지국밥"],
      ["소불고기", "닭불고기"],
      ["갈비탕", "삼계탕"],
      ["우삼겹숙주볶음", "오징어볶음"],
      ["소고기카레라이스", "야채카레라이스"],
      ["차돌된장찌개", "두부된장찌개"],
      ["소고기무국", "어묵국"],
    ],
    j = { A: "소고기국밥", B: "시래기국" };
  let H, q;
  function z() {
    const t = d(j.A),
      e = d(j.B);
    if (t.res.excluded || e.res.excluded)
      return (
        (i("#cmpResult").innerHTML =
          '<div class="warnbox">식물성 대체육 메뉴는 아직 계산하지 않아 비교할 수 없어요. 다른 메뉴를 골라 주세요.</div>'),
        void (i("#cmpIngs").innerHTML = i("#cmpAlts").innerHTML = "")
      );
    const s = +l(t.total) - +l(e.total),
      r = Math.max(t.total, e.total) || 1,
      c = t.total ? ((t.total - e.total) / t.total) * 100 : 0,
      h =
        s > 0.005
          ? `<p class="sub">${o(e.name)}${a(e.name)} 바꾸면 한 끼에</p><div class="bigsave"><span style="color:var(--green)">${l(s)}kg CO₂e</span> 줄어들어요</div><p class="caption">${c.toFixed(0)}% 감소</p>`
          : s < -0.005
            ? `<p class="sub">${o(e.name)}${a(e.name)} 바꾸면 한 끼에</p><div class="bigsave"><span style="color:var(--red)">${l(-s)}kg CO₂e</span> 늘어나요</div><p class="caption">바꿀 메뉴가 CO₂e가 더 많아요.</p>`
            : '<div class="bigsave">두 메뉴의 CO₂e가 거의 같아요</div>';
    ((i("#cmpResult").innerHTML =
      h +
      `<div class="cbar a"><div class="l"><span>${o(t.name)}</span><b>${l(t.total)}kg CO₂e</b></div><div class="t"><b style="width:${(t.total / r) * 100}%"></b></div></div>` +
      `<div class="cbar b ${s < -0.005 ? "worse" : ""}"><div class="l"><span>${o(e.name)}</span><b>${l(e.total)}kg CO₂e</b></div><div class="t"><b style="width:${(e.total / r) * 100}%"></b></div></div><div style="display:flex;gap:8px;margin-top:22px;flex-wrap:wrap"><button class="btn-m sec" id="cmpDetail">자세히 뜯어볼래요</button><button class="btn-m sec" data-tabgo="sim">우리 식당 전체로 해 볼래요</button></div>`),
      (i("#cmpDetail").onclick = () => {
        ((_.A = t.name), (_.B = e.name), Et("detail"));
      }),
      (i("#cmpIngs").innerHTML =
        `<h3>무엇이 차이를 만들까요?</h3><div class="g2" style="margin-top:10px;gap:24px"><div><p class="caption" style="font-weight:700;color:var(--sub)">${o(t.name)}</p>${E(t, 4) || '<p class="sub">재료 정보가 없어요.</p>'}</div><div><p class="caption" style="font-weight:700;color:var(--sub)">${o(e.name)}</p>${E(e, 4) || '<p class="sub">재료 정보가 없어요.</p>'}</div></div>`));
    const p = y(t, 5);
    ((i("#cmpAlts").innerHTML =
      `<h3>${o(t.name)} 대신 고를 만한 메뉴</h3><p class="sub">역할(${o(g(t.res))})과 조리법이 비슷하고 기존 식단 데이터에 자주 나오는 메뉴예요. 고기·생선 메뉴는 단백질 메뉴로만 바꿔요.</p>` +
      (p.length
        ? `<div style="margin-top:8px">${p.map((t) => `<div class="altrow"><div><div class="nm">${o(t.name)}</div><div class="ds">1인분 ${l(t.total)}kg CO₂e</div></div><div class="sv">−${l(t.saving)}kg CO₂e</div><button class="btn-s" data-alt="${o(t.name)}">비교하기</button></div>`).join("")}</div>`
        : '<p class="warnbox">이 메뉴는 CO₂e가 이미 적거나, 같은 역할의 대체 메뉴를 찾지 못했어요.</p>')),
      n("[data-alt]", i("#cmpAlts")).forEach(
        (t) =>
          (t.onclick = () => {
            ((j.B = t.dataset.alt), q.set(j.B), z());
          }),
      ));
  }
  function W(t) {
    if (t <= 0) return 1;
    const e = Math.pow(10, Math.floor(Math.log10(t)));
    for (const s of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (s * e >= t) return s * e;
    return 10 * e;
  }
  const R = [
      ["11/2(월)", "쌀밥, 소고기무국, 제육볶음, 콩나물무침, 배추김치"],
      ["11/3(화)", "혼합잡곡밥, 근대된장국, 소불고기, 시금치나물, 깍두기"],
      ["11/4(수)", "흑미밥, 순두부찌개, 순살고등어구이, 감자채볶음, 배추김치"],
      ["11/5(목)", "소고기국밥, 김계란말이, 무말랭이무침, 깍두기"],
      ["11/6(금)", "기장밥, 콩비지찌개, 돼지갈비찜, 숙주나물, 배추김치"],
      ["11/9(월)", "현미밥, 소고기미역국, 가자미구이, 애호박나물, 배추김치"],
      ["11/10(화)", "잡곡밥, 아욱된장국, 소고기숙주볶음, 도라지무침, 깍두기"],
      ["11/11(수)", "쌀밥, 부대찌개, 두부양념조림, 오이무침, 배추김치"],
      ["11/12(목)", "차조밥, 닭개장, 훈제오리구이, 청경채나물, 열무김치"],
      ["11/13(금)", "귀리밥, 시래기된장국, 국물소불고기, 느타리버섯볶음, 배추김치"],
      ["11/16(월)", "보리밥, 오징어무국, 안동찜닭, 가지나물, 깍두기"],
      ["11/17(화)", "쌀밥, 참치김치찌개, 달달볶은어니언떡갈비, 연근조림, 배추김치"],
      ["11/18(수)", "흑미밥, 우거지된장국, 소고기청경채볶음, 참나물무침, 총각김치"],
      ["11/19(목)", "수수밥, 계란파국, 순살삼치구이, 한식잡채, 배추김치"],
      ["11/20(금)", "잡곡밥, 황태무국, 매실청돈육간장불고기, 미역줄기볶음, 깍두기"],
      ["11/23(월)", "혼합잡곡밥, 설렁탕&소면, 메추리알조림, 부추겉절이, 깍두기"],
      ["11/24(화)", "현미밥, 얼갈이된장국, 오리불고기, 고사리나물, 배추김치"],
      ["11/25(수)", "쌀밥, 콩나물국, 파채소불고기, 무생채, 배추김치"],
      ["11/26(목)", "기장밥, 꽃게탕, 매콤오징어볶음, 알감자조림, 배추김치"],
      ["11/27(금)", "쌀밥, 들깨미역국, 소고기당면볶음, 취나물무침, 깍두기"],
    ].map(([t, e]) => ({ label: t, menus: e.split(/\s*,\s*/) })),
    K = ["잡곡밥", "시래기된장국", "두부양념조림", "시금치나물", "배추김치"],
    Y = 260,
    O = { beef: ["소고기"], pork: ["돼지고기", "육가공품"], poultry: ["닭고기", "오리고기"] },
    G = [
      ["beef", "소고기", "#e34948"],
      ["meat", "돼지·닭 등 다른 고기", "#4a3aa7"],
      ["sea", "생선·달걀·유제품", "#1baf7a"],
      ["grain", "밥·곡류·면", "#eda100"],
      ["veg", "채소·과일·콩", "#008300"],
      ["proc", "가공식품·양념", "#2a78d6"],
      ["kitchen", "조리 에너지·음식물 쓰레기", "#e87ba4"],
    ];
  function P(t) {
    if ("소고기" === t) return "beef";
    const e = Engine.cat(t);
    return "육류" === e || "육가공품" === t
      ? "meat"
      : "어패류" === e || "유제품" === e || "난류" === e
        ? "sea"
        : "곡류" === e || "면류" === e
          ? "grain"
          : ["채소", "과일", "버섯", "해조류", "두류", "견과"].includes(e)
            ? "veg"
            : "proc";
  }
  const N = () => {
      const t = {};
      return (G.forEach((e) => (t[e[0]] = 0)), t);
    },
    I = new Map();
  function Q(t) {
    if (I.has(t)) return I.get(t);
    const e = d(t),
      s = e.det,
      i = N();
    let n = 0;
    for (const t of s.per) ((i[P(t.std)] += t.total), (n += t.total));
    s.per.length || ((n = Math.max(0, s.total - s.consumption - s.waste)), (i.proc += n));
    const o = s.consumption,
      a = Engine.emissions(e.res, { fuel: "elec" }).consumption,
      l = s.waste,
      r = e.res.parse.stds,
      c = Object.keys(O).find((t) => O[t].some((t) => r.includes(t))) || null,
      h = (c && y(e, 5).find((t) => !d(t.name).res.parse.stds.includes("소고기"))) || null,
      p = {
        name: t,
        it: e,
        ingr: n,
        cats: i,
        cookGas: o,
        cookElec: a,
        waste: l,
        total: s.total,
        meat: c,
        alt: h ? h.name : null,
      };
    return (I.set(t, p), p);
  }
  const X = [
      ["size", "식당 규모", "#2a78d6"],
      ["menu", "고기 메뉴 줄이기", "#e34948"],
      ["ops", "식단 운영", "#4C8820"],
      ["kit", "조리·폐기", "#B47A00"],
    ],
    U = (t) => `<small>${t}</small>`,
    Z = (t) => (100 === t ? "지금처럼" : `−${100 - t}${U("%")}`),
    J = (t) =>
      `${t} 메뉴를 줄이는 만큼, 그 자리를 비슷한 역할의 대체 메뉴가 채운다고 봐요. 어떤 메뉴로 바뀌는지는 '어떻게 계산하나요?' 탭에 있어요.`,
    V = [
      {
        g: "size",
        id: "diners",
        label: "하루 이용자 수",
        min: 100,
        max: 3e3,
        step: 50,
        def: 500,
        val: (t) => t.toLocaleString("ko-KR") + U("명"),
        ends: ["100명", "3,000명"],
        tip: "점심 먹는 사람 수예요. 지금 식단과 바꾼 식단에 똑같이 적용돼요.",
      },
      {
        g: "size",
        id: "ramp",
        label: "바뀌는 데 걸리는 기간",
        min: 0,
        max: 12,
        step: 1,
        def: 0,
        val: (t) => (0 === t ? "바로" : t + U("개월")),
        ends: ["바로", "1년"],
        tip: "이 기간에 걸쳐 서서히 바뀐다고 봐요. 길수록 첫해에 줄어드는 양은 작아져요.",
      },
      {
        g: "menu",
        id: "beef",
        label: "소고기 메뉴",
        min: 0,
        max: 100,
        step: 5,
        def: 100,
        val: Z,
        ends: ["모두 다른 메뉴로", "지금처럼"],
        tip: J("소고기") + " 기준 식단 20끼 중 10끼에 소고기 메뉴가 있어요.",
      },
      {
        g: "menu",
        id: "pork",
        label: "돼지고기 메뉴",
        min: 0,
        max: 100,
        step: 5,
        def: 100,
        val: Z,
        ends: ["모두 다른 메뉴로", "지금처럼"],
        tip: J("돼지고기·햄·소시지"),
      },
      {
        g: "menu",
        id: "poultry",
        label: "닭·오리 메뉴",
        min: 0,
        max: 100,
        step: 5,
        def: 100,
        val: Z,
        ends: ["모두 다른 메뉴로", "지금처럼"],
        tip: J("닭·오리"),
      },
      {
        g: "ops",
        id: "veg",
        label: "고기 없는 날",
        min: 0,
        max: 5,
        step: 1,
        def: 0,
        val: (t) => (0 === t ? "없음" : `주 ${t}${U("회")}`),
        ends: ["없음", "매일"],
        tip: "그날 점심은 잡곡밥·시래기된장국·두부양념조림·시금치나물·배추김치로 바꿔요.",
      },
      {
        g: "ops",
        id: "portion",
        label: "1인분 배식량",
        min: 80,
        max: 120,
        step: 5,
        def: 100,
        val: (t) => t + U("%"),
        ends: ["적게", "많이"],
        mid: "지금",
        tip: "양을 줄이거나 늘리면 재료·조리·폐기 배출도 같은 비율로 달라져요. 남기지 않을 만큼만 담는 적정 배식이 여기에 해당해요.",
      },
      {
        g: "kit",
        id: "waste",
        label: "음식물 쓰레기 줄이기",
        min: 0,
        max: 50,
        step: 5,
        def: 0,
        val: (t) => (0 === t ? "그대로" : `−${t}${U("%")}`),
        ends: ["그대로", "절반으로"],
        tip: "조리량의 15%가 버려진다는 기준에서 얼마나 줄이는지예요. 쓰레기 처리 배출만 줄고, 재료를 기르고 만드는 배출은 그대로예요.",
      },
      {
        g: "kit",
        id: "fuel",
        type: "seg",
        label: "조리 에너지",
        def: "gas",
        opts: [
          ["gas", "도시가스", "지금"],
          ["elec", "전기", "계통 전력"],
          ["re", "재생에너지", "배출 0"],
        ],
        tip: "전기는 지금의 전력 배출계수(0.4173kg/kWh) 기준이라 도시가스보다 배출이 커요. 재생에너지 전기는 배출이 없다고 봐요.",
      },
    ],
    tt = {},
    et = {};
  V.forEach((t) => (et[t.id] = t.def));
  const st = Object.assign({}, et, { beef: 50, veg: 1 });
  function it(t) {
    return i(`#simBoard .lever[data-id="${t}"]`);
  }
  const nt = (t) => ({
      swap: { beef: (100 - t.beef) / 100, pork: (100 - t.pork) / 100, poultry: (100 - t.poultry) / 100 },
      veg: t.veg,
      k: t.portion / 100,
      wasteCut: t.waste / 100,
      fuel: t.fuel,
    }),
    ot = () => ({ total: 0, cats: N() });
  function at(t, e, s) {
    t.total += e.total * s;
    for (const i in e.cats) t.cats[i] += e.cats[i] * s;
    return t;
  }
  function lt(t, e) {
    const s = "gas" === e.fuel ? t.cookGas : "elec" === e.fuel ? t.cookElec : 0,
      i = t.waste * (1 - e.wasteCut),
      n = {};
    for (const s in t.cats) n[s] = t.cats[s] * e.k;
    return ((n.kitchen += (s + i) * e.k), { total: (t.ingr + s + i) * e.k, cats: n });
  }
  function rt(t, e) {
    const s = ot();
    for (const i of t) {
      const t = Q(i),
        n = (t.meat && t.alt && e.swap[t.meat]) || 0;
      (at(s, lt(t, e), 1 - n), n > 0 && at(s, lt(Q(t.alt), e), n));
    }
    return s;
  }
  function ct(t) {
    const e = ot();
    for (const s of R) at(e, rt(s.menus, t), 1 / R.length);
    if (t.veg > 0) {
      const s = t.veg / 5,
        i = ot();
      return (at(i, e, 1 - s), at(i, rt(K, Object.assign({}, t, { swap: {} })), s), i);
    }
    return e;
  }
  const dt = (t) =>
      t >= 1e3
        ? (t) => (t / 1e3).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + "톤 CO₂e"
        : (t) => Math.round(t).toLocaleString("ko-KR") + "kg CO₂e",
    ht = (t, e) =>
      (t >= 1e4
        ? (t / 1e4).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + "만"
        : Math.round(t).toLocaleString("ko-KR")) + U(e),
    pt = (t) => (t < -0.5 ? "−" : t > 0.5 ? "+" : "");
  const ut = { cum: !1, cats: !1 };
  function ft() {
    const t = { cum: ["#simCum", "#simCumT", null], cats: ["#simCats", "#simCatsT", "#simCatLg"] };
    for (const e in t) {
      const s = ut[e];
      ((i(t[e][0]).style.display = s ? "none" : ""),
        (i(t[e][1]).style.display = s ? "" : "none"),
        t[e][2] && (i(t[e][2]).style.display = s ? "none" : ""),
        (i(`#pane-sim .tbtn[data-tv="${e}"]`).textContent = s ? "그래프로 보기" : "표로 보기"));
    }
  }
  function gt() {
    V.forEach((t) => {
      const e = it(t.id),
        s = tt[t.id];
      if ("seg" === t.type)
        return void n("button", e).forEach((t) => {
          const e = t.dataset.v === s;
          (t.classList.toggle("on", e), t.setAttribute("aria-pressed", e ? "true" : "false"));
        });
      const o = i("input", e);
      (+o.value !== s && (o.value = s),
        o.style.setProperty("--p", ((s - t.min) / (t.max - t.min)) * 100 + "%"));
      const a = i(".lv", e);
      ((a.innerHTML = t.val(s)), a.classList.toggle("on", s !== t.def));
    });
    const t = (function () {
      const t = ct(nt(et)),
        e = ct(nt(tt)),
        s = tt.diners,
        i = tt.ramp,
        n = [];
      for (let t = 1; t <= 12; t++) n.push(0 === i ? 1 : Math.min(1, (t - 0.5) / i));
      const o = n.reduce((t, e) => t + e, 0) / 12,
        a = (t) => t * s * Y,
        l = a(t.total),
        r = a(e.total),
        c = l + o * (r - l),
        d = [],
        h = [];
      let p = 0,
        u = 0;
      for (let t = 0; t < 12; t++) ((p += l / 12), (u += (l + n[t] * (r - l)) / 12), d.push(p), h.push(u));
      const f = {},
        g = {};
      return (
        G.forEach(([s]) => {
          ((f[s] = a(t.cats[s])), (g[s] = f[s] + o * (a(e.cats[s]) - f[s])));
        }),
        { base: t, tgt: e, Y0: l, Yt: r, Y1: c, F: o, cum0: d, cum1: h, cats0: f, cats1: g, diners: s }
      );
    })();
    ((i("#simScen").innerHTML = (function () {
      const t = {};
      X.forEach(([e, , s]) => (t[e] = s));
      const e = (e, s) => `<span class="chip2" style="--gc:${t[e]}"><i></i>${s}</span>`,
        s = [];
      return (
        500 !== tt.diners && s.push(e("size", `하루 ${tt.diners.toLocaleString("ko-KR")}명`)),
        100 !== tt.beef && s.push(e("menu", `소고기 메뉴 −${100 - tt.beef}%`)),
        100 !== tt.pork && s.push(e("menu", `돼지고기 메뉴 −${100 - tt.pork}%`)),
        100 !== tt.poultry && s.push(e("menu", `닭·오리 메뉴 −${100 - tt.poultry}%`)),
        tt.veg && s.push(e("ops", `고기 없는 날 주 ${tt.veg}회`)),
        100 !== tt.portion && s.push(e("ops", `배식량 ${tt.portion}%`)),
        tt.waste && s.push(e("kit", `음식물 쓰레기 −${tt.waste}%`)),
        "gas" !== tt.fuel && s.push(e("kit", "조리 에너지 " + ("elec" === tt.fuel ? "전기" : "재생에너지"))),
        tt.ramp && s.push(e("size", `${tt.ramp}개월에 걸쳐`)),
        s.length
          ? `<span class="lead2">지금 설정</span>${s.join("")}`
          : '<span class="lead2">지금 설정</span><span>아직 지금 식단 그대로예요. 아래 막대를 움직여 보세요.</span>'
      );
    })()),
      (function (t) {
        const e = t.Y0 - t.Y1,
          s = t.Y0 ? (e / t.Y0) * 100 : 0,
          n = Math.abs(e) < 0.5,
          o = d("소고기국밥").total;
        ((i("#simKpi").innerHTML =
          `<div class="main"><p class="eyebrow">${n || e > 0 ? "1년 동안 줄어드는 CO₂e" : "1년 동안 늘어나는 CO₂e"}</p><div class="bigrow"><div class="big ${n ? "zero" : e > 0 ? "down" : "up"}">${
            n
              ? "0" + U("톤 CO₂e")
              : ((t) => {
                  const e = r(t),
                    s = e.endsWith("톤 CO₂e") ? "톤 CO₂e" : "kg CO₂e";
                  return `${e.slice(0, -s.length)}<small>${s}</small>`;
                })(Math.abs(e))
          }</div>` +
          (n
            ? '<span class="delta zero">아래 막대를 움직여 보세요</span>'
            : `<span class="delta ${e > 0 ? "" : "up"}">${e > 0 ? "−" : "+"}${Math.abs(s).toFixed(0)}%</span>`) +
          "</div>" +
          `<p class="base">지금 식단 <b>${r(t.Y0)}</b> → 바꾼 식단 <b>${r(t.Y1)}</b> · 하루 ${t.diners.toLocaleString("ko-KR")}명 · 점심 ${Y}일</p></div>` +
          `<ul class="eq"><li><span>승용차로 달리면</span><b>${ht((1e3 * Math.abs(e)) / 141.3, "km")}</b></li>` +
          `<li><span>소고기국밥으로 치면</span><b>${ht(Math.abs(e) / o, "그릇")}</b></li>` +
          `<li><span>1인 한 끼 평균${tt.ramp ? " (자리 잡은 뒤)" : ""}</span><b>${l(t.base.total)} → ${l(t.tgt.total)}${U("kg CO₂e")}</b></li></ul><button class="reset" id="simReset" type="button">모두 지금처럼 되돌리기</button>`),
          (i("#simReset").onclick = () => {
            (Object.assign(tt, et), gt());
          }));
      })(t),
      (function (t, e) {
        const s = t.clientWidth > 0 && t.clientWidth < 480,
          n = s ? 380 : 600,
          o = s ? 250 : 340,
          a = s ? 96 : 112,
          l = s ? 14 : 22,
          c = s ? 22 : 26,
          d = s ? 34 : 40,
          h = W(Math.max(e.cum0[11], e.cum1[11], 1)),
          p = dt(h),
          u = (t) => a + (t / 12) * (n - a - l),
          f = (t) => c + ((h - t) / h) * (o - c - d);
        let g = "";
        for (let t = 0; t <= 4; t++) {
          const e = (h * t) / 4;
          g += `<line x1="${a}" x2="${n - l}" y1="${f(e)}" y2="${f(e)}" stroke="#EEF0F2"/><text x="${a - 10}" y="${f(e) + 5}" text-anchor="end" font-size="13" fill="#8B95A1">${p(e)}</text>`;
        }
        for (let t = 0; t <= 12; t += 3)
          g += `<text x="${u(t)}" y="${o - 12}" text-anchor="middle" font-size="13" fill="#8B95A1">${0 === t ? "지금" : t + "개월 뒤"}</text>`;
        const m = (t) => [[0, 0]].concat(t.map((t, e) => [e + 1, t])),
          y = (t) =>
            m(t)
              .map((t, e) => (e ? "L" : "M") + u(t[0]).toFixed(1) + " " + f(t[1]).toFixed(1))
              .join(" "),
          x =
            y(e.cum1) +
            " " +
            m(e.cum0)
              .reverse()
              .map((t) => "L" + u(t[0]).toFixed(1) + " " + f(t[1]).toFixed(1))
              .join(" ") +
            " Z",
          $ = e.cum0[11],
          b = e.cum1[11],
          k = $ - b,
          E = $ >= b ? ["지금 식단 " + p($), f($), "#4E5968"] : ["바꾼 식단 " + p(b), f(b), "#2F5A12"],
          F = $ >= b ? ["바꾼 식단 " + p(b), f(b), "#2F5A12"] : ["지금 식단 " + p($), f($), "#4E5968"],
          M = Math.max(c + 10, E[1] - 12),
          L = Math.max(M + 20, F[1] + 20),
          A =
            Math.abs(k) >= 0.5 && Math.abs(f($) - f(b)) > 44
              ? `<text x="${u(12) - 12}" y="${(f($) + f(b)) / 2 + 7}" text-anchor="end" font-size="20" font-weight="900" fill="${k > 0 ? "#2F5A12" : "#C93A39"}">${k > 0 ? "−" : "+"}${p(Math.abs(k))}</text>`
              : "";
        t.innerHTML = `<svg viewBox="0 0 ${n} ${o}" role="img" aria-label="1년 누적 배출량: 지금 식단과 바꾼 식단">${g}\n      <path d="${x}" fill="${b <= $ ? "#4C8820" : "#E4553B"}" opacity=".16"/>\n      <path d="${y(e.cum0)}" fill="none" stroke="#8B95A1" stroke-width="2.5" stroke-dasharray="6 5"/>\n      <path d="${y(e.cum1)}" fill="none" stroke="#4C8820" stroke-width="3"/>\n      <circle cx="${u(12)}" cy="${f($)}" r="5" fill="#8B95A1" stroke="#fff" stroke-width="2"/>\n      <circle cx="${u(12)}" cy="${f(b)}" r="6" fill="#4C8820" stroke="#fff" stroke-width="2"/>\n      <text x="${u(12) - 12}" y="${M}" text-anchor="end" font-size="14" font-weight="700" fill="${E[2]}">${E[0]}</text>\n      <text x="${u(12) - 12}" y="${L}" text-anchor="end" font-size="14" font-weight="700" fill="${F[2]}">${F[0]}</text>${A}\n      <g class="hover" style="display:none"><line y1="${c}" y2="${o - d}" stroke="#B0B8C1"/><circle class="c0" r="5" fill="#fff" stroke="#8B95A1" stroke-width="2"/><circle class="c1" r="5" fill="#fff" stroke="#4C8820" stroke-width="2"/></g>\n      <rect x="${a}" y="${c}" width="${n - a - l}" height="${o - c - d}" fill="transparent" class="hit"/></svg>`;
        const _ = i("svg", t),
          B = i(".hover", _),
          S = i(".hit", _);
        C ||
          (S.addEventListener("mousemove", (t) => {
            t.stopPropagation();
            const s = _.getBoundingClientRect(),
              o = ((t.clientX - s.left) / s.width) * n,
              c = Math.max(0, Math.min(12, Math.round(((o - a) / (n - a - l)) * 12))),
              d = c ? e.cum0[c - 1] : 0,
              h = c ? e.cum1[c - 1] : 0;
            ((B.style.display = ""),
              i("line", B).setAttribute("x1", u(c)),
              i("line", B).setAttribute("x2", u(c)),
              i(".c0", B).setAttribute("cx", u(c)),
              i(".c0", B).setAttribute("cy", f(d)),
              i(".c1", B).setAttribute("cx", u(c)),
              i(".c1", B).setAttribute("cy", f(h)),
              v(
                `<b>${0 === c ? "지금" : c + "개월 뒤"}</b><br>지금 식단 ${r(d)} · 바꾼 식단 ${r(h)}<br><span class="mu">${h <= d ? "−" : "+"}${r(Math.abs(d - h))}</span>`,
                t.clientX,
                t.clientY,
              ));
          }),
          S.addEventListener("mouseleave", () => {
            ((B.style.display = "none"), w());
          }));
      })(i("#simCum"), t),
      (function (t, e) {
        const s = t.clientWidth > 0 && t.clientWidth < 480,
          n = s ? 380 : 600,
          o = s ? 68 : 96,
          a = s ? 10 : 14,
          l = s ? 36 : 46,
          c = s ? 30 : 36,
          d = s ? 26 : 30,
          h = [
            ["지금 식단", e.cats0, e.Y0],
            ["바꾼 식단", e.cats1, e.Y1],
          ],
          p = W(Math.max(e.Y0, e.Y1, 1)),
          u = dt(p),
          f = d + h.length * (l + c) + 2,
          g = (t) => o + (t / p) * (n - o - a);
        let m = "";
        for (let t = 0; t <= 4; t += s ? 2 : 1) {
          const e = (p * t) / 4;
          m += `<line x1="${g(e)}" x2="${g(e)}" y1="${d - 8}" y2="${f - 26}" stroke="#EEF0F2"/><text x="${g(e)}" y="${f - 6}" text-anchor="middle" font-size="13" fill="#8B95A1">${u(e)}</text>`;
        }
        (h.forEach(([t, e, s], i) => {
          const a = d + i * (l + c);
          m += `<text x="${o - 12}" y="${a + l / 2 + 5}" text-anchor="end" font-size="14" font-weight="700" fill="#4E5968">${t}</text>`;
          let h = 0;
          (G.forEach(([t, i, n]) => {
            const o = e[t];
            if (o <= 0) return;
            const c = g(h),
              d = g(h + o);
            ((h += o),
              (m += `<rect x="${c.toFixed(1)}" y="${a}" width="${Math.max(0.5, d - c - 2).toFixed(1)}" height="${l}" rx="4" fill="${n}" data-tip="${i} ${r(o)} (${s ? ((o / s) * 100).toFixed(0) : 0}%)"/>`));
          }),
            (m += `<text x="${Math.min(g(h) + 10, n - 4)}" y="${a - 10}" text-anchor="end" font-size="14" font-weight="700" fill="#191F28">${r(s)}</text>`));
        }),
          (t.innerHTML = `<svg viewBox="0 0 ${n} ${f}" role="img" aria-label="재료군별 1년 배출량">${m}</svg>`),
          (i("#simCatLg").innerHTML = G.map(
            ([t, e, s]) => `<span><i style="background:${s}"></i>${e}</span>`,
          ).join("")));
      })(i("#simCats"), t),
      (function (t) {
        const e = G.map(([e, s, i]) => {
          const n = t.cats0[e],
            o = t.cats1[e];
          return `<tr><td><i style="background:${i}"></i>${s}</td><td>${r(n)}</td><td>${r(o)}</td><td>${pt(o - n)}${r(Math.abs(o - n))}</td></tr>`;
        }).join("");
        i("#simCatsT").innerHTML =
          `<div class="tblwrap"><table class="numtbl"><tr><th>재료군</th><th>지금 식단</th><th>바꾼 식단</th><th>차이</th></tr>${e}<tr><td><b>합계</b></td><td><b>${r(t.Y0)}</b></td><td><b>${r(t.Y1)}</b></td><td><b>${pt(t.Y1 - t.Y0)}${r(Math.abs(t.Y1 - t.Y0))}</b></td></tr></table></div>`;
        const s = t.cum0
          .map(
            (e, s) =>
              `<tr><td>${s + 1}개월 뒤</td><td>${r(e)}</td><td>${r(t.cum1[s])}</td><td>${pt(t.cum1[s] - e)}${r(Math.abs(e - t.cum1[s]))}</td></tr>`,
          )
          .join("");
        i("#simCumT").innerHTML =
          `<div class="tblwrap"><table class="numtbl"><tr><th>시점</th><th>지금 식단</th><th>바꾼 식단</th><th>차이</th></tr>${s}</table></div>`;
      })(t));
  }
  let mt = !1;
  function yt(t) {
    const e = d(t),
      s = Engine.provenance(e.res, e.det),
      i = Engine.monteCarlo([{ meal: "점심", items: [{ res: e.res, det: e.det }] }], {}),
      n = Engine.stats(i.menus[0][0]),
      a = s.ingredients.slice().sort((t, e) => e.emission - t.emission),
      r = a.slice(0, 6),
      c = a.slice(6).reduce((t, e) => t + e.emission, 0),
      h = (t) => (t < 0.01 ? t.toFixed(3) : l(t)) + "kg CO₂e",
      p =
        r
          .map(
            (t) =>
              `<tr><td>${o(t.std)}</td><td>${t.quantity.value.toFixed(0)}g</td><td>${(+t.factor.value).toFixed(2)}</td><td>${h(t.emission)}</td></tr>`,
          )
          .join("") +
        (a.length > 6
          ? `<tr><td>그 밖의 재료 ${a.length - 6}가지</td><td></td><td></td><td>${h(c)}</td></tr>`
          : "") +
        `<tr><td>조리 에너지</td><td colspan="2">${s.consumption.value}MJ/kg · 도시가스</td><td>${h(e.det.consumption)}</td></tr>` +
        `<tr><td>음식물 쓰레기 처리</td><td colspan="2">조리량의 15%</td><td>${h(e.det.waste)}</td></tr>` +
        `<tr class="sum"><td>합계 (1인분)</td><td colspan="2">가능한 범위 ${l(n.p10)}~${l(n.p90)}kg CO₂e</td><td>${l(e.total)}kg CO₂e</td></tr>`,
      u = s.recipe
        ? `기존 식단 데이터의 '${o(s.recipe.key)}' 레시피 ${s.recipe.n_blocks}건`
        : `조리법 '${o(e.res.method || "")}' 템플릿`;
    return `<div><p class="caption" style="font-weight:700;color:var(--sub);margin:0">${o(t)} · ${u} · 재료 ${e.det.mass_g.toFixed(0)}g</p><div class="tblwrap"><table class="extbl"><tr><th>재료</th><th>1인분</th><th>계수 kg/kg</th><th>배출량</th></tr>${p}</table></div></div>`;
  }
  let xt = !1,
    $t = null,
    bt = null;
  function kt() {
    if (xt) return;
    xt = !0;
    const t = window.LUNCH_MENU;
    (t && ((_.A = t.hi), (_.B = t.lo), (j.A = t.hi), (j.B = t.lo)),
      S("A"),
      S("B"),
      (H = b(i("#pkA"), j.A, (t) => {
        ((j.A = t), z());
      })),
      (q = b(i("#pkB"), j.B, (t) => {
        ((j.B = t), z());
      })),
      (i("#pairChips").innerHTML =
        '<span class="caption" style="align-self:center;margin:0 4px 0 0">자주 비교하는 조합</span>' +
        T.map(([t, e], s) => `<button class="chip" data-p="${s}">${o(t)} → ${o(e)}</button>`).join("")),
      n("#pairChips .chip").forEach(
        (t) =>
          (t.onclick = () => {
            (([j.A, j.B] = T[+t.dataset.p]), H.set(j.A), q.set(j.B), z());
          }),
      ),
      (i("#swapBtn").onclick = () => {
        (([j.A, j.B] = [j.B, j.A]), H.set(j.A), q.set(j.B), z());
      }),
      n("#dtabs button").forEach((t) => (t.onclick = () => vt(t.dataset.tab))),
      i("#dash").addEventListener("click", (t) => {
        const e = t.target.closest("[data-tabgo]");
        if (e) return void vt(e.dataset.tabgo);
        const s = t.target.closest("[data-src]");
        s &&
          (function (t) {
            (w(), "method" !== $t && vt("method"));
            const e = i("#src-" + CSS.escape(t));
            e &&
              (e.scrollIntoView({
                block: "center",
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
              }),
              e.classList.remove("hit"),
              e.offsetWidth,
              e.classList.add("hit"));
          })(s.dataset.src);
      }),
      z(),
      Object.assign(tt, st),
      (i("#simBoard").innerHTML = X.map(
        ([t, e, s]) =>
          `<section class="lgroup" style="--gc:${s}"><h4><i></i>${o(e)}</h4>` +
          V.filter((e) => e.g === t)
            .map((t) =>
              "seg" === t.type
                ? `<div class="lever" data-id="${t.id}"><div class="lt"><span class="ln">${o(t.label)}<i class="q" data-tip="${o(t.tip)}">?</i></span></div><div class="segs" role="group" aria-label="${o(t.label)}">${t.opts.map((e) => `<button type="button" data-v="${e[0]}" aria-pressed="${e[0] === t.def ? "true" : "false"}">${o(e[1])}<small>${o(e[2])}</small></button>`).join("")}</div></div>`
                : `<div class="lever" data-id="${t.id}"><div class="lt"><span class="ln">${o(t.label)}<i class="q" data-tip="${o(t.tip)}">?</i></span><b class="lv"></b></div><div class="ltrack"><input type="range" min="${t.min}" max="${t.max}" step="${t.step}" value="${t.def}" aria-label="${o(t.label)}"><i class="base" style="left:calc(12px + (100% - 24px) * ${(t.def - t.min) / (t.max - t.min)})" title="지금처럼"></i></div><div class="le"><span>${o(t.ends[0])}</span>${t.mid ? `<span class="mid">${o(t.mid)}</span>` : ""}<span>${o(t.ends[1])}</span></div></div>`,
            )
            .join("") +
          "</section>",
      ).join("")),
      V.forEach((t) => {
        const e = it(t.id);
        if ("seg" === t.type)
          n("button", e).forEach(
            (e) =>
              (e.onclick = () => {
                ((tt[t.id] = e.dataset.v), gt());
              }),
          );
        else {
          const s = i("input", e);
          s.addEventListener("input", () => {
            ((tt[t.id] = +s.value), gt());
          });
        }
      }),
      A(i("#pane-sim")),
      n("#pane-sim .tbtn").forEach(
        (t) =>
          (t.onclick = () => {
            ((ut[t.dataset.tv] = !ut[t.dataset.tv]), ft());
          }),
      ),
      ft());
  }
  function vt(s) {
    s = window.__tabMap ? window.__tabMap(s) : s;
    (($t = s),
      (i("#dash").dataset.view = s),
      n("#dtabs button").forEach((t) => t.classList.toggle("on", t.dataset.tab === s)),
      n(".dpane").forEach((t) =>
        t.classList.toggle(
          "on",
          t.id === "pane-" + (/^(sim|month|board)$/.test(s) && "sim" !== s ? "sim" : s),
        ),
      ),
      "detail" === s &&
        ["A", "B"].forEach((t) => {
          (B[t].set(_[t]), D(t));
        }),
      /^(sim|month|board)$/.test(s) && gt(),
      "method" === s &&
        (function () {
          if (mt) return;
          mt = !0;
          const s = t.segments[e],
            n = t.parameters,
            a = window.LUNCH_MENU || { hi: "소고기국밥", lo: "시래기국" };
          ((i("#methodBody").innerHTML =
            `<div class="dcard"><h3>한눈에 보기</h3><div class="flow"><div class="st"><i>1</i><b>메뉴 이름</b><span>이름을 재료와 조리법으로 읽어요. 소고기국밥 → 소고기 · 국밥</span></div><div class="st"><i>2</i><b>레시피·분량</b><span>기존 식단 데이터의 레시피에서 재료별 1인분 분량을 가져와요</span></div><div class="st"><i>3</i><b>배출계수</b><span>재료 1kg당 생산·가공·유통·폐기 배출계수를 곱해요</span></div><div class="st"><i>4</i><b>조리·쓰레기</b><span>조리 에너지와 음식물 쓰레기 처리를 더해요</span></div><div class="st"><i>5</i><b>식당 전체로</b><span>1인분 값을 사람 수와 날짜로 넓혀 1년 효과를 구해요</span></div></div></div><div class="dcard"><h3>메뉴 한 그릇은 이렇게 계산해요</h3><p class="sub">번호 위에 마우스를 올리면 출처가 보여요.</p><ul class="basis2"><li><b>이름 읽기</b> · 메뉴 이름을 재료·조리법·수식어 단위로 나눠요. 재료 이름 ${Object.keys(t.alias).length.toLocaleString("ko-KR")}개를 알아봐요.</li><li><b>레시피</b> · 기존 식단 데이터(레시피가 있는 메뉴 ${Object.keys(t.recipes).length.toLocaleString("ko-KR")}개)에서 같은 이름을 찾아 재료별 1인분 분량의 중앙값을 써요. 없으면 비슷한 이름의 레시피 묶음, 그다음은 조리법 템플릿, 마지막은 재료별 평균으로 추정해요.${L("S012")}</li><li><b>1인분 분량</b> · 성인 구내식당(산업체·오피스)은 기준 분량의 ${s.scale}배예요. ${o(s.basis)}.</li><li><b>배출계수</b> · 재료 1kg당 kg CO₂e를 생산(농장·사료·토지 이용 변화)·가공·유통(운송·소매·포장·손실)·폐기 단계로 나눠 더해요. 국내 육류는 기후솔루션(2026), 그 밖은 Poore & Nemecek(2018)과 한국 식품 DB를 써요.${L("S001", "S002", "S003")}</li><li><b>조리 에너지</b> · 재료 1kg당 조리법별 에너지(끓임 ${n.cook_mj_per_kg.value["끓임"]}MJ, 볶음 ${n.cook_mj_per_kg.value["볶음"]}MJ, 구이 ${n.cook_mj_per_kg.value["구이"]}MJ)에 도시가스 배출계수를 곱해요.${L("S006", "S008")}</li><li><b>음식물 쓰레기</b> · 조리량의 ${(100 * n.waste_rate.value).toFixed(0)}%가 버려진다고 보고 퇴비화 처리 계수 ${n.waste_treatment_kgco2e_per_kg.value}kg/kg을 곱해요.${L("S011", "S007")}</li><li><b>불확실성</b> · 재료 분량과 배출계수를 ${n.mc_iterations.value.toLocaleString("ko-KR")}번 무작위로 흔들어 10~90% 범위를 함께 구해요.</li></ul></div><div class="dcard"><h3>예시: ${o(a.hi)} · ${o(a.lo)}</h3><p class="sub">체험에서 고른 두 메뉴를 위 방법대로 계산한 결과예요. 배출량이 큰 재료 여섯 가지만 적었어요.</p><div class="g2" style="margin-top:14px;gap:28px">${yt(a.hi)}${yt(a.lo)}</div></div><div class="dcard"><h3>결과 화면의 환산 카드는 이렇게 계산해요</h3><p class="sub">아낀(또는 더 나온) CO₂e kg을 아래 계수로 나눠요. 번호 위에 마우스를 올리면 출처가 보여요.</p><ul class="basis2"><li><b>승용차 km</b> · kg CO₂e ÷ 0.1413 kg/km. 2020년 판매 승용·승합차의 실제 평균 141.3 g/km이고, 연료를 만드는 과정은 뺀 값이에요.${L("S013")}</li><li><b>스마트폰 충전 횟수</b> · kg CO₂e ÷ (0.019 kWh × ${n.elec_kgco2e_per_kwh.value} kg/kWh). 1회 충전 전력은 미국 EPA 값, 전력 배출계수는 2023년 국가 값이에요.${L("S014", "S009")}</li><li><b>소나무가 마시는 날수</b> · kg CO₂e ÷ (6.6 kg ÷ 365일). 30년생 소나무 한 그루가 1년에 흡수하는 이산화탄소 6.6 kg 기준이에요.${L("S015")}</li><li><b>전기 kWh</b> · kg CO₂e ÷ ${n.elec_kgco2e_per_kwh.value} kg/kWh.${L("S009")}</li></ul></div><div class="dcard"><h3>시뮬레이터는 이렇게 계산해요</h3>${(function () {
              const t = K.reduce((t, e) => t + Q(e).total, 0),
                e = R.filter((t) => t.menus.some((t) => "beef" === Q(t).meat)).length;
              return `<ul class="basis2"><li><b>기준 식단</b> · 예시 4주(20끼) 점심을 1년(52주 × 5일 = ${Y}끼) 반복한다고 봐요. 한 끼 배출량은 위 방법 그대로, 성인 구내식당 1인분 기준이에요. 20끼 중 ${e}끼에 소고기 메뉴가 있어요.${L("S012")}</li><li><b>고기 메뉴 줄이기</b> · 줄인 비율만큼 그 메뉴 대신 대체 메뉴를 먹는다고 봐요. 대체 메뉴는 '메뉴 바꾸기 비교'가 제안하는 같은 역할의 메뉴 중 소고기가 없는 첫 번째 메뉴이고, 없으면 바꾸지 않아요.</li><li><b>고기 없는 날</b> · 정한 날수만큼 점심 전체를 잡곡밥·시래기된장국·두부양념조림·시금치나물·배추김치(1인 ${l(t)}kg CO₂e)로 바꿔요.</li><li><b>배식량</b> · 재료·조리·폐기 배출이 배식량에 비례한다고 봐요.</li><li><b>음식물 쓰레기</b> · 조리량의 15%가 버려진다는 기준값을 줄이는 비율이에요. 처리(퇴비화) 배출만 달라져요.${L("S011", "S007")}</li><li><b>조리 에너지</b> · 재료 1kg당 조리법별 에너지에 연료 배출계수를 곱해요. 전기는 2023년 국가 전력배출계수 0.4173kg/kWh, 재생에너지 전기는 0으로 봐요.${L("S006", "S008", "S009")}</li><li><b>바뀌는 데 걸리는 기간</b> · 그 기간에 걸쳐 효과가 직선으로 커진다고 보고 12개월치를 더해요. 그래프와 표도 같은 첫해 값이에요.</li><li><b>환산</b> · 승용차는 141.3g/km${L("S013")}, 소고기국밥은 1인분 ${l(d("소고기국밥").total)}kg CO₂e 기준이에요.</li><li><b>한계</b> · 예시 식단이라 실제 식당의 식단표·이용자 수와는 달라요.</li></ul>`;
            })()}</div><div class="dcard"><h3>기준 식단과 대체 메뉴</h3><p class="sub"><span class="m beef">빨간 글씨</span>는 소고기 메뉴, <span class="m pork">보라 글씨</span>는 돼지고기·닭·오리 메뉴예요. 화살표 뒤가 대체 메뉴와 그 1인분 배출량이고, 오른쪽은 그날 한 끼(1인) 배출량이에요.</p><div class="tblwrap"><table class="plantbl">${R.map(
              (t) => {
                const e = t.menus
                  .map((t) => {
                    const e = Q(t);
                    return e.meat
                      ? `<span class="m ${e.meat}">${o(t)}</span>${e.alt ? `<span class="sw"> → ${o(e.alt)} (${l(Q(e.alt).total)}kg CO₂e)</span>` : '<span style="color:var(--muted)"> (대체 메뉴 없음)</span>'}`
                      : o(t);
                  })
                  .join(", ");
                return `<tr><td>${o(t.label)}</td><td>${e}</td><td>${l(t.menus.reduce((t, e) => t + Q(e).total, 0))}kg CO₂e</td></tr>`;
              },
            ).join(
              "",
            )}<tr><td>고기 없는 날</td><td>${K.map(o).join(", ")}</td><td>${l(K.reduce((t, e) => t + Q(e).total, 0))}kg CO₂e</td></tr></table></div></div><div class="dcard"><h3>출처</h3><p class="sub">본문의 번호(S001 등)가 가리키는 자료예요.</p><div class="tblwrap"><table class="srctable" id="srcTable"></table></div></div>`),
            (i("#srcTable").innerHTML = Object.values(M)
              .map(
                (t) =>
                  `<tr id="src-${o(t.source_id)}"><td>${o(t.source_id)}</td><td>${o(t.title)}<div class="pub">${o(t.publisher || "")}${t.url ? ` · <a href="${o(t.url)}" target="_blank" rel="noopener">원문</a>` : ""}${t.note && F[t.source_id] ? ` · ${o(t.note)}` : ""}</div></td></tr>`,
              )
              .join("")),
            A(i("#methodBody")));
        })(),
      (i("#dash").scrollTop = 0));
  }
  addEventListener("resize", () => {
    (clearTimeout(bt),
      (bt = setTimeout(() => {
        xt && /^(sim|month|board)$/.test($t) && i("#dash").classList.contains("open") && gt();
      }, 200)));
  });
  let wt = null;
  function Et(t) {
    kt();
    const e = document.activeElement;
    wt = e && e !== document.body && !e.closest("#dash") ? e : null;
    const s = i("#dash");
    (s.classList.add("open"), s.setAttribute("aria-hidden", "false"), vt(t || "detail"));
    const n = i("#dtabs button.on") || i("#dclose");
    requestAnimationFrame(() => {
      s.classList.contains("open") && n.focus({ preventScroll: !0 });
    });
  }
  function Ft() {
    window.__onDashClose && setTimeout(window.__onDashClose, 0);
    const t = i("#dash");
    (t.classList.remove("open"), t.setAttribute("aria-hidden", "true"), w());
    const e = wt;
    ((wt = null), e && e.isConnected && e.focus({ preventScroll: !0 }));
  }
  return (
    i("#dclose").addEventListener("click", Ft),
    {
      open: Et,
      close: Ft,
      isOpen: () => i("#dash").classList.contains("open"),
      _sim: {
        R,
        Q,
        rt,
        ct,
        nt,
        K,
        Y,
        gt,
        get tt() {
          return tt;
        },
        get et() {
          return et;
        },
        get st() {
          return st;
        },
      },
    }
  );
})();
window.Dash = Dash;
