#!/usr/bin/env python3
"""계산 데이터(payload.json)에서 공개 가능한 부분만 골라 data/ 폴더로 내보낸다.

사용법:  python3 tools/export_public_data.py build/payload.json data/

공개하는 것: 배출계수·계산 파라미터·출처 목록(공개 출처)·메뉴 이름 해석 규칙과 사전
빼는 것:     급식회사 내부 자료(출처 S012)에서 나온 레시피 분량 분포·템플릿·메뉴 빈도·연령별 배율,
             내부 식단에서 모은 제품명(브랜드) 단어
빼는 항목의 구조는 docs/DATA.md 에 설명한다. 표준 라이브러리만 쓴다.
"""
import csv, json, os, sys

INTERNAL_SOURCE = "S012"
EXCLUDED_KEYS = {
    "recipes": "메뉴별 재료 1인분 분량 분포 — 내부 조리지침서(S012)에서 산출",
    "templates": "조리법별 재료 구성 템플릿 — 내부 조리지침서(S012)에서 산출",
    "core_index": "레시피 이름 색인 — recipes 의 메뉴 이름 목록",
    "global_qty": "재료별 1인분 분량 분포 — 내부 조리지침서(S012)에서 산출",
    "segments": "연령·기관별 분량 배율 — 대부분 내부 조리지침서(S012)에서 산출",
    "complete_segments": "segments 와 짝을 이루는 목록",
    "corpus": "메뉴 사용 빈도·기관별 배출 분포 — 내부 식단표(S012)에서 산출",
    "meta": "내부 빌드 정보(건수·버전) — 공개판 목록은 MANIFEST.json 으로 대신함",
}


def dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def write_csv(path, header, rows):
    # 엑셀에서 한글이 깨지지 않도록 BOM(utf-8-sig)을 붙인다
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def main(payload_path, out):
    P = json.load(open(payload_path, encoding="utf-8"))
    unknown = set(P) - set(EXCLUDED_KEYS) - {"factors", "parameters", "sources", "rules", "tokens", "alias", "methods", "std_category"}
    if unknown:
        raise SystemExit(f"[export] 분류되지 않은 데이터 항목이 있어요: {sorted(unknown)} — 공개 여부를 먼저 정하세요")
    os.makedirs(os.path.join(out, "dictionary"), exist_ok=True)

    # 배출계수
    factors = P["factors"]
    for k, f in factors.items():
        if INTERNAL_SOURCE in f.get("sources", []):
            raise SystemExit(f"[export] 배출계수 '{k}'에 내부 출처가 섞여 있어요")
    dump(os.path.join(out, "emission_factors.json"), factors)
    stages = ["luc", "farm", "feed", "processing", "transport", "retail", "packaging", "losses", "disposal"]
    write_csv(os.path.join(out, "emission_factors.csv"),
              ["재료(std)", "분류", "총계_kgCO2e_per_kg"] + [f"단계_{s}" for s in stages] + ["품질", "sigma", "출처", "근거", "비고"],
              [[k, f.get("category"), f.get("total")] + [f.get("stages", {}).get(s) for s in stages] +
               [f.get("quality"), f.get("sigma"), ";".join(f.get("sources", [])), f.get("basis", ""), f.get("note", "")]
               for k, f in factors.items()])

    # 계산 파라미터
    params = P["parameters"]
    for k, p in params.items():
        if p.get("src") == INTERNAL_SOURCE:
            raise SystemExit(f"[export] 파라미터 '{k}'가 내부 출처예요")
    dump(os.path.join(out, "parameters.json"), params)
    write_csv(os.path.join(out, "parameters.csv"), ["이름", "값", "단위", "출처", "품질", "sigma", "비고"],
              [[k, json.dumps(p.get("value"), ensure_ascii=False) if isinstance(p.get("value"), (dict, list)) else p.get("value"),
                p.get("unit", ""), p.get("src", ""), p.get("quality", ""), p.get("sigma", ""), p.get("note", "")] for k, p in params.items()])

    # 출처 목록: 내부 자료는 '무엇이었는지'만 남기고 비공개로 표시
    sources = {}
    for k, s in P["sources"].items():
        if k == INTERNAL_SOURCE:
            sources[k] = {"source_id": k, "title": "급식회사 내부 조리지침서(비공개)", "publisher": "비공개", "url": "",
                          "license": "비공개 — 이 저장소의 공개 데이터에는 포함하지 않음",
                          "note": "레시피 분량 분포·템플릿·메뉴 빈도·연령별 배율을 만드는 데 쓰였고, 해당 데이터는 공개하지 않습니다."}
        else:
            sources[k] = s
    dump(os.path.join(out, "sources.json"), sources)
    write_csv(os.path.join(out, "sources.csv"), ["id", "제목", "발행처", "URL", "연도", "확인일", "라이선스·이용조건", "범위", "지역", "비고"],
              [[k, s.get("title", ""), s.get("publisher", ""), s.get("url", ""), s.get("year", ""), s.get("accessed", ""),
                s.get("license", ""), s.get("boundary", ""), s.get("region", ""), s.get("note", "")] for k, s in sources.items()])

    # 메뉴 이름 해석 규칙과 사전
    tokens = [t for t in P["tokens"] if t[1] != "제품명"]
    dropped = len(P["tokens"]) - len(tokens)
    dump(os.path.join(out, "dictionary", "tokens.json"), tokens)
    for key in ("alias", "methods", "std_category", "rules"):
        dump(os.path.join(out, "dictionary", f"{key}.json"), P[key])

    manifest = {
        "설명": "지구를 지키는 점심 선택 — 공개 데이터 목록. 자세한 설명은 docs/DATA.md",
        "라이선스": "CC BY 4.0 (각 출처 자료의 이용 조건은 sources.json 참고)",
        "공개": {
            "emission_factors.json": f"재료 {len(factors)}종의 1kg당 배출계수(단계별)",
            "parameters.json": f"계산 파라미터 {len(params)}개",
            "sources.json": f"출처 {len(sources)}개(내부 자료 1개는 비공개로 표시)",
            "dictionary/tokens.json": f"메뉴 이름 해석 단어 {len(tokens)}개(제품명 {dropped}개 제외)",
            "dictionary/alias.json": f"재료 동의어 {len(P['alias'])}개",
            "dictionary/methods.json": f"조리법 {len(P['methods'])}개",
            "dictionary/std_category.json": f"재료 분류 {len(P['std_category'])}개",
            "dictionary/rules.json": "메뉴 해석 규칙",
        },
        "제외": EXCLUDED_KEYS | {"tokens(제품명)": f"내부 식단에서 모은 브랜드·제품명 단어 {dropped}개"},
    }
    dump(os.path.join(out, "MANIFEST.json"), manifest)
    print(f"[export] {out} — 배출계수 {len(factors)}, 파라미터 {len(params)}, 출처 {len(sources)}, 단어 {len(tokens)}(제품명 {dropped} 제외)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("사용법: python3 tools/export_public_data.py build/payload.json data/")
    main(sys.argv[1], sys.argv[2])
