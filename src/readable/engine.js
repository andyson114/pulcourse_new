// 계산 엔진(window.Engine): 메뉴 이름 해석 → 레시피·분량 → 배출계수 → 1인분 CO₂e
// 읽기용 사본입니다. 실제 빌드에는 build/app.bundle.js(압축 해제 원문)를 씁니다.
const Engine = (function () {
  const t = {};
  let e = null,
    s = [],
    i = {},
    n = {},
    o = {},
    a = null;
  const l = ["luc", "farm", "feed", "processing", "transport", "retail", "packaging", "losses", "disposal"];
  function r(t, e, s) {
    return t.startsWith(e, s);
  }
  ((t.init = function (l) {
    ((e = l), (a = e.rules), (n = e.alias), (o = e.methods), (i = {}), (s = []));
    for (const [t, n] of e.tokens) ((i[t] = n), s.push(t));
    return (s.sort((t, e) => e.length - t.length), (t.P = e), t);
  }),
    (t.normalize = function (t) {
      let e = String(t).normalize("NFC").replace(/\s+/g, "");
      return (
        (e = e.replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, "")),
        (e = e.replace(/[☆★♡♥※◎○●▶▷◆◇■□◈▲△▼▽*]/g, "")),
        (e = e.replace(/[\d,.\s/]+\)?$/, "")),
        (e = e.replace(/^[\-~·.]+|[\-~·.]+$/g, "")),
        e
      );
    }),
    (t.tokenize = function (t) {
      let e = String(t).normalize("NFC").replace(/\s+/g, "");
      e = e.replace(/[()\[\]&*+/·,\-_'"~!?.:]/g, "|");
      const n = e.split("|").filter((t) => t),
        o = [];
      let a = 0;
      for (const t of n) {
        let e = 0;
        for (; e < t.length;) {
          let n = null;
          for (const i of s)
            if (r(t, i, e)) {
              n = i;
              break;
            }
          if (n) (o.push([n, i[n]]), (e += n.length));
          else {
            let i = e + 1;
            for (; i < t.length;) {
              let e = !1;
              for (const n of s)
                if (r(t, n, i)) {
                  e = !0;
                  break;
                }
              if (e) break;
              i++;
            }
            (o.push([t.slice(e, i), "미등록"]), (a += i - e), (e = i));
          }
        }
      }
      return { tokens: o, uncovered: a, L: e.replace(/[^가-힣A-Za-z0-9]/g, "").length };
    }),
    (t.parse = function (e) {
      const { tokens: s, uncovered: i, L: l } = t.tokenize(e);
      let r = null,
        c = null;
      const d = [],
        h = [],
        p = [],
        u = [];
      for (const [t, e] of s) {
        if (t in o) t in n ? (c = o[t]) : (r = o[t]);
        else if ("재료" === e)
          for (let e = t.length - 1; e > 1; e--) {
            const s = t.slice(-e);
            if (s in o && s !== t) {
              r = o[s];
              break;
            }
          }
        (t in n && d.push(t),
          "수식어" === e ? h.push(t) : "제품명" === e ? p.push(t) : "미등록" === e && u.push(t));
      }
      let f = null,
        g = null;
      if (((r || c) && ([f, g] = r || c), null === f)) {
        const t = d.map((t) => n[t]);
        if (t.some((t) => a.protein_stds.includes(t))) ((f = "기타"), (g = "기타"));
        else {
          const e = t
              .slice()
              .reverse()
              .filter((t) => a.product_std_method[t]),
            s = e.filter((t) => "과일" !== a.product_std_method[t][0]),
            i = s.length ? s : e;
          i.length && ([f, g] = a.product_std_method[i[0]]);
        }
      }
      const m = new Set(a.dual_protein_tokens),
        y = new Set(a.protein_stds),
        x = new Set(d.filter((t) => !m.has(t) && y.has(n[t])).map((t) => n[t])),
        $ = [];
      for (const t of d) {
        const e = n[t];
        (m.has(t) && y.has(e) && x.size && !x.has(e)) || $.includes(e) || $.push(e);
      }
      return {
        tokens: s,
        method: f,
        mode: g,
        stds: $,
        mods: h,
        brands: p,
        unknown: u,
        coverage: Math.round(1e3 * (1 - i / Math.max(l, 1))) / 1e3,
      };
    }),
    (t.coreKey = function (e) {
      return t
        .tokenize(e)
        .tokens.filter(([t, e]) => "수식어" !== e && "제품명" !== e)
        .map((t) => t[0])
        .join("");
    }));
  const c = (t) => e.std_category[t] || "";
  function d(t) {
    return a.oil_stds.includes(t)
      ? "유지"
      : a.season_cats.includes(c(t))
        ? "양념"
        : a.water_stds.includes(t)
          ? "수분"
          : "식재료";
  }
  function h(t) {
    return a.season_cats.includes(c(t)) || a.grain_like.includes(t) || a.complete_extra.includes(t);
  }
  function p(t) {
    return a.protein_cats.includes(c(t)) || a.protein_like_stds.includes(t);
  }
  const u = (t, e, s, i, n, o) => ({ std: t, presence: e, med: s, p25: i, p75: n, origin: o });
  function f(t) {
    const s = e.parameters.sigma_qty_default.value;
    return !(t.p75 > t.p25) || t.p25 <= 0 ? s : Math.min(1, Math.log(t.p75 / t.p25) / 1.349);
  }
  function g(t, e) {
    const s = Float64Array.from(t).sort();
    return s[Math.min(s.length - 1, Math.max(0, Math.round(e * (s.length - 1))))];
  }
  ((t.resolve = function (s, i) {
    const n = t.normalize(s),
      o = t.parse(n),
      l = (e.segments[i] || { scale: 1 }).scale;
    let r = o.stds.slice();
    r.includes("육류(불명)") &&
      ["돼지고기", "소고기", "닭고기", "오리고기", "양고기", "육가공품"].some((t) => r.includes(t)) &&
      (r = r.filter((t) => "육류(불명)" !== t));
    const PL = a.plant_signal || [],
      PS = new Set(a.plant_replace_stds || []),
      PA = (t) => PS.has(t) || "육류" === c(t) || "어패류" === c(t),
      pv = o.mods.some((t) => PL.includes(t)) || o.tokens.some(([t]) => PL.includes(t)),
      pr = [];
    if (pv) {
      const q = [];
      for (const t of r)
        PA(t)
          ? (pr.includes(t) || pr.push(t), q.includes("식물성대체육") || q.push("식물성대체육"))
          : q.includes(t) || q.push(t);
      ((r = q), (o.stds = q.slice()));
    }
    const f = o.method && e.templates[o.method] ? o.method : null,
      g = f ? e.templates[f] : null;
    let m = e.recipes[n] || null,
      y = "exact",
      x = null,
      $ = [],
      b = m ? n : null;
    if (!m) {
      const s = t.coreKey(n);
      e.core_index[s] && ((b = e.core_index[s]), (m = e.recipes[b]), (y = "core"));
    }
    if (
      (!m &&
        n.length >= 2 &&
        ((x = Object.keys(e.recipes).filter((t) => t.endsWith(n) && t !== n)),
        x.length >= a.family_min ? (y = "family:" + x.length) : (x = null)),
      !m && !x && n.length >= 4)
    ) {
      const t = Object.keys(e.recipes).filter(
        (t) => t.length >= a.contained_min_len && n.endsWith(t) && t !== n,
      );
      t.length &&
        (t.sort((t, s) => s.length - t.length || e.recipes[s].n - e.recipes[t].n),
        (b = t[0]),
        (m = e.recipes[b]),
        (y = "contained:" + b),
        ($ = r.filter(
          (t) => !(t in m.base) && !("식물성대체육" === t && pv && Object.keys(m.base).some(PA)),
        )));
    }
    const k = [];
    let v,
      w = !1,
      E = null;
    const F = e.complete_segments;
    if (m || x) {
      if (x) {
        const t = (function (t) {
          const s = t.reduce((t, s) => t + e.recipes[s].n, 0),
            i = {};
          for (const s of t) {
            const t = e.recipes[s].n;
            for (const n in e.recipes[s].base) (i[n] = i[n] || []).push([t, e.recipes[s].base[n]]);
          }
          const n = {};
          for (const t in i) {
            const e = i[t],
              o = e.reduce((t, [e, s]) => t + e * s[0], 0) / s,
              a = (t) => {
                const s = e.map(([e, s]) => [s[t], e]).sort((t, e) => t[0] - e[0]),
                  i = s.reduce((t, e) => t + e[1], 0) / 2;
                let n = 0;
                for (const [t, e] of s) if (((n += e), n >= i)) return t;
                return s[s.length - 1][0];
              };
            n[t] = [Math.round(1e3 * o) / 1e3, a(1), a(2), a(3), e.reduce((t, e) => t + e[0], 0)];
          }
          return n;
        })(x);
        w = x.some((t) => F.some((s) => e.recipes[t].segs[s]));
        for (const e in t) {
          const s = t[e];
          k.push(u(e, s[0], s[1] * l, s[2] * l, s[3] * l, "recipe-family"));
        }
      } else if (m.seg[i]) {
        E = i;
        for (const t in m.seg[i]) {
          const e = m.seg[i][t];
          k.push(u(t, e[0], e[1], e[2], e[3], "recipe-seg"));
        }
        w = F.some((t) => m.segs[t]);
      } else {
        for (const t in m.base) {
          const e = m.base[t];
          k.push(u(t, e[0], e[1] * l, e[2] * l, e[3] * l, "recipe-base"));
        }
        w = F.some((t) => m.segs[t]);
      }
      const t = new Set(k.map((t) => t.std));
      for (const s of $) {
        if (t.has(s)) continue;
        const i = (g && g.ings[s]) || e.global_qty[s] || [1, 30, 20, 45, 0];
        (k.push(u(s, 1, i[1] * l, i[2] * l, i[3] * l, "template-named")), t.add(s));
      }
      if (!w && g)
        for (const e in g.ings) {
          const s = g.ings[e];
          t.has(e) ||
            !h(e) ||
            s[0] < a.presence_min ||
            k.push(u(e, s[0], s[1] * l, s[2] * l, s[3] * l, "template-supplement"));
        }
      v = 1;
    } else if (g) {
      const t = a.product_methods.includes(f);
      let s = r.filter((t) => "식재료" === d(t));
      const i = r.filter((t) => "식재료" !== d(t));
      t &&
        "과일" !== f &&
        s.some((t) => a.product_cats.includes(c(t))) &&
        (s = s.filter((t) => a.product_cats.includes(c(t))).slice(-1));
      const n = s.length ? s[s.length - 1] : null;
      for (const t of s) {
        const s = g.ings[t],
          i = e.global_qty[t];
        if (!s || (t !== n && i))
          if (t === n && !(a.slot_exempt_methods || []).includes(f)) {
            const e = g.slots["주재료"] || (i || [1, 30, 20, 45, 0]).slice(1, 4);
            k.push(u(t, 1, e[0] * l, e[1] * l, e[2] * l, "template-slot"));
          } else {
            const e = s || i || [1, 15, 10, 25, 0];
            k.push(u(t, 1, e[1] * l, e[2] * l, e[3] * l, "template-sub"));
          }
        else k.push(u(t, 1, s[1] * l, s[2] * l, s[3] * l, "template-named"));
      }
      for (const t of i) {
        const s = g.ings[t] || e.global_qty[t] || [1, 3, 2, 5, 0];
        k.push(u(t, 1, s[1] * l, s[2] * l, s[3] * l, "template-named"));
      }
      const o = new Set(k.map((t) => t.std));
      if (!t)
        for (const t in g.ings) {
          const e = g.ings[t];
          o.has(t) ||
            e[0] < a.presence_min ||
            (n && p(n) && p(t)) ||
            k.push(u(t, e[0], e[1] * l, e[2] * l, e[3] * l, "template-hidden"));
        }
      if (!s.length && !k.some((t) => "식재료" === d(t.std)) && g.slots["주재료"]) {
        const t = g.slots["주재료"];
        k.push(u("기타채소", 1, t[0] * l, t[1] * l, t[2] * l, "template-unknown-main"));
      }
      v = 2;
    } else if (r.length) {
      for (const t of r) {
        const s = e.global_qty[t] || [1, 30, 20, 45, 0];
        k.push(u(t, 1, s[1] * l, s[2] * l, s[3] * l, "global-std"));
      }
      v = 3;
    } else v = 4;
    if (pv) {
      const K = [],
        M = [];
      for (const t of k) {
        if (!PA(t.std)) {
          K.push(t);
          continue;
        }
        if ("template-hidden" === t.origin || "template-supplement" === t.origin) continue;
        pr.includes(t.std) || pr.push(t.std);
        M.push(t);
      }
      if (M.length) {
        let z = K.find((t) => "식물성대체육" === t.std);
        z || ((z = u("식물성대체육", 0, 0, 0, 0, M[0].origin)), K.push(z));
        for (const t of M)
          ((z.presence = Math.max(z.presence, t.presence)),
            (z.med += t.med),
            (z.p25 += t.p25),
            (z.p75 += t.p75));
      }
      ((k.length = 0), k.push(...K));
    }
    const pm = k.reduce((s, t) => s + ("식물성대체육" === t.std ? t.presence * t.med : 0), 0),
      ex = pm >= (a.plant_exclude_min_g || 10) * l ? "plant" : null;
    if (!ex && pm > 0) {
      const K2 = k.filter((t) => "식물성대체육" !== t.std);
      ((k.length = 0), k.push(...K2));
    }
    return {
      name: s,
      key: n,
      parse: o,
      tier: v,
      excluded: ex,
      plant: pv && k.some((t) => "식물성대체육" === t.std) ? pr : [],
      how: y,
      ings: k,
      scale: l,
      segment: i,
      recKey: b,
      family: x,
      recipeSeg: E,
      method: o.method,
      mode: o.mode,
      hasComplete: w,
    };
  }),
    (t.fuelFactor = function (t) {
      const s = e.parameters;
      return "gas" === t ? s.gas_kgco2e_per_mj.value : s.elec_kgco2e_per_kwh.value / 3.6;
    }),
    (t.emissions = function (s, i) {
      const n = (i = i || {}).fuel || e.parameters.cooking_fuel_default.value,
        o = e.parameters,
        a = {};
      for (const t of l) a[t] = 0;
      if (s.excluded)
        return {
          production: 0,
          processing: 0,
          distribution: 0,
          consumption: 0,
          disposal: 0,
          waste: 0,
          total: 0,
          mass_g: 0,
          luc: 0,
          per: [],
          cookMJ: 0,
          fuel: n,
          fallback: "plant",
          stages: a,
        };
      let r = 0;
      const c = [];
      if (2 === s.tier && e.corpus.method_prior && e.corpus.method_prior[s.parse.method]) {
        const t = s.parse.stds.filter((t) => "식재료" === d(t)),
          i = s.ings.filter((t) => "식재료" === d(t.std)).reduce((t, e) => t + e.presence * e.med, 0);
        if (!t.length && i < 20) {
          const t = e.corpus.method_prior[s.parse.method],
            i = t.median * s.scale,
            o = t.shares;
          return {
            production: i * o.production,
            processing: i * o.processing,
            distribution: i * o.distribution,
            consumption: i * o.consumption,
            disposal: i * o.disposal,
            waste: 0,
            total: i,
            mass_g: t.mass_g * s.scale,
            luc: 0,
            per: [],
            cookMJ: 0,
            fuel: n,
            fallback: "method",
            stages: a,
            prior: t,
          };
        }
      }
      for (const t of s.ings) {
        const s = e.factors[t.std] || e.factors["기타채소"],
          i = (t.presence * t.med) / 1e3;
        r += i;
        const n = {};
        let o = 0;
        for (const t of l) ((n[t] = i * s.stages[t]), (a[t] += n[t]), (o += n[t]));
        c.push({ std: t.std, q_kg: i, e: n, total: o, factor: s });
      }
      const h = s.parse.mode || "기타",
        p = void 0 !== o.cook_mj_per_kg.value[h] ? o.cook_mj_per_kg.value[h] : o.cook_mj_per_kg.value["기타"],
        u = void 0 !== i.wasteRate ? i.wasteRate : o.waste_rate.value,
        f = r * p * t.fuelFactor(n),
        g = r * u * o.waste_treatment_kgco2e_per_kg.value,
        m = a.luc + a.farm + a.feed,
        y = a.processing,
        x = a.transport + a.retail + a.packaging + a.losses,
        $ = a.disposal + g;
      let b = !1,
        k = m + y + x + f + $;
      return (
        4 === s.tier &&
          /[가-힣]/.test(s.key) &&
          !/행사|연휴|적용|REF|없음|휴무|방학|명절/.test(s.key) &&
          ((k = e.corpus.weighted_median), (b = !0)),
        {
          production: m,
          processing: y,
          distribution: x,
          consumption: f,
          disposal: $,
          waste: g,
          total: k,
          mass_g: 1e3 * r,
          luc: a.luc,
          per: c,
          cookMJ: p,
          fuel: n,
          fallback: b,
          stages: a,
        }
      );
    }),
    (t.stats = function (t) {
      const e = t.length;
      let s = 0;
      for (let i = 0; i < e; i++) s += t[i];
      return (
        (s /= e),
        { mean: s, median: g(t, 0.5), p10: g(t, 0.1), p25: g(t, 0.25), p75: g(t, 0.75), p90: g(t, 0.9) }
      );
    }),
    (t.monteCarlo = function (s, i) {
      const n = (i = i || {}).N || e.parameters.mc_iterations.value,
        o =
          ((a = i.seed || 12345),
          function () {
            let t = (a += 1831565813);
            return (
              (t = Math.imul(t ^ (t >>> 15), 1 | t)),
              (t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)),
              ((t ^ (t >>> 14)) >>> 0) / 4294967296
            );
          });
      var a;
      const l = e.parameters,
        r = () => {
          let t = 0,
            e = 0;
          for (; 0 === t;) t = o();
          for (; 0 === e;) e = o();
          return Math.sqrt(-2 * Math.log(t)) * Math.cos(2 * Math.PI * e);
        },
        c = i.fuel || l.cooking_fuel_default.value,
        d = t.fuelFactor(c),
        h = (s.length && s[0].items.length && e.segments[s[0].items[0].res.segment], l.sigma_scale.value),
        p = new Set();
      for (const t of s) for (const e of t.items) for (const t of e.res.ings) p.add(t.std);
      const u = [...p],
        g = u.map((t) => (e.factors[t] || e.factors["기타채소"]).sigma),
        m = { menus: [], meals: [], day: new Float32Array(n), N: n, fuel: c };
      for (const t of s) {
        const e = [];
        for (const s of t.items) e.push(new Float32Array(n));
        (m.menus.push(e), m.meals.push(new Float32Array(n)));
      }
      const y = l.cook_mj_per_kg.sigma,
        x = l.waste_rate.sigma,
        $ = l.waste_treatment_kgco2e_per_kg.sigma,
        b = new Float64Array(u.length),
        k = {};
      u.forEach((t, e) => (k[t] = e));
      for (let t = 0; t < n; t++) {
        const i = (t) => Math.exp(t * r() - (t * t) / 2);
        for (let t = 0; t < u.length; t++) b[t] = i(g[t]);
        const n = i(h),
          a = i(y),
          c = i(x),
          p = i($);
        let v = 0;
        (s.forEach((s, r) => {
          let h = 0;
          (s.items.forEach((s, u) => {
            const g = s.res;
            let y = 0,
              x = 0;
            if (s.det.fallback) {
              const t = "method" === s.det.fallback ? 0.6 : 1;
              y = s.det.total * i(t);
            } else {
              for (const t of g.ings) {
                if (t.presence < 1 && o() > t.presence) continue;
                const s = (t.med / 1e3) * i(f(t)) * (g.recipeSeg ? 1 : n);
                ((x += s), (y += s * (e.factors[t.std] || e.factors["기타채소"]).total * b[k[t.std]]));
              }
              ((y += x * s.det.cookMJ * a * d),
                (y += x * l.waste_rate.value * c * l.waste_treatment_kgco2e_per_kg.value * p));
            }
            ((m.menus[r][u][t] = y), (h += y));
          }),
            (m.meals[r][t] = h),
            (v += h));
        }),
          (m.day[t] = v));
      }
      return m;
    }),
    (t.grade = function (t, e) {
      let s = 0;
      for (; s < e.length && t > e[s];) s++;
      return ["A", "B", "C", "D", "E"][s];
    }),
    (t.menuGrade = (s) => t.grade(s, e.corpus.menu_bounds)),
    (t.mealGrade = function (s, i, n) {
      const o = e.corpus.meal_bounds[i];
      if (!o) return null;
      const a = n && o.by_meal[n] ? o.by_meal[n].bounds : o.bounds;
      return {
        grade: t.grade(s, a),
        bounds: a,
        basis: n && o.by_meal[n] ? `${i} ${n} ${o.by_meal[n].n}끼` : `${i} 전체 ${o.n}끼`,
      };
    }),
    (t.provenance = function (t, s) {
      const i = e.parameters,
        n = e.segments[t.segment],
        o = (t) =>
          e.sources[t]
            ? { id: t, title: e.sources[t].title, url: e.sources[t].url, publisher: e.sources[t].publisher }
            : { id: t },
        a = (t, e, s, i, n) =>
          Object.assign({ label: t, value: e, unit: s, sources: (i || []).map(o) }, n || {}),
        l = (e) => {
          switch (e.origin) {
            case "recipe-seg":
              return a("레시피 1인량 (해당 세그먼트 조리계획서)", e.med, "g", ["S012"], {
                detail: `${t.segment} 블록 기준 중앙값, p25 ${e.p25.toFixed(1)}·p75 ${e.p75.toFixed(1)} g, 포함률 ${(100 * e.presence).toFixed(0)}%`,
              });
            case "recipe-base":
              return a("레시피 1인량 (기준 세그먼트로 정규화) × 세그먼트 배율", e.med, "g", ["S012", n.src], {
                detail: `기준(지역아동센터) 정규화 분포 × ${t.segment} 배율 ${n.scale} (${n.basis}); 포함률 ${(100 * e.presence).toFixed(0)}%`,
              });
            case "recipe-family":
              return a(
                "레시피 계열 풀링 (접미 일치 " + (t.family ? t.family.length : 0) + "개 메뉴)",
                e.med,
                "g",
                ["S012", n.src],
                { detail: `블록 수 가중 중앙값 × 배율 ${n.scale}; 포함률 ${(100 * e.presence).toFixed(0)}%` },
              );
            case "template-named":
              return a("템플릿 (조리법 × 재료 분포)", e.med, "g", ["S012", n.src], {
                detail: `조리법 '${t.method}' 블록에서 이 재료의 1인량 중앙값 × 배율 ${n.scale}`,
              });
            case "template-slot":
              return a("템플릿 주재료 슬롯", e.med, "g", ["S012", n.src], {
                detail: `조리법 '${t.method}' 주재료 분량 분포(중앙값) × 배율 ${n.scale}`,
              });
            case "template-sub":
              return a("템플릿 부재료(전체 레시피 중앙값)", e.med, "g", ["S012", n.src], {
                detail: `이 재료의 전체 레시피 1인량 중앙값 × 배율 ${n.scale}`,
              });
            case "template-hidden":
              return a("템플릿 암묵 재료 (이름에 없지만 조리법에 흔한 재료)", e.med, "g", ["S012", n.src], {
                detail: `조리법 '${t.method}' 블록의 ${(100 * e.presence).toFixed(0)}%에 등장 → 포함률로 가중`,
              });
            case "template-supplement":
              return a("템플릿 보충 (기본양념·유지·향미채소·쌀)", e.med, "g", ["S012", n.src], {
                detail: `지역아동센터 조리지침서는 기본양념 등을 생략 → 조리법 템플릿에서 보충 (포함률 ${(100 * e.presence).toFixed(0)}%)`,
              });
            case "template-unknown-main":
              return a("주재료 미상 → 조리법 주재료 슬롯(채소 대용)", e.med, "g", ["S012"], {
                detail: "메뉴명에서 식재료를 찾지 못해 채소 계수로 대용",
              });
            case "global-std":
              return a("재료 전체 레시피 중앙값 (조리법 미상)", e.med, "g", ["S012", n.src], {
                detail: `× 배율 ${n.scale}`,
              });
            default:
              return a(e.origin, e.med, "g", ["S012"]);
          }
        },
        r = s.per.map((e, s) => {
          const i = t.ings[s],
            n = e.factor;
          return {
            std: i.std,
            category: c(i.std),
            presence: i.presence,
            quantity: l(i),
            sigma_q: f(i),
            factor: a("배출계수 (kgCO₂e/kg)", n.total, "kgCO2e/kg", n.sources, {
              quality: n.quality,
              sigma: n.sigma,
              basis: n.basis,
              note: n.note,
              stages: n.stages,
              components: n.components,
              variants: n.variants ? Object.keys(n.variants) : [],
            }),
            emission: e.total,
            e_stages: e.e,
          };
        });
      return {
        menu: t.name,
        key: t.key,
        tier: t.tier,
        how: t.how,
        method: t.method,
        mode: t.mode,
        tokens: t.parse.tokens,
        unknown: t.parse.unknown,
        coverage: t.parse.coverage,
        recipe: t.recKey
          ? { key: t.recKey, n_blocks: e.recipes[t.recKey].n, segs: e.recipes[t.recKey].segs }
          : null,
        scale: a("세그먼트 분량 배율", t.recipeSeg ? 1 : n.scale, "×", [n.src], {
          basis: t.recipeSeg ? `${t.segment} 세그먼트 자체 레시피 사용(배율 미적용)` : n.basis,
          sigma: n.sigma,
        }),
        ingredients: r,
        consumption: a("조리 에너지", s.cookMJ, "MJ/kg 재료", ["S006"], {
          mode: t.mode || "기타",
          fuel: s.fuel,
          fuel_factor: a(
            "gas" === s.fuel ? "도시가스 배출계수" : "전력 배출계수",
            "gas" === s.fuel ? i.gas_kgco2e_per_mj.value : i.elec_kgco2e_per_kwh.value,
            "gas" === s.fuel ? "kgCO2e/MJ" : "kgCO2e/kWh",
            ["gas" === s.fuel ? "S008" : "S009"],
          ),
          emission: s.consumption,
          sigma: i.cook_mj_per_kg.sigma,
          note: i.cook_mj_per_kg.note,
        }),
        waste: a("폐기 (조리량 대비 음식물쓰레기 비율 × 처리 계수)", i.waste_rate.value, "ratio", ["S011"], {
          treatment: a("음식물쓰레기 처리(퇴비화) 계수", i.waste_treatment_kgco2e_per_kg.value, "kgCO2e/kg", [
            "S007",
          ]),
          emission: s.disposal,
          sigma: i.waste_rate.sigma,
        }),
        totals: {
          production: s.production,
          processing: s.processing,
          distribution: s.distribution,
          consumption: s.consumption,
          disposal: s.disposal,
          total: s.total,
          mass_g: s.mass_g,
          luc: s.luc,
          fallback: s.fallback,
        },
      };
    }));
  const m = [
      ["오전간식", "오전간식"],
      ["오후간식", "오후간식"],
      ["아침", "아침"],
      ["조식", "아침"],
      ["점심", "점심"],
      ["중식", "점심"],
      ["저녁", "저녁"],
      ["석식", "저녁"],
      ["간식", "오후간식"],
      ["야식", "야식"],
    ],
    y =
      /^(\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}[\/.]\d{1,2}(?:\([월화수목금토일]\))?|\d{1,2}월\s*\d{1,2}일(?:\s*\([월화수목금토일]\))?|[월화수목금토일]요일)/;
  function x(t) {
    for (const [e, s] of m) if (t.includes(e)) return s;
    return null;
  }
  return (
    (t.parseInput = function (t) {
      const e = [];
      let s = null,
        i = null,
        n = 0;
      const o = (t) => {
        ((s = { label: t || `일자 ${e.length + 1}`, meals: [] }), e.push(s));
      };
      for (const e of String(t).split(/\r?\n/)) {
        let t = e.trim();
        if (!t) continue;
        let a = null,
          l = t;
        const r = t.match(y);
        if (r) {
          const e = t.slice(r[0].length).replace(/^[\s:：\-–]+/, "");
          if (!e || (x(e) && !e.includes(","))) {
            (o(r[0]), e && (i = e));
            continue;
          }
          ((l = e), s || o(r[0]));
        }
        const c = l.match(/^\[(.+?)\]\s*(.*)$|^([^,\/;|]{1,12}?)\s*[:：]\s*(.*)$/);
        if (c) {
          const t = (c[1] || c[3] || "").trim();
          x(t) && ((a = t), (l = (void 0 !== c[2] ? c[2] : c[4]) || ""));
        } else if (x(l) && l.length <= 8 && !/[,\/;|]/.test(l)) {
          i = l;
          continue;
        }
        const d = l
          .split(/\s*[,;、\/|]\s*|\s{2,}|\t+/)
          .map((t) => t.trim())
          .filter((t) => t && !/^[-–—=]+$/.test(t));
        if (!d.length) continue;
        (s || o(null), n++);
        const h = a || i || `끼니 ${n}`;
        ((i = null), s.meals.push({ label: h, meal: x(h), menus: d }));
      }
      return e.filter((t) => t.meals.length);
    }),
    (t.STAGES = l),
    (t.slotOf = d),
    (t.sigmaQ = f),
    (t.cat = c),
    t
  );
})();
("undefined" != typeof module && (module.exports = Engine), (window.Engine = Engine));
