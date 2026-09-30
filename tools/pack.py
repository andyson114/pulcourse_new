#!/usr/bin/env python3
"""unpack.py 로 푼 조각을 다시 단일 파일 index.html 로 묶는다.

사용법:  python3 tools/pack.py build/ index.html
         python3 tools/pack.py build/ index.html --payload 내_데이터.json   (계산 데이터를 바꿔 끼울 때)
압축은 gzip(최대 압축, 시각 정보 0)으로 해서 같은 조각이면 항상 같은 결과가 나온다.
표준 라이브러리만 쓴다.
"""
import base64, gzip, io, os, re, sys


def gz_b64(text):
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0, compresslevel=9) as g:
        g.write(text.encode("utf-8"))
    return base64.b64encode(buf.getvalue()).decode("ascii")


def read(path, binary=False):
    with open(path, "rb" if binary else "r", **({} if binary else {"encoding": "utf-8", "newline": ""})) as f:
        return f.read()


def main(src, out, payload_path=None):
    html = read(os.path.join(src, "shell.html"))
    payload = read(payload_path or os.path.join(src, "payload.json"))
    parts = {
        "PAYLOAD": gz_b64(payload),
        "CODE": gz_b64(read(os.path.join(src, "app.bundle.js"))),
        "RESTAURANT_SVG": read(os.path.join(src, "restaurant.svg")),
        "ROLEHUB_CSS": read(os.path.join(src, "rolehub.css")),
        "ROLEHUB_JS": read(os.path.join(src, "rolehub.js")),
    }
    for w in ("500", "700", "900"):
        parts[f"F{w}"] = base64.b64encode(read(os.path.join(src, "fonts", f"f{w}.woff2"), True)).decode("ascii")

    for name, value in parts.items():
        marker = f"@@{name}@@"
        if html.count(marker) != 1:
            raise SystemExit(f"[pack] shell.html 에서 {marker} 를 정확히 한 번 찾지 못했어요")
        html = html.replace(marker, value)

    def asset(m):
        rel, mime = m.group(1), m.group(2)
        return f"data:{mime};base64," + base64.b64encode(read(os.path.join(src, rel), True)).decode("ascii")

    html = re.sub(r"@@ASSET:([^|@]+)\|([^@]+)@@", asset, html)
    left = re.findall(r"@@[A-Z_0-9:]+", html)
    if left:
        raise SystemExit(f"[pack] 채우지 못한 표시가 남았어요: {sorted(set(left))[:5]}")
    with open(out, "w", encoding="utf-8", newline="") as f:
        f.write(html)
    print(f"[pack] {src} → {out}  ({len(html.encode('utf-8')) / 1e6:.2f}MB)")


if __name__ == "__main__":
    args = sys.argv[1:]
    payload = None
    if "--payload" in args:
        i = args.index("--payload")
        payload = args[i + 1]
        del args[i:i + 2]
    if len(args) != 2:
        raise SystemExit("사용법: python3 tools/pack.py build/ index.html [--payload 데이터.json]")
    main(args[0], args[1], payload)
