#!/usr/bin/env python3
"""index.html(단일 파일 앱)을 편집 가능한 조각으로 푼다.

사용법:  python3 tools/unpack.py index.html build/
결과(build/):
  shell.html            앱의 뼈대. 큰 덩어리 자리는 @@이름@@ 표시로 남는다
  app.bundle.js         앱 코드(engine + dash + app). 압축을 푼 원문 그대로
  payload.json          계산 데이터(DB). 압축을 푼 원문 그대로
  rolehub.css / .js     사용 목적 선택 화면(첫 화면) 스타일·스크립트
  restaurant.svg        식당 배경 그림(SVG 조각)
  fonts/f500.woff2 …    글꼴(Noto Sans KR 부분 글꼴)
  assets/…              본문에 들어 있던 이미지(data URI)를 파일로 꺼낸 것
  manifest.json         조각 목록과 각 조각의 SHA-256
표준 라이브러리만 쓴다.
"""
import base64, gzip, hashlib, json, os, re, sys

MIME_EXT = {"image/png": "png", "image/webp": "webp", "image/jpeg": "jpg", "image/svg+xml": "svg", "image/gif": "gif"}


def sha(b):
    return hashlib.sha256(b).hexdigest()


def take_block(html, open_re, name):
    """<script|style ...>내용</...> 의 내용을 @@name@@ 으로 바꾸고 내용을 돌려준다."""
    m = re.search(open_re, html)
    if not m:
        raise SystemExit(f"[unpack] '{name}' 블록을 찾지 못했어요")
    tag = m.group(1)
    end = html.index(f"</{tag}>", m.end())
    content = html[m.end():end]
    return html[:m.end()] + f"@@{name}@@" + html[end:], content


def main(src, out):
    html = open(src, encoding="utf-8").read()
    os.makedirs(os.path.join(out, "fonts"), exist_ok=True)
    os.makedirs(os.path.join(out, "assets"), exist_ok=True)
    files = {}

    def write(rel, data):
        path = os.path.join(out, rel)
        mode = "wb" if isinstance(data, bytes) else "w"
        with open(path, mode, **({} if mode == "wb" else {"encoding": "utf-8", "newline": ""})) as f:
            f.write(data)
        files[rel] = sha(data if isinstance(data, bytes) else data.encode("utf-8"))

    # 1) 압축된 데이터·코드 (gzip + base64)
    for bid, rel in (("payload", "payload.json"), ("code", "app.bundle.js")):
        html, b64 = take_block(html, rf'<(script) type="text/plain" id="{bid}">', bid.upper())
        write(rel, gzip.decompress(base64.b64decode(b64.strip())).decode("utf-8"))

    # 2) 글꼴 (base64 woff2)
    for w in ("500", "700", "900"):
        html, b64 = take_block(html, rf'<(script) type="text/plain" id="f{w}"[^>]*>', f"F{w}")
        write(f"fonts/f{w}.woff2", base64.b64decode(b64.strip()))

    # 3) 식당 배경 SVG, 사용 목적 선택 화면(첫 화면)의 스타일·스크립트
    html, svg = take_block(html, r'<(script) type="text/plain" id="restaurant-svg">', "RESTAURANT_SVG")
    write("restaurant.svg", svg)
    html, css = take_block(html, r'<(style) id="role-hub">', "ROLEHUB_CSS")
    write("rolehub.css", css)
    html, js = take_block(html, r'<(script) id="role-hub-js">', "ROLEHUB_JS")
    write("rolehub.js", js)

    # 4) 본문 이미지(data URI) → assets/ (같은 이미지는 한 파일로)
    seen = {}

    def repl(m):
        mime, b64 = m.group(1), m.group(2)
        raw = base64.b64decode(b64)
        key = sha(raw)[:10]
        if key not in seen:
            rel = f"assets/{key}.{MIME_EXT.get(mime, 'bin')}"
            write(rel, raw)
            seen[key] = (rel, mime)
        return f"@@ASSET:{seen[key][0]}|{mime}@@"

    html = re.sub(r"data:(image/[a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)", repl, html)

    write("shell.html", html)
    manifest = {"source": os.path.basename(src), "source_sha256": sha(open(src, "rb").read()), "files": files}
    with open(os.path.join(out, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"[unpack] {src} → {out}  (조각 {len(files)}개, 이미지 {len(seen)}개)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("사용법: python3 tools/unpack.py index.html build/")
    main(sys.argv[1], sys.argv[2])
