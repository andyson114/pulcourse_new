// 교육 모듈(식당 체험): 입장 → 메뉴 고르기 → 이야기 → 결과 → 다짐
// 읽기용 사본입니다. 실제 빌드에는 build/app.bundle.js(압축 해제 원문)를 씁니다.
void (function () {
  "use strict";
  const t = "산업체오피스",
    e = (t, e = document) => e.querySelector(t),
    s = (t, e = document) => Array.from(e.querySelectorAll(t)),
    i = (t) => t.toFixed(2),
    n = (t) =>
      String(t).replace(/[&<>"]/g, (t) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[t]),
    o = (t, e) => s(t).forEach((t) => (t.textContent = e)),
    a = (t, e, s) => {
      const i = t.charCodeAt(t.length - 1);
      return t + (i >= 44032 && i <= 55203 && (i - 44032) % 28 != 0 ? e : s);
    },
    l = Engine.P,
    r = {
      소고기: "beef",
      돼지고기: "pork",
      육가공품: "pork",
      닭고기: "poultry",
      오리고기: "poultry",
      양고기: "meat",
      "육류(불명)": "meat",
    },
    c = ["beef", "pork", "poultry", "meat", "fish", "tofu", "veg", "other"],
    d = { beef: "🐮", pork: "🐷", poultry: "🐔", meat: "🥩", fish: "🐟", tofu: "🫘", veg: "🥬", other: "🍚" };
  function h(t) {
    if (r[t]) return r[t];
    const e = Engine.cat(t);
    return "어패류" === e
      ? "fish"
      : "두류" === e || "두부" === t
        ? "tofu"
        : ["채소", "버섯", "해조류", "과일"].includes(e)
          ? "veg"
          : "other";
  }
  function p(t) {
    const e = t.method || "",
      s = l.rules.roles;
    return /국|탕|찌개|전골/.test(e) || s.soup.includes(e)
      ? "soup"
      : s.rice.includes(e) || /밥|죽/.test(e)
        ? "rice"
        : s.noodle.includes(e) || /면|국수|우동|파스타/.test(e)
          ? "noodle"
          : "dish";
  }
  function u(e) {
    const s = Engine.resolve(e, t),
      i = Engine.emissions(s, {}),
      n = Engine.monteCarlo([{ meal: "점심", items: [{ res: s, det: i }] }], {}),
      o = Engine.stats(n.menus[0][0]),
      a = i.per.slice().sort((t, e) => e.total - t.total),
      l = i.per.filter((t) => ["소고기", "돼지고기"].includes(t.std)).reduce((t, e) => t + e.total, 0),
      r = i.per.filter((t) => "소고기" === t.std).reduce((t, e) => t + e.total, 0),
      u = s.parse.stds.map(h).filter((t) => "other" !== t),
      f = u.length ? c.find((t) => u.includes(t)) : a.length ? h(a[0].std) : "other",
      g = a.length ? a[0].std : "";
    return {
      name: e,
      total: i.total,
      meat: l,
      beefShare: i.total ? r / i.total : 0,
      mainShare: i.total && a.length ? a[0].total / i.total : 0,
      main: g,
      p10: o.p10,
      p90: o.p90,
      cat: f,
      emoji: d[f],
      shape: p(s),
      res: s,
      det: i,
    };
  }
  const f = ["소고기국밥", "시래기국"],
    g = new URLSearchParams(location.search),
    m = ["a", "b"].map((t) => (g.get(t) || "").trim()).filter(Boolean),
    y = [],
    x = [];
  (m.forEach((e) =>
    (((e) => {
      const s = Engine.resolve(e, t),
        i = Engine.emissions(s, {});
      return s.tier <= 3 && !i.fallback;
    })(e)
      ? y
      : x
    ).push(e),
  ),
    x.forEach((t) =>
      console.warn(`[오늘의 메뉴] '${t}'은(는) 식단 데이터에 없어요. 기본 메뉴로 보여 줘요.`),
    ));
  let $ = [...new Set(y)];
  (1 === $.length && $.push($[0] === f[1] ? f[0] : f[1]), 2 !== $.length && ($ = f.slice()));
  let b = u($[0]),
    k = u($[1]);
  k.total > b.total && ([b, k] = [k, b]);
  const v = { hi: b, lo: k },
    w = v.hi.name === f[0] && v.lo.name === f[1],
    E = y.length > 0;
  window.LUNCH_MENU = { hi: v.hi.name, lo: v.lo.name };
  const F = v.hi.name,
    M = v.lo.name,
    L = v.hi.beefShare >= 0.5,
    C = 141.3,
    A = (t) => Math.round(100 * t) / 100,
    _ = A(A(v.hi.total) - A(v.lo.total)),
    B = Math.round((1e3 * _) / C),
    S = v.lo.total ? v.hi.total / v.lo.total : 1,
    D = Math.round(100 * v.hi.beefShare);
  if (
    (o(".diffTxt", i(_) + "kg"),
    o(".hiTxt", i(v.hi.total) + "kg CO₂e"),
    o(".loTxt", i(v.lo.total) + "kg CO₂e"),
    o(".ratioTxt", (S >= 10 ? Math.round(S) : S.toFixed(1)) + "배"),
    s("[data-name]").forEach((t) => (t.textContent = v[t.dataset.name].name)),
    s("[data-emoji]").forEach((t) => (t.textContent = v[t.dataset.emoji].emoji)),
    (e("#hiWhy").innerHTML = v.hi.main
      ? `이 중 <b>${Math.round(100 * v.hi.mainShare)}%</b>는 ${n(v.hi.main)}에서 나와요`
      : ""),
    (e("#loWhy").innerHTML = w
      ? `고기 대신 시래기를 넣어서 ${n(F)}의 <b>약 ${Math.max(1, Math.round(100 / S))}%</b>밖에 안 돼요`
      : `${n(F)}의 <b>약 ${Math.max(1, Math.round(100 / S))}%</b>밖에 안 돼요`),
    (e("#pBeef .eyebrow").textContent = `${a(F, "을", "를")} 담았어요`),
    (e("#beefH2").innerHTML =
      `${n(a(M, "을", "를"))} 골랐다면<br><em>${i(_)}kg CO₂e</em>를<br>아낄 수 있었어요`),
    (e("#beefNudge").innerHTML =
      `${n(F)} 한 그릇은 ${n(M)}보다 CO₂e가 <b>${S >= 10 ? Math.round(S) : S.toFixed(1)}배</b> 많아요. ${{ beef: "대부분 소를 키우는 동안 나오는 거예요.", pork: "대부분 돼지를 키우는 동안 나오는 거예요.", poultry: "대부분 닭이나 오리를 키우는 동안 나오는 거예요.", meat: "대부분 가축을 키우는 동안 나오는 거예요.", fish: "대부분 잡고 기르고 옮기는 동안 나오는 거예요.", tofu: "대부분 재료를 기르고 만드는 동안 나오는 거예요.", veg: "대부분 재료를 기르고 만드는 동안 나오는 거예요.", other: "대부분 재료를 기르고 만드는 동안 나오는 거예요." }[v.hi.cat]} 둘 다 좋아한다면, 한 번 더 생각해 볼까요?`),
    (e("#beefStay").textContent = `그래도 ${F} 먹을래요 ›`),
    (e("#pStory .eyebrow").textContent = `${F} 한 그릇이 오기까지`),
    (e("#simSub").textContent = `${a(M, "으로", "로")} 몇 번 바꿔 볼까요?`),
    (e("[data-preview=story]").textContent = `${a(F, "이었다면", "였다면")}? ›`),
    E)
  ) {
    const t = (g.get("d") || "").trim(),
      s = e("#todayTag");
    ((s.textContent = "오늘의 메뉴" + (t ? ` · ${t}` : "")), (s.hidden = !1));
  }
  e("#drive").setAttribute("aria-label", `승용차로 약 ${B}km 달릴 때 나오는 양이에요`);
  const T = {
    beef: ["#B8452E", "#D2603F"],
    pork: ["#C7684A", "#DE8A6C"],
    poultry: ["#E4D3A8", "#F1E6C9"],
    meat: ["#B8452E", "#D2603F"],
    fish: ["#DDD4BC", "#EEE8D6"],
    tofu: ["#E3CFA0", "#F0E2C2"],
    veg: ["#CFBE86", "#E9DFB9"],
    other: ["#D8C6A0", "#EADFC4"],
  };
  function j(t) {
    const nm = v[t].name;
    if ("소고기국밥" === nm)
      return '<svg viewBox="0 0 230 190"><image x="20" y="8" width="190" height="152" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,…(이미지 데이터 생략 — build/app.bundle.js 원문 참고)"/></svg>';
    if ("시래기국" === nm)
      return '<svg viewBox="0 0 230 190"><image x="20" y="8" width="190" height="152" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,…(이미지 데이터 생략 — build/app.bundle.js 원문 참고)"/></svg>';
    const { cat: e, shape: s } = v[t],
      [i, n] = T[e] || T.other,
      o = (function (t) {
        switch (t) {
          case "beef":
          case "pork":
          case "meat":
            return '<ellipse cx="100" cy="77" rx="20" ry="8" fill="#6E3324" stroke="#8A4432" stroke-width="2"/>\n         <ellipse cx="128" cy="74" rx="20" ry="8" fill="#6E3324" stroke="#8A4432" stroke-width="2" transform="rotate(-8 128 74)"/>\n         <ellipse cx="114" cy="84" rx="18" ry="6.5" fill="#6E3324" stroke="#8A4432" stroke-width="2"/>\n         <g fill="#E07A4F" opacity=".7"><circle cx="70" cy="70" r="3"/><circle cx="150" cy="78" r="2.5"/><circle cx="160" cy="66" r="2"/></g>\n         <path d="M92 70l10 5M130 68l-8 6" stroke="#7E1B10" stroke-width="3" stroke-linecap="round"/>\n         <g fill="#4FA34A"><circle cx="78" cy="74" r="3.5"/><circle cx="152" cy="76" r="3.5"/><circle cx="120" cy="66" r="3"/><circle cx="104" cy="88" r="3"/><circle cx="140" cy="86" r="3"/></g>';
          case "poultry":
            return '<ellipse cx="102" cy="77" rx="20" ry="8" fill="#E2B888" stroke="#C99A62" stroke-width="2"/><ellipse cx="130" cy="75" rx="19" ry="8" fill="#E9C59A" stroke="#C99A62" stroke-width="2" transform="rotate(-8 130 75)"/><ellipse cx="114" cy="85" rx="17" ry="6" fill="#DDB07C" stroke="#C99A62" stroke-width="2"/><g fill="#4FA34A"><circle cx="80" cy="74" r="3.5"/><circle cx="150" cy="80" r="3.5"/><circle cx="122" cy="66" r="3"/></g>';
          case "fish":
            return '<ellipse cx="104" cy="78" rx="24" ry="9" fill="#F7EFE4" stroke="#D9C6AF" stroke-width="2"/><ellipse cx="132" cy="74" rx="20" ry="8" fill="#FBF5EC" stroke="#D9C6AF" stroke-width="2" transform="rotate(-10 132 74)"/><path d="M92 78l8 0M124 74l8 0" stroke="#E7A08B" stroke-width="3" stroke-linecap="round"/><g fill="#4FA34A"><circle cx="78" cy="72" r="3"/><circle cx="152" cy="82" r="3"/></g>';
          case "tofu":
            return '<g fill="#FBF7EA" stroke="#DDD3B8" stroke-width="1.5"><rect x="86" y="68" width="20" height="14" rx="3" transform="rotate(-8 96 75)"/><rect x="116" y="72" width="20" height="14" rx="3" transform="rotate(6 126 79)"/><rect x="104" y="82" width="18" height="12" rx="3"/></g><g fill="#4FA34A"><circle cx="78" cy="78" r="3"/><circle cx="150" cy="76" r="3"/><circle cx="140" cy="88" r="2.5"/></g>';
          case "veg":
            return '<g fill="none" stroke-linecap="round" stroke-linejoin="round">\n           <path d="M58 78c14-9 26 5 40-3s24 5 40-2s18 3 26 1" stroke="#4A7A34" stroke-width="5"/>\n           <path d="M66 86c12-6 24 3 38-3s22 4 36-2s16 2 22 0" stroke="#639B47" stroke-width="4"/>\n           <path d="M76 68c10 6 22-5 34 1s20-4 34 2" stroke="#3B6A2A" stroke-width="4"/>\n           <path d="M96 90c8-4 16 2 24-1" stroke="#7CB25C" stroke-width="3"/>\n         </g>\n         <g fill="#F5EFD9" stroke="#D9CFA6" stroke-width="1.5"><rect x="92" y="70" width="10" height="8" rx="2" transform="rotate(-14 97 74)"/><rect x="134" y="80" width="10" height="8" rx="2" transform="rotate(12 139 84)"/><rect x="118" y="83" width="9" height="7" rx="2" transform="rotate(-6 122 86)"/></g>\n         <g fill="#E4E2D8" opacity=".8"><ellipse cx="72" cy="72" rx="5" ry="2.5"/><ellipse cx="158" cy="86" rx="5" ry="2.5"/></g>';
          default:
            return '<g fill="#E0B25A"><circle cx="96" cy="76" r="5"/><circle cx="128" cy="72" r="4.5"/><circle cx="112" cy="86" r="4"/></g><g fill="#4FA34A"><circle cx="80" cy="74" r="3.5"/><circle cx="148" cy="80" r="3.5"/></g><g fill="#D9503E"><circle cx="138" cy="86" r="3"/><circle cx="104" cy="66" r="3"/></g>';
        }
      })(e);
    return "rice" === s
      ? `<svg viewBox="0 0 230 190">\n      <ellipse cx="115" cy="176" rx="96" ry="12" fill="#000" opacity=".14"/>\n      <path d="M22 78 Q30 158 80 170 L150 170 Q200 158 208 78 Z" fill="#E9E4DA"/>\n      <path d="M32 96 Q40 148 84 162" stroke="#F8F5EE" stroke-width="5" fill="none" stroke-linecap="round"/>\n      <ellipse cx="115" cy="78" rx="94" ry="26" fill="#D9D3C6"/>\n      <ellipse cx="115" cy="78" rx="84" ry="20" fill="#FFFDF7"/>\n      <ellipse cx="115" cy="72" rx="72" ry="17" fill="#FFFFFF"/>\n      <g fill="#F1EDE3"><circle cx="82" cy="70" r="3"/><circle cx="104" cy="64" r="3"/><circle cx="146" cy="70" r="3"/><circle cx="128" cy="78" r="3"/></g>\n      ${o}\n    </svg>`
      : "dish" === s
        ? `<svg viewBox="0 0 230 190">\n      <ellipse cx="115" cy="150" rx="104" ry="14" fill="#000" opacity=".12"/>\n      <ellipse cx="115" cy="118" rx="104" ry="36" fill="#F1EEE7"/>\n      <ellipse cx="115" cy="114" rx="90" ry="28" fill="#FFFFFF"/>\n      <g transform="translate(0 36)"><ellipse cx="115" cy="78" rx="58" ry="16" fill="${i}" opacity=".9"/><ellipse cx="108" cy="74" rx="30" ry="6" fill="${n}" opacity=".5"/>${o}</g>\n    </svg>`
        : `<svg viewBox="0 0 230 190">\n      <g class="steam" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"><path d="M92 40c-9-12 9-18 0-30"/><path d="M115 36c-9-12 9-18 0-30"/><path d="M138 40c-9-12 9-18 0-30"/></g>\n      <ellipse cx="115" cy="176" rx="96" ry="12" fill="#000" opacity=".14"/>\n      <path d="M30 76 Q34 160 78 170 L152 170 Q196 160 200 76 Z" fill="#4A2E22"/>\n      <path d="M40 96 Q46 150 82 162" stroke="#6D4533" stroke-width="5" fill="none" stroke-linecap="round"/>\n      <ellipse cx="115" cy="76" rx="88" ry="24" fill="#5B3A29"/>\n      <ellipse cx="115" cy="76" rx="76" ry="18" fill="${i}"/>\n      <ellipse cx="100" cy="71" rx="34" ry="6" fill="${n}" opacity=".55"/>\n      ${"noodle" === s ? '<g fill="none" stroke="#F3E6C4" stroke-width="4" stroke-linecap="round"><path d="M58 76c14 6 26-6 40 0s26-6 40 0s18 5 30 0"/><path d="M66 84c12-6 24 4 38-2s22 4 36-2s16 2 24 0"/><path d="M80 70c10 5 20-4 32 1s20-3 30 2"/></g>' : ""}${o}\n    </svg>`;
  }
  const H = e("#stage");
  let q = 1;
  function z() {
    const t = innerWidth,
      e = innerHeight;
    ((q = Math.min(t / 1600, e / 900)),
      (H.style.transform = `translate(${-800 * q}px, ${-450 * q}px) scale(${q})`));
  }
  function Vz() {
    const t = document.getElementById("storyStage"),
      e = document.getElementById("storySvg");
    if (!t || !e) return;
    const s = t.clientWidth,
      i = t.clientHeight;
    if (!s || !i) return;
    let n = Math.round((360 * s) / i);
    ((n = Math.max(640, Math.min(1400, n))), e.setAttribute("viewBox", (640 - n) / 2 + " 0 " + n + " 360"));
  }
  (addEventListener("resize", () => {
    (z(), P(), Vz());
  }),
    addEventListener("orientationchange", () =>
      setTimeout(() => {
        (z(), P(), Vz());
      }, 60),
    ));
  const W = matchMedia("(max-width: 900px) and (orientation: portrait), (max-height: 540px)"),
    R = matchMedia("(pointer: coarse)").matches,
    K = e("#mob"),
    Y = e("#msheet"),
    O = e("#msheetBg");
  let G = null,
    Gt = 0;
  function P() {
    const t = W.matches;
    (document.body.classList.toggle("mobile", t),
      K.setAttribute("aria-hidden", t ? "false" : "true"),
      e("#mbg").setAttribute("viewBox", innerWidth > innerHeight ? "0 100 1600 300" : "300 20 1000 560"),
      t &&
        !K.dataset.ready &&
        ((K.dataset.ready = "1"),
        (e("#mbg").innerHTML = e("#bg")
          .innerHTML.replace(/id="bg(\w+)"/g, 'id="mbg$1"')
          .replace(/url\(#bg(\w+)\)/g, "url(#mbg$1)")
          .replace(/href="#bg(\w+)"/g, 'href="#mbg$1"')),
        s(".mcard").forEach((t) => {
          ((e(".mbowl", t).innerHTML = j(t.dataset.mk)),
            (e(".mkg", t).textContent = i(v[t.dataset.mk].total) + "kg CO₂e"));
        }),
        s(".mslotBowl").forEach((t) => (t.innerHTML = j(t.dataset.mk) + et(t.dataset.mk)))));
  }
  function N(t, e, s, i) {
    const n = t.getBoundingClientRect();
    return e > n.left - i && e < n.right + i && s > n.top - i && s < n.bottom + i;
  }
  function I(t) {
    if ("choose" !== ft) return;
    ((G = t), (Gt = performance.now()));
    const s = e(wt[t]);
    ((Y.className = "msheet show " + t),
      O.classList.add("show"),
      (e("#msheetEmoji").textContent = v[t].emoji),
      (e("#msheetName").textContent = v[t].name),
      (e("#msheetTag").textContent = e(".tag", s).textContent),
      (e("#msheetWhy").innerHTML = e(".why", s).innerHTML));
    const i = e("#msheetNum"),
      n = e("#msheetMeter");
    ((i.textContent = "0.00"),
      (n.style.width = "0"),
      xt(() => bt(i, v[t].total, 900), 80),
      xt(() => (n.style.width = kt(t)), 140),
      Et[t] || ((Et[t] = !0), Et.hi && Et.lo && !Ft && ((Ft = !0), xt(() => $t(it, "think"), 1100))));
  }
  function Q() {
    (Y.classList.remove("show"), O.classList.remove("show"), (G = null));
  }
  (s(".mcard").forEach((t) => {
    const s = t.dataset.mk;
    let i = null;
    const n = e(".mbowl", t),
      o = e("#mob .mdrop"),
      a = e("#mob .mslot");
    (t.addEventListener("pointerdown", (e) => {
      "choose" === ft && (t.setPointerCapture(e.pointerId), (i = { x: e.clientX, y: e.clientY, moved: !1 }));
    }),
      t.addEventListener("pointermove", (e) => {
        if (!i) return;
        const s = e.clientX - i.x,
          l = e.clientY - i.y;
        if (!i.moved && Math.hypot(s, l) < 8) return;
        ((i.moved = !0), t.classList.add("dragging"));
        const r = N(a, e.clientX, e.clientY, 30);
        (o.classList.toggle("over", r),
          (n.style.transform = `translate(${s}px, ${l}px) scale(${r ? 0.8 : 1.04})`));
      }),
      t.addEventListener("pointerup", (e) => {
        if (!i) return;
        const l = i.moved;
        ((i = null),
          t.classList.remove("dragging"),
          o.classList.remove("over"),
          (n.style.transform = ""),
          l ? N(a, e.clientX, e.clientY, 30) && St(s) : I(s));
      }),
      t.addEventListener("pointercancel", () => {
        ((i = null), t.classList.remove("dragging"), o.classList.remove("over"), (n.style.transform = ""));
      }));
  }),
    R && (e("#hint").innerHTML = "메뉴를 <b>눌러서</b> 살펴보고 담아 보세요"));
  const X = { hi: { x: 560, y: 395 }, lo: { x: 810, y: 395 } },
    U = { x: 802, y: 666 },
    Z = { hi: e("#bowlHi"), lo: e("#bowlLo") };
  function J(t, e, s, i = 1) {
    const n = Z[t];
    ((n.style.left = "0px"),
      (n.style.top = "0px"),
      (n.style.transform = `translate(${e}px, ${s}px) scale(${i})`),
      (n._pos = { x: e, y: s, s: i }));
  }
  function V(t) {
    (J(t, X[t].x, X[t].y), Z[t].classList.remove("intray"), e("#tray").classList.remove("sink-" + t));
  }
  function tt(t) {
    (J(t, U.x, U.y, 0.8), Z[t].classList.add("intray"));
    const s = e("#tray");
    (s.classList.remove("sink-hi", "sink-lo"), s.offsetWidth, s.classList.add("sink-" + t));
  }
  function et(t) {
    const e = Math.max(0.8, v[t].total / (v.hi.total || 1));
    return `<div class="balloon ${t}"><div class="cloud" style="--bf:${(20 * e).toFixed(1)}px;font-size:var(--bf);padding:${(6 + 4 * e).toFixed(1)}px ${(9 + 5 * e).toFixed(1)}px">${i(v[t].total)}<small>kg CO₂e</small>${"lo" === t ? '<span class="spark">✨</span>' : ""}</div><i class="line"></i></div>`;
  }
  const st = { intro: 0, choose: 1, hi: 1, lo: 1, story: 1, result: 2, close: 3 },
    it = S >= 1.5 ? `어? ${a(M, "이", "가")} CO₂e가 훨씬 적네?` : `어? ${a(M, "이", "가")} CO₂e가 더 적네?`;
  function nt(t) {
    const e = h(t);
    if ("other" !== e) return d[e];
    const s = Engine.cat(t);
    return "곡류" === s || "면류" === s
      ? "🌾"
      : "유제품" === s
        ? "🥛"
        : "난류" === s
          ? "🥚"
          : ["양념", "김치·절임", "당류", "유지"].includes(s)
            ? "🧂"
            : "●";
  }
  const ot = [
    {
      id: "chIngr",
      ms:
        3600 +
        500 *
          (function () {
            const t = v.hi.det.per.slice().sort((t, e) => e.total - t.total),
              s = t.slice(0, 4),
              o = t.slice(4).reduce((t, e) => t + e.total, 0),
              a = s.map((e) => ({ name: e.std, kg: e.total, emoji: nt(e.std), main: e === t[0] }));
            t.length > 4 && a.push({ name: `그 외 ${t.length - 4}가지`, kg: o, emoji: "●", main: !1 });
            const l = a.length ? Math.max(...a.map((t) => t.kg)) : 1,
              r = ['<rect x="0" y="0" width="640" height="360" rx="24" fill="#F1F5ED"/>'];
            return (
              r.push(
                `<svg x="20" y="102" width="216" height="178" viewBox="0 0 230 190">${j("hi").replace(/^\s*<svg[^>]*>|<\/svg>\s*$/g, "")}</svg>`,
              ),
              a.forEach((t, e) => {
                const s = 38 + 50 * e,
                  o = Math.max(6, (300 * t.kg) / (l || 1));
                r.push(
                  `<g class="ingRow${t.main ? " main" : ""}" style="--d:${(0.4 + 0.5 * e).toFixed(2)}s"><text x="258" y="${s + 24}" font-size="24">${t.emoji}</text><text x="296" y="${s + 19}" font-size="17" font-weight="700" fill="#191F28">${n(t.name)}</text><text x="612" y="${s + 19}" text-anchor="end" font-size="15" font-weight="700" fill="#4E5968">${t.kg < 0.01 ? t.kg.toFixed(3) : i(t.kg)}kg CO₂e</text><rect class="bar" x="296" y="${s + 29}" width="${o.toFixed(1)}" height="12" rx="6" fill="${t.main ? "#E4553B" : "#B0B8C1"}"/></g>`,
                );
              }),
              (e("#chIngr").innerHTML = r.join("")),
              a.length
            );
          })(),
      title: "한 그릇을 뜯어봐요",
      desc: `${n(F)} 한 그릇에 들어간 재료마다 CO₂e를 매겨 봤어요. 막대가 길수록 CO₂e가 많아요.`,
      note: v.hi.main
        ? `한 그릇의 ${Math.round(100 * v.hi.mainShare)}%가 ${n(a(v.hi.main, "이에요", "예요"))}`
        : "",
    },
  ];
  L &&
    ot.push(
      {
        id: "chFarm",
        ms: 4200,
        title: "소를 키워요",
        desc: `${n(F)} 한 그릇에는 소가 자라는 동안 먹은 사료와 물이 들어 있어요.`,
      },
      {
        id: "chCh4",
        ms: 4600,
        title: "소가 트림할 때 메탄이 나와요",
        desc: "소는 풀을 소화하면서 메탄(CH₄)을 내뿜어요. 메탄은 이산화탄소보다 훨씬 강한 온실가스예요.",
      },
      {
        id: "chForest",
        ms: 4400,
        title: "목장과 사료밭을 만들려고 숲을 베어요",
        desc: "소를 키울 땅과 사료를 기를 밭이 필요해서 숲이 사라져요.",
      },
      {
        id: "chWater",
        ms: 5200,
        title: "분뇨와 비료가 강으로 흘러가요",
        desc: "소의 분뇨와 사료밭의 비료가 빗물에 씻겨 강물이 탁해져요.",
        note: `${n(F)} 한 그릇 ${i(v.hi.total)}kg CO₂e 중 약 ${D}%가 소고기에서 나와요. 대부분 소를 키우는 동안 생기는 거예요.`,
      },
      {
        id: "chUndo",
        ms: 6400,
        title: `그런데 ${n(a(M, "을", "를"))} 고르면?`,
        desc: "강물이 맑아지고, 나무가 다시 자라고, 소는 덜 키워도 돼요. 메뉴 하나가 지구를 이렇게 바꿔요.",
        note: `${n(M)} 한 그릇은 ${i(v.lo.total)}kg CO₂e. ${n(F)}보다 ${i(_)}kg CO₂e 가벼워요.`,
      },
    );
  let at = !1;
  const lt = matchMedia("(prefers-reduced-motion: reduce)").matches,
    rt = { i: -1, timer: null, preview: !1 };
  function ct(t) {
    rt.i = t;
    const i = ot[t];
    (ot.forEach((s, i) => e("#" + s.id).classList.toggle("on", i === t)),
      s("#storyDots i").forEach((e, s) => {
        (e.classList.toggle("on", s === t), e.classList.toggle("done", s < t));
      }),
      (e("#storyTitle").textContent = "①②③④⑤⑥⑦".charAt(t) + " " + i.title),
      (e("#storyDesc").innerHTML = i.desc + (i.note ? `<span class="note">${i.note}</span>` : "")),
      clearTimeout(rt.timer),
      (rt.timer = setTimeout(dt, lt ? Math.max(3500, i.ms) : i.ms)));
  }
  function dt() {
    "story" === ft && (rt.i + 1 < ot.length ? ct(rt.i + 1) : ut());
  }
  function ht() {
    "story" === ft && (rt.i > 0 ? ct(rt.i - 1) : At());
  }
  function pt() {
    "story" === ft && ut();
  }
  function ut() {
    (clearTimeout(rt.timer), rt.preview ? ((rt.preview = !1), Lt("result", !1)) : ((at = !0), Lt("hi", !1)));
  }
  let ft = "intro",
    gt = null;
  const mt = [],
    yt = [],
    xt = (t, e) => yt.push(setTimeout(t, e));
  function $t(t, e) {
    const i = s(".thoughtBox");
    (i.forEach((t) => t.classList.remove("show")),
      xt(() => {
        (s(".thoughtText").forEach((e) => (e.innerHTML = t)),
          s(".thoughtBox .mouth").forEach((t) =>
            t.setAttribute("d", "think" === e ? "M23 42h14" : "M22 41q8 6 16 0"),
          ),
          i.forEach((t) => t.classList.add("show")));
      }, 120));
  }
  function bt(t, e, s, i = (t) => t.toFixed(2)) {
    const n = performance.now(),
      o = (a) => {
        const l = Math.min(1, (a - n) / s),
          r = 1 - Math.pow(1 - l, 3);
        ((t.textContent = i(e * r)), l < 1 && requestAnimationFrame(o));
      };
    requestAnimationFrame(o);
  }
  const kt = (t) => (v[t].total / (1.08 * v.hi.total)) * 100 + "%",
    vt = (t, s) => e(t).classList.toggle(t.startsWith("#p") ? "show" : "fade", t.startsWith("#p") ? s : !s),
    wt = { hi: "#infoHi", lo: "#infoLo" },
    Et = { hi: !1, lo: !1 };
  let Ft = !1;
  function Mt(t, s) {
    if ("choose" !== ft) return;
    const i = wt[t];
    if ((vt(i, s), !s)) return void J(t, X[t].x, X[t].y, 1);
    if ((J(t, X[t].x, X[t].y, 1.06), Et[t])) return;
    Et[t] = !0;
    const n = e(".num", e(i)),
      o = e(".meter b", e(i));
    ((n.textContent = "0.00"),
      (o.style.width = "0"),
      xt(() => bt(n, v[t].total, 900), 60),
      xt(() => (o.style.width = kt(t)), 120),
      Et.hi && Et.lo && !Ft && ((Ft = !0), xt(() => $t(it, "think"), 1100)));
  }
  function Lt(t, i = !0) {
    (i && t !== ft && mt.push({ scene: ft, picked: gt }),
      yt.splice(0).forEach(clearTimeout),
      clearTimeout(rt.timer),
      (rt.i = -1),
      ot.forEach((t) => e("#" + t.id).classList.remove("on")),
      (ft = t),
      [...document.body.classList].forEach((t) => {
        (t.startsWith("s-") || "blur" === t || "dim" === t) && document.body.classList.remove(t);
      }),
      document.body.classList.add("s-" + t),
      (
        { intro: ["blur", "dim"], story: ["blur", "dim"], result: ["blur", "dim"], close: ["blur", "dim"] }[
          t
        ] || []
      ).forEach((t) => document.body.classList.add(t)),
      ["#pIntro", "#pBeef", "#pStory", "#pResult", "#pClose"].forEach((t) => vt(t, !1)),
      ["#hint", "#infoHi", "#infoLo", "#saved", "#stageCta"].forEach((t) => vt(t, !1)),
      s(".thoughtBox").forEach((t) => t.classList.remove("show")),
      e("#drive").classList.remove("go"),
      Q(),
      "choose" === t || "intro" === t
        ? (K.dataset.picked = "")
        : ("lo" !== t && "hi" !== t && "story" !== t) || (K.dataset.picked = "lo" === t ? "lo" : "hi"));
    const n = st[t];
    (s("#steps span").forEach((t, e) => {
      (t.classList.toggle("on", e === n), t.classList.toggle("done", e < n));
    }),
      e("#back").classList.toggle("show", mt.length > 0 && "intro" !== t));
    const o = "choose" !== t;
    var l;
    if (
      (Object.values(Z).forEach((t) => t.classList.toggle("locked", o)),
      "intro" === t && ((gt = null), V("hi"), V("lo"), vt("#pIntro", !0)),
      "choose" === t &&
        ((gt = null),
        V("hi"),
        V("lo"),
        (Et.hi = Et.lo = !1),
        (Ft = !1),
        vt("#hint", !0),
        xt(() => $t("뭘 먹을까 고민되네", "think"), 350)),
      "story" !== t && (rt.preview = !1),
      "story" === t &&
        (rt.preview || (tt("hi"), V("lo")),
        vt("#pStory", !0),
        Vz(),
        (e("#storyDots").innerHTML = ot.map(() => "<i></i>").join("")),
        ct(0)),
      "hi" === t &&
        (tt("hi"),
        V("lo"),
        vt("#pBeef", !0),
        (l = e("#pBeef")),
        s("b[data-k]", l).forEach((t) => (t.style.width = "0")),
        xt(() => s("b[data-k]", l).forEach((t) => (t.style.width = kt(t.dataset.k))), 200),
        at
          ? ((at = !1), $t("다시 골라볼까?", "think"))
          : ($t("어, 식판이 무거워졌어…", "think"),
            xt(() => $t(`음… ${a(F, "이", "가")} 더 끌리긴 하는데`, "think"), 2600))),
      "lo" === t &&
        (tt("lo"),
        V("hi"),
        $t("가볍다! 지구도 가벼워졌어!", "happy"),
        xt(() => vt("#saved", !0), 500),
        xt(() => vt("#stageCta", !0), 900)),
      "result" === t)
    ) {
      const t = "hi" === gt;
      (e("#pResult").classList.toggle("beefPick", t),
        (e("#resIcon").textContent = t ? v.hi.emoji : "🌱"),
        (e("#claimTop").textContent = t ? `이번엔 ${a(F, "을", "를")} 골랐어요` : "내 선택으로"),
        (e("#claimBottom").textContent = t ? `${M}보다 이만큼 더 나왔어요` : "지구가 이만큼 건강해졌어요!"),
        (e("#simTitle").textContent = t
          ? "일주일에 한 번만 바꿔도 어떻게 될까요?"
          : "일 년 내내 이렇게 고르면 어떻게 될까요?"),
        (e("#simSub").textContent = t
          ? `${a(M, "으로", "로")} 몇 번 바꿔 볼까요?`
          : "일주일에 몇 번 바꿔 볼까요?"),
        t || lt || xt(Ct, 500),
        vt("#pResult", !0),
        (e("#bigNum").textContent = "0.00"),
        (e("#carKm").textContent = "0"));
      const s = e("#drive .scene"),
        i = e("#drive .rig"),
        n = Math.max(80, s.clientWidth - i.getBoundingClientRect().width - 16);
      (e("#drive").style.setProperty("--drive-x", 0.7 * n + "px"),
        xt(() => bt(e("#bigNum"), _, 1300), 350),
        xt(() => {
          (e("#drive").classList.add("go"), bt(e("#carKm"), B, 1700, (t) => String(Math.round(t))));
        }, 300),
        Ot(),
        xt(Kt, 50));
    }
    "close" === t && vt("#pClose", !0);
  }
  function Ct() {
    const t = e("#leaves"),
      s = ["🍃", "🌿", "🍃", "🍀"];
    for (let e = 0; e < 13; e++) {
      const i = document.createElement("span");
      ((i.className = "leaf-fall"),
        (i.style.left = 6 + 88 * Math.random() + "%"),
        (i.style.animationDelay = 1.2 * Math.random() + "s"),
        (i.style.fontSize = 20 + 12 * Math.random() + "px"),
        (i.innerHTML = `<i style="animation-delay:${(-1.3 * Math.random()).toFixed(2)}s">${s[e % s.length]}</i>`),
        t.appendChild(i));
    }
    xt(() => {
      t.innerHTML = "";
    }, 4600);
  }
  function At() {
    "story" === ft && rt.i > 0 ? ct(rt.i - 1) : mt.length && Lt(mt.pop().scene, !1);
  }
  (e("#back").addEventListener("click", At),
    document.addEventListener("click", (t) => {
      if (t.target.closest("[data-pick]")) {
        const t = G;
        return (Q(), void (t && St(t)));
      }
      if (t.target.closest("[data-sheet-close]") || t.target === O) {
        if (t.target === O && performance.now() - Gt < 600) return;
        return void Q();
      }
      const e = t.target.closest("[data-story]");
      if (e) return void { next: dt, prev: ht, skip: pt }[e.dataset.story]();
      if (t.target.closest("[data-preview=story]")) return ((rt.preview = !0), void Lt("story"));
      if ("story" === ft && t.target.closest("#storyStage")) return void dt();
      const s = t.target.closest("[data-dash]");
      if (s) return void Dash.open(s.dataset.dash);
      const i = t.target.closest("[data-go]");
      if (!i)
        return t.target.closest("[data-retry]")
          ? (mt.pop(), void Lt("choose", !1))
          : void (t.target.closest("[data-restart]") && ((mt.length = 0), Lt("intro", !1)));
      Lt(i.dataset.go);
    }),
    document.addEventListener("keydown", (t) => {
      void 0 !== Dash && Dash.isOpen()
        ? "Escape" === t.key && Dash.close()
        : "INPUT" !== t.target.tagName &&
          "TEXTAREA" !== t.target.tagName &&
          ("story" !== ft
            ? ("Enter" === t.key &&
                (t.preventDefault(),
                "intro" === ft
                  ? Lt("choose")
                  : "lo" === ft
                    ? Lt("result")
                    : "result" === ft
                      ? Lt("close")
                      : "hi" === ft && (mt.pop(), Lt("choose", !1))),
              "result" !== ft || t.altKey || ("ArrowRight" !== t.key && "ArrowLeft" !== t.key)
                ? (("Backspace" === t.key || ("ArrowLeft" === t.key && t.altKey)) && At(),
                  "choose" !== ft || ("1" !== t.key && "a" !== t.key.toLowerCase()) || St("hi"),
                  "choose" !== ft || ("2" !== t.key && "b" !== t.key.toLowerCase()) || St("lo"))
                : Rt("ArrowRight" === t.key ? 1 : -1))
            : "Enter" === t.key || " " === t.key || "ArrowRight" === t.key
              ? (t.preventDefault(), dt())
              : "ArrowLeft" === t.key
                ? ht()
                : "Escape" === t.key
                  ? pt()
                  : "Backspace" === t.key && At());
    }));
  const _t = e("#dropHint");
  function Bt(t, s) {
    const i = e("#tray").getBoundingClientRect();
    return t > i.left - 40 && t < i.right + 40 && s > i.top - 40 && s < i.bottom + 40;
  }
  function St(t) {
    "choose" === ft && ((gt = t), Lt("hi" === t ? "story" : "lo"));
  }
  Object.entries(Z).forEach(([t, e]) => {
    e.innerHTML = j(t) + et(t) + e.innerHTML;
    let s = null;
    (e.addEventListener("pointerenter", () => {
      s || Mt(t, !0);
    }),
      e.addEventListener("pointerleave", () => {
        s || Mt(t, !1);
      }),
      e.addEventListener("pointerdown", (t) => {
        "choose" === ft &&
          (e.setPointerCapture(t.pointerId),
          (s = { x: t.clientX, y: t.clientY, p: { ...e._pos }, moved: !1 }));
      }),
      e.addEventListener("pointermove", (i) => {
        if (!s) return;
        const n = (i.clientX - s.x) / q,
          o = (i.clientY - s.y) / q;
        if (!s.moved && Math.hypot(n, o) < 6) return;
        ((s.moved = !0), e.classList.add("dragging"));
        const a = Bt(i.clientX, i.clientY);
        (_t.classList.toggle("over", a), J(t, s.p.x + n, s.p.y + o, a ? 0.8 : 1.04));
      }),
      e.addEventListener("pointerup", (i) => {
        if (!s) return;
        const n = s.moved;
        ((s = null),
          e.classList.remove("dragging"),
          _t.classList.remove("over"),
          n ? (Bt(i.clientX, i.clientY) ? St(t) : V(t)) : R ? I(t) : St(t));
      }),
      e.addEventListener("pointercancel", () => {
        ((s = null), e.classList.remove("dragging"), V(t));
      }));
  });
  const Dt = l.parameters.elec_kgco2e_per_kwh.value,
    Tt = {
      car: { per: (t) => (1e3 * t) / C, unit: "km", fmt: (t) => Math.round(t).toLocaleString("ko-KR") },
      phone: { per: (t) => t / (0.019 * Dt), unit: "번", fmt: (t) => Math.round(t).toLocaleString("ko-KR") },
      tree: { per: (t) => t / (6.6 / 365), unit: "일", fmt: (t) => Math.round(t).toLocaleString("ko-KR") },
      elec: {
        per: (t) => t / Dt,
        unit: "kWh",
        fmt: (t) => (t < 10 ? t.toFixed(1) : Math.round(t).toLocaleString("ko-KR")),
      },
    },
    jt = e("#eqTrack"),
    Ht = s(".eqCard"),
    qt = e("#eqDots");
  qt.innerHTML = Ht.map(() => "<i></i>").join("");
  const zt = {};
  function Wt() {
    const t = Math.round(jt.scrollLeft / Math.max(1, jt.clientWidth));
    (s("i", qt).forEach((e, s) => e.classList.toggle("on", s === t)),
      (e("[data-eqmove='-1']").disabled = 0 === t),
      (e("[data-eqmove='1']").disabled = t === Ht.length - 1));
    const i = Ht[t].dataset.eq;
    if ("car" !== i && !zt[i] && "result" === ft) {
      zt[i] = !0;
      const t = e(`[data-eqnum=${i}]`),
        s = Tt[i].per(_);
      lt ? (t.textContent = Tt[i].fmt(s)) : bt(t, s, 1100, Tt[i].fmt);
    }
  }
  function Rt(t) {
    jt.scrollBy({ left: t * jt.clientWidth, behavior: lt ? "auto" : "smooth" });
  }
  function Kt() {
    (Object.keys(zt).forEach((t) => delete zt[t]), (jt.scrollLeft = 0), jt.classList.remove("wiggle"), Wt());
  }
  (jt.addEventListener("scroll", () => requestAnimationFrame(Wt)),
    s("[data-eqmove]").forEach((t) => (t.onclick = () => Rt(+t.dataset.eqmove))));
  const Yt = e("#freq");
  function Ot() {
    const t = +Yt.value,
      i = _ * t * 52,
      n = (1e3 * i) / C;
    ((e("#freqN").textContent = t),
      (e("#yearKg").innerHTML = Math.round(i).toLocaleString("ko-KR") + "<small>kg CO₂e</small>"),
      (e("#yearKm").innerHTML = Math.round(n).toLocaleString("ko-KR") + "<small>km</small>"),
      Yt.style.setProperty("--p", ((t - 1) / 4) * 100 + "%"),
      s("[data-eqyear]").forEach((e) => {
        const s = Tt[e.dataset.eqyear];
        e.textContent = `일주일에 ${t}번이면 1년에 ${s.fmt(s.per(i))}${s.unit}`;
      }));
  }
  (Yt.addEventListener("input", Ot),
    (function () {
      const bg = document.getElementById("bg");
      const nameSize = (value) => (value.length > 8 ? 19 : value.length > 6 ? 22 : 27);
      bg.innerHTML =
        document.getElementById("restaurant-svg").textContent +
        `
    <g id="menuScreen" transform="translate(520 104)">
      <rect x="-15" y="-14" width="590" height="191" rx="27" fill="#F1DFCB"/>
      <rect x="-3" y="-3" width="566" height="169" rx="19" fill="#D9CFBD"/>
      <rect x="0" y="0" width="560" height="166" rx="16" fill="url(#bgBoard)"/>
      <text x="27" y="39" font-size="17" font-weight="700" fill="#FFF9EA">오늘의 메뉴</text>
      <text x="532" y="39" text-anchor="end" font-size="13" font-weight="500" fill="#E6EFE2">지구를 생각하는 점심</text>
      <rect x="21" y="60" width="248" height="82" rx="11" fill="#FFFFFF" opacity=".075"/>
      <rect x="291" y="60" width="248" height="82" rx="11" fill="#FFFFFF" opacity=".075"/>
      <rect x="39" y="80" width="43" height="43" rx="11" fill="#F18F84"/>
      <text x="60.5" y="110" text-anchor="middle" font-size="24" font-weight="900" fill="#FFF">A</text>
      <text x="96" y="111" font-size="${nameSize(F)}" font-weight="700" fill="#FFF">${n(F)}</text>
      <rect x="307" y="80" width="43" height="43" rx="11" fill="#B7DF82"/>
      <text x="328.5" y="110" text-anchor="middle" font-size="24" font-weight="900" fill="#5A7651">B</text>
      <text x="364" y="111" font-size="${nameSize(M)}" font-weight="700" fill="#FFF">${n(M)}</text>
    </g>`;
    })(),
    z(),
    P(),
    Vz(),
    V("hi"),
    V("lo"),
    Lt("intro", !1));
})();
