#!/usr/bin/env python3
"""두 index.html 이 내용상 같은지 확인한다(압축을 풀어 조각별로 비교).

사용법:  python3 tools/verify.py 원본.html 다시묶은.html
gzip 압축 바이트는 도구마다 달라질 수 있으므로, 압축을 푼 데이터·코드와 나머지 HTML 을 비교한다.
표준 라이브러리만 쓴다.
"""
import os, sys, tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import unpack  # noqa: E402


def parts(path):
    # 비교가 끝나면 임시 폴더(계산 데이터 포함)를 바로 지운다
    with tempfile.TemporaryDirectory(prefix="verify-") as d:
        unpack.main(path, d)
        out = {}
        for root, _, names in os.walk(d):
            for n in names:
                if n == "manifest.json":
                    continue
                p = os.path.join(root, n)
                with open(p, "rb") as f:
                    out[os.path.relpath(p, d)] = f.read()
    return out


def main(a, b):
    pa, pb = parts(a), parts(b)
    bad = [k for k in sorted(set(pa) | set(pb)) if pa.get(k) != pb.get(k)]
    if bad:
        print("[verify] 다른 조각:", ", ".join(bad))
        raise SystemExit(1)
    print(f"[verify] 같음 — 조각 {len(pa)}개 모두 일치")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("사용법: python3 tools/verify.py 원본.html 다시묶은.html")
    main(sys.argv[1], sys.argv[2])
