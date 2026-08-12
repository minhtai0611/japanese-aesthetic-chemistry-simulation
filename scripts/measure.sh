#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://japanese-aesthetic-chemistry-simula.vercel.app}"
OUT="docs/metrics-raw.txt"
: > "$OUT"

echo "=== Đo lúc $(date -Iseconds) · base=$BASE ===" | tee -a "$OUT"

echo "--- HTML (nén / thô) ---" | tee -a "$OUT"
for u in / /periodic-table /compound /compound/caffeine /element/au /experiments/phase-change; do
  n=$(curl -s -H 'Accept-Encoding: br,gzip' -o /dev/null -w '%{size_download}' "$BASE$u")
  t=$(curl -s -o /dev/null -w '%{size_download}' "$BASE$u")
  printf "%-28s nen=%-8s tho=%s\n" "$u" "$n" "$t" | tee -a "$OUT"
done

echo "--- Header cache ---" | tee -a "$OUT"
for u in / /periodic-table /compound/caffeine /element/au /compound/chlorophyll-a; do
  h=$(curl -sI "$BASE$u" | grep -iE 'x-vercel-cache|x-nextjs-prerender|^HTTP' | tr -d '\r' | tr '\n' ' ')
  printf "%-28s %s\n" "$u" "$h" | tee -a "$OUT"
done

echo "--- TTFB (20 lần, /compound/caffeine) ---" | tee -a "$OUT"
for i in $(seq 1 20); do curl -s -o /dev/null -w '%{time_total}\n' "$BASE/compound/caffeine"; done \
  | sort -n | awk '{a[NR]=$1} END {printf "p50=%.3fs p95=%.3fs\n", a[int(NR*0.5)], a[int(NR*0.95)]}' | tee -a "$OUT"

echo "--- JS + CSS + FONT trang chủ (nén) ---" | tee -a "$OUT"
curl -s "$BASE/" -o /tmp/_k.html
js=0; n=0
for j in $(grep -oE '/_next/static/[^"]+\.js' /tmp/_k.html | sort -u); do
  s=$(curl -s -H 'Accept-Encoding: br,gzip' -o /dev/null -w '%{size_download}' "$BASE$j"); js=$((js+s)); n=$((n+1))
done
css=0
for c in $(grep -oE '/_next/static/[^"]+\.css' /tmp/_k.html | sort -u); do
  s=$(curl -s -H 'Accept-Encoding: br,gzip' -o /dev/null -w '%{size_download}' "$BASE$c"); css=$((css+s))
done
ft=0; fn=0
for f in $(grep -oE '/_next/static/media/[^"?\\]+\.woff2' /tmp/_k.html | sort -u); do
  s=$(curl -s -o /dev/null -w '%{size_download}' "$BASE$f"); ft=$((ft+s)); fn=$((fn+1))
done
echo "js_chunks=$n js=${js}B css=${css}B fonts=$fn total=${ft}B" | tee -a "$OUT"

echo "--- Bẫy URL (chất gây nghiện trong sản phẩm giáo dục) ---" | tee -a "$OUT"
for w in love sunshine happy gold banana tree; do
  printf "  /compound/%-10s " "$w"; curl -s -o /dev/null -w '%{http_code}\n' "$BASE/compound/$w"
done | tee -a "$OUT"

echo "--- Ranh giới ký tự (binary search U+00FF) ---" | tee -a "$OUT"
for ch in "ú:U+00FA" "ô:U+00F4" "ê:U+00EA" "ă:U+0103" "đ:U+0111" "ơ:U+01A1" "ư:U+01B0" "ố:U+1ED1"; do
  c="${ch%%:*}"; cp="${ch##*:}"
  enc=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote('nu'+sys.argv[1]+'oc'))" "$c")
  printf "  %s %-8s → " "$c" "$cp"; curl -s -o /dev/null -w '%{http_code}\n' "$BASE/compound/$enc"
done | tee -a "$OUT"

echo "--- Sitemap ---" | tee -a "$OUT"
curl -s "$BASE/sitemap.xml" -o /tmp/_sm.xml
echo "bytes=$(wc -c < /tmp/_sm.xml) urls=$(grep -c '<loc>' /tmp/_sm.xml)" | tee -a "$OUT"
echo "trạng thái từng URL hợp chất trong sitemap:" | tee -a "$OUT"
for u in $(grep -oP '(?<=<loc>)[^<]*compound/[^<]*' /tmp/_sm.xml); do
  printf "  %-90s " "$u"; curl -s -o /dev/null -w '%{http_code}\n' "$u"
done | tee -a "$OUT"

echo "--- npm audit ---" | tee -a "$OUT"
npm audit --package-lock-only 2>&1 | tail -5 | tee -a "$OUT"
