
/* 사용 목적 선택 레이어(RoleHub): 첫 화면에서 목적(식단 설계·성과 관리·환경 교육·전체 보기)을 고르면 그 목적의 모듈만 보여 준다.
   기존 교육 체험(app.js)과 대시보드(dash.js)는 그대로 두고, dash.js 의 탭 전환 vt() 에 넣은 훅
   (window.__tabMap, window.__onDashClose)과 Dash._sim(시뮬레이터 계산 함수)만 사용한다.
   - 한 달 식단(month)·대시보드(board)는 '우리 식당 시뮬레이터'(pane-sim) 한 화면을 둘로 나눠 보여 주는 보기라
     설정(막대)은 두 화면이 함께 쓴다. */
window.RoleHub = (function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const LABEL = { detail: "메뉴별 CO₂e 비교", compare: "메뉴 바꾸기 비교", sim: "우리 식당 시뮬레이터", method: "어떻게 계산하나요?", month: "한 달 식단", board: "대시보드" };
  const ROLES = {
    nutri: { name: "식단 설계", who: "영양사용", hub: true, tabs: ["compare", "month", "detail", "method"], label: { compare: "메뉴 교환" }, map: { sim: "month", board: "month" } },
    corp: { name: "성과 관리", who: "기업·운영사용", hub: true, tabs: ["month", "board", "detail", "method"], map: { sim: "board", compare: "detail" } },
    user: { name: "환경 교육", who: "이용자용", hub: false, tabs: ["detail", "sim", "method"], map: { compare: "detail", month: "sim", board: "sim" } },
    all: { name: "전체 보기", who: "", hub: false, tabs: ["detail", "compare", "sim", "method"], map: { month: "sim", board: "sim" } }
  };

  let role = null, ready = false, pending = null;

  /* ── 탭 구성 ─────────────────────────────── */
  window.__tabMap = function (s) {
    const R = ROLES[role] || ROLES.all;
    if (R.map[s]) s = R.map[s];
    setTimeout(tabIntoView, 0);                  // 탭 전환 뒤 선택된 탭을 보이는 곳으로
    return R.tabs.includes(s) ? s : R.tabs[0];
  };
  function applyTabs() {
    const R = ROLES[role] || ROLES.all, nav = $("#dtabs");
    const btn = t => $(`#dtabs button[data-tab="${t}"]`);
    Object.keys(LABEL).forEach(t => { const b = btn(t); if (b) { b.hidden = !R.tabs.includes(t); b.textContent = (R.label && R.label[t]) || LABEL[t]; } });
    R.tabs.forEach(t => btn(t) && nav.appendChild(btn(t)));      // 목적별 탭 순서
    const d = $("#dash");
    d.classList.toggle("rh-hub", !!R.hub);
    d.dataset.role = role || "all";
    $$(".rh-hero .rh-link").forEach(a => (a.hidden = !R.tabs.includes(a.dataset.tabgo)));
    // 대시보드 머리 제목: 식단 설계·성과 관리는 목적 이름과 대상, 나머지는 원래 제목
    const t = $("#dash .dtitle > span");
    if (t) {
      if (!t.dataset.orig) t.dataset.orig = t.textContent;
      if (R.hub) { t.className = "rh-dt"; t.innerHTML = `<b>${esc(R.name)}</b><small>${esc(R.who)}</small>`; }
      else { t.className = ""; t.textContent = t.dataset.orig; }
    }
  }

  /* ── 목적 배지 ───────────────────────────── */
  function badges() {
    const R = ROLES[role];
    // 교육 화면: "이용자용 | 목적 바꾸기", 대시보드 머리: "목적 바꾸기"(제목에 목적이 이미 보임)
    const html = {
      "#rhBadgeStory": R ? `<b class="rh-role">${esc(R.who || R.name)}</b>목적 바꾸기` : "",
      "#rhBadgeDash": R && R.hub ? "목적 바꾸기" : R ? `<b class="rh-role">${esc(R.who || R.name)}</b>목적 바꾸기` : ""
    };
    Object.keys(html).forEach(s => { const b = $(s); if (b) { b.innerHTML = html[s]; b.hidden = !R; b.title = "사용 목적 선택 화면으로 돌아가기"; } });
  }

  /* ── 첫 화면 보이기/숨기기 ──────────────────── */
  const hub = () => $("#roleHub");
  const hubOpen = () => !hub().hidden;
  function showHub() {
    if (hubOpen()) return;
    const prev = role;
    role = null;
    if (window.Dash && Dash.isOpen()) Dash.close();
    role = prev;                      // 마지막 목적은 카드 강조용으로만 기억
    const h = hub();
    h.hidden = false; h.classList.remove("leaving");
    requestAnimationFrame(() => (($(`[data-role="${prev}"]`, h) || $(".rh-card", h)).focus({ preventScroll: true })));
  }
  function hideHub() {
    const h = hub();
    h.classList.add("leaving");
    setTimeout(() => { h.hidden = true; h.classList.remove("leaving"); }, 150);
  }

  function choose(r) {
    if (!ROLES[r]) return;
    if (!ready) { pending = r; return; }
    role = r;
    applyTabs(); badges();
    hideHub();
    const R = ROLES[r];
    if (R.hub) {
      Dash.open(R.tabs[0]);
      const S = Dash._sim;                 // 식단 설계·성과 관리는 '지금 식단 그대로'에서 시작
      Object.assign(S.tt, S.et); S.gt();
    } else {
      if (Dash.isOpen()) Dash.close();
      const S = Dash._sim;                 // 이용자·전체 보기는 원본 시뮬레이터 초기값(예시 설정)
      if (S.tt.beef !== undefined) Object.assign(S.tt, S.st);
      $("#rhRestart").click();       // 교육 체험을 처음(입장)부터
    }
  }

  /* ── 탭 줄 스크롤 표시: 넘칠 때만 가장자리를 흐리게, 선택된 탭은 보이는 곳으로 ── */
  function tabFade() {
    const t = $("#dtabs");
    if (!t) return;
    const max = t.scrollWidth - t.clientWidth;
    t.classList.toggle("fade-l", max > 4 && t.scrollLeft > 4);
    t.classList.toggle("fade-r", max > 4 && t.scrollLeft < max - 4);
  }
  function tabIntoView() {
    const t = $("#dtabs"), b = t && $("button.on", t);
    if (!b || t.scrollWidth <= t.clientWidth) return tabFade();
    const l = b.offsetLeft - t.offsetLeft, r = l + b.offsetWidth, pad = 32;
    if (l < t.scrollLeft + pad) t.scrollLeft = Math.max(0, l - pad);
    else if (r > t.scrollLeft + t.clientWidth - pad) t.scrollLeft = r - t.clientWidth + pad;
    tabFade();
  }

  window.__onDashClose = function () {
    if (role && ROLES[role].hub) showHub();
  };

  /* ── 한 달 식단 달력 ─────────────────────── */
  const DOW = ["월", "화", "수", "목", "금"];
  const VEG_DAYS = { 1: [2], 2: [1, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4] };   // 고기 없는 날을 요일에 고르게 배치
  const kg = v => v.toFixed(2);
  const tonOrKg = v => v >= 1000 ? `${(v / 1000).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}<small>톤 CO₂e</small>` : `${Math.round(v).toLocaleString("ko-KR")}<small>kg CO₂e</small>`;
  const isSide = (m, j) => (j === 0 && /밥$/.test(m)) || /김치$|깍두기$/.test(m);   // 밥·김치는 흐리게, 주메뉴를 돋보이게
  const barColor = v => v >= 2.5 ? "#E4553B" : v >= 1.6 ? "#E8A33B" : "#5FA328";

  function renderMonth() {
    const S = Dash._sim, box = $("#monthCal");
    if (!S || !box || !S.R) return;
    const tt = S.tt, et = S.et;
    if (!tt || tt.beef === undefined) return;
    const cfg = S.nt(tt), base = S.nt(et);
    const vegCfg = Object.assign({}, cfg, { swap: {} });
    const vegDays = VEG_DAYS[tt.veg] || [];
    const baseVals = S.R.map(d => S.rt(d.menus, base).total);
    const maxV = Math.max(...baseVals, 1);

    const cells = S.R.map((d, i) => {
      const wd = i % 5, isVeg = vegDays.includes(wd);
      const b = baseVals[i];
      let v, list, chg = false;
      if (isVeg) {
        v = S.rt(S.K, vegCfg).total;
        list = S.K.map((m, j) => `<div class="mc-m${isSide(m, j) ? " side" : ""}">${esc(m)}</div>`).join("");
        chg = true;
      } else {
        v = S.rt(d.menus, cfg).total;
        list = d.menus.map((m, j) => {
          const q = S.Q(m), f = q.meat && q.alt ? (cfg.swap[q.meat] || 0) : 0;
          if (f > 0) chg = true;
          const cls = q.meat ? " " + q.meat : isSide(m, j) ? " side" : "";
          const alt = f > 0 ? `<span class="mc-alt">→ ${esc(q.alt)}${f < 1 ? ` <em>${Math.round(f * 100)}%</em>` : ""}</span>` : "";
          return `<div class="mc-m${cls}${f >= 1 ? " off" : ""}">${esc(m)}</div>${alt}`;
        }).join("");
      }
      const moved = Math.abs(v - b) >= 0.005;
      return `<td class="${isVeg ? "veg" : chg ? "chg" : ""}">
        <div class="mc-date"><span>${esc(d.label)}</span>${isVeg ? '<span class="mc-tag">고기 없는 날</span>' : ""}</div>
        ${list}
        <div class="mc-v"><span class="mc-bar"><b style="width:${Math.min(100, v / maxV * 100)}%;--bc:${barColor(v)}"></b></span>${moved ? `<s>${kg(b)}</s>` : ""}${kg(v)}kg</div>
      </td>`;
    });

    let rows = "";
    for (let w = 0; w < S.R.length / 5; w++) rows += `<tr><th scope="row">${w + 1}주</th>${cells.slice(w * 5, w * 5 + 5).join("")}</tr>`;

    const m0 = S.ct(base).total, m1 = S.ct(cfg).total, dp = m0 ? (m1 - m0) / m0 * 100 : 0;
    const same = Math.abs(m1 - m0) < 0.005;
    const monthAll = m1 * S.R.length * tt.diners;
    // 1년 효과: 대시보드(gt)와 같은 계산 — 바뀌는 기간(ramp) 동안 효과가 직선으로 커진다고 본다
    let F = 0;
    for (let t = 1; t <= 12; t++) F += (tt.ramp ? Math.min(1, (t - 0.5) / tt.ramp) : 1) / 12;
    const Y0 = m0 * tt.diners * S.Y, Y1 = Y0 + F * (m1 * tt.diners * S.Y - Y0), yd = Y0 - Y1;
    const yZero = Math.abs(yd) < 0.5;
    const pct = v => `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(0)}%`;
    box.innerHTML = `<dl class="mc-result">
        <div class="main${yZero ? "" : yd > 0 ? " down" : " up"}"><dt>${yZero ? "1년 효과(식당 전체)" : yd > 0 ? "1년 동안 줄어드는 CO₂e(식당 전체)" : "1년 동안 늘어나는 CO₂e(식당 전체)"}</dt>
          <dd><span class="num">${yZero ? "0<small>톤 CO₂e</small>" : tonOrKg(Math.abs(yd))}</span><span class="note">${yZero ? "조절 막대를 움직이면 계산돼요." : `<b>${pct(-yd / Y0 * 100)}</b> · 점심 ${S.Y}일${tt.ramp ? ` · ${tt.ramp}개월에 걸쳐 바뀜` : ""}`}</span></dd></div>
        <div><dt>1인 한 끼 평균</dt><dd><span class="num">${kg(m1)}<small>kg CO₂e</small></span><span class="note">${same ? "지금 식단과 같음" : `지금 ${kg(m0)}kg · ${pct(dp)}`}</span></dd></div>
        <div><dt>한 달 식당 전체</dt><dd><span class="num">${tonOrKg(monthAll)}</span><span class="note">하루 ${tt.diners.toLocaleString("ko-KR")}명 × ${S.R.length}끼</span></dd></div>
      </dl>
      <section class="mc-cal" aria-labelledby="mcTitle">
        <h3 id="mcTitle">기준 식단 4주(${S.R.length}끼)</h3>
        <p class="mc-sub">칸 아래 숫자는 그날 1인 한 끼 CO₂e예요. 대체 메뉴 옆 퍼센트는 그 메뉴가 바뀌는 비율이에요.</p>
        <p class="mc-legend"><span class="k-beef">소고기 메뉴</span><span class="k-meat">돼지·닭·오리 메뉴</span><span class="k-alt">→ 대체 메뉴</span><span><i style="background:#5FA328"></i>1.6kg 미만</span><span><i style="background:#E8A33B"></i>1.6~2.5kg</span><span><i style="background:#E4553B"></i>2.5kg 이상</span></p>
        <div class="mc-scroll" tabindex="0" aria-label="4주 식단표(가로로 스크롤)">
          <table class="mc-table">
            <thead><tr><th scope="col"><span class="sr">주</span></th>${DOW.map(d => `<th scope="col">${d}</th>`).join("")}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <p class="mc-note">배식량, 음식물 쓰레기, 조리 에너지 설정도 칸마다 반영돼요. 고기 없는 날은 요일에 나눠 표시했어요(주 1회면 수요일). 한 끼 평균과 1년 효과는 대시보드와 같은 방식으로 계산해요.</p>`;
  }

  /* ── 시작 ─────────────────────────────── */
  function wire() {
    const h = hub();
    h.addEventListener("click", e => {
      e.stopPropagation();                         // 아래 교육 체험의 클릭 처리로 넘기지 않기
      const c = e.target.closest("[data-role]");
      if (c) choose(c.dataset.role);
    });
    // 첫 화면이 떠 있는 동안에는 교육 체험의 Enter/방향키 단축키가 동작하지 않게
    window.addEventListener("keydown", e => { if (hubOpen()) e.stopPropagation(); }, true);
    ["#rhBadgeStory", "#rhBadgeDash"].forEach(s => $(s) && $(s).addEventListener("click", e => { e.stopPropagation(); showHub(); }));
    if ($("#dtabs")) { $("#dtabs").addEventListener("scroll", tabFade, { passive: true }); addEventListener("resize", tabFade); }
    if (window.MutationObserver && $("#simScen")) new MutationObserver(() => $("#dash").dataset.view === "month" && renderMonth()).observe($("#simScen"), { childList: true });
  }

  wire();
  return {
    init() {
      ready = true;
      // 전환 효과를 끈 상태에서 그릇의 첫 위치를 확정(스타일 계산 강제)한 뒤 되살린다(드래그·제자리 복귀 동작용)
      $$(".bowl,.mbowl").forEach(el => el.getBoundingClientRect());
      setTimeout(() => document.body.classList.remove("rh-still"), 800);
      if (pending) { const p = pending; pending = null; choose(p); }
    },
    choose, showHub, get role() { return role; }
  };
})();
