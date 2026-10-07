#!/usr/bin/env bash
set -euo pipefail

# Source, settings and annotations are never modified by this optimization.
BASE="public/assets/exterior/382a1520"
OUT="$BASE/demo-900k/index.sog"
PLY="/tmp/tdn-exterior-demo-900k.ply"
SCRATCH="/tmp/tdn-sog-scratch"
mkdir -p "$(dirname "$OUT")" "$SCRATCH"

echo "Source: $BASE/v1/meta.json (5,900,547 Gaussian splats)"
echo "Target: 900,000 Gaussian splats, native bundled SOG"
# Adaptive error-based merging. On memory-constrained hosted runners, use the
# uniform decimator; if necessary, use the already-authored 737,568-splat LOD.
if timeout --signal=TERM --kill-after=5s 900s splat-transform -g cpu \
    "$BASE/v1/meta.json" --scratch-dir "$SCRATCH" --decimate-adaptive 900000 "$PLY"; then
  echo "Algorithm: adaptive decimation"
elif timeout --signal=TERM --kill-after=5s 600s splat-transform -g cpu \
    "$BASE/v1/meta.json" --scratch-dir "$SCRATCH" --decimate 900000 "$PLY"; then
  echo "Algorithm: uniform decimation"
else
  echo "Adaptive and uniform conversion unavailable; using existing 737,568-splat LOD."
  rm -f "$PLY"
  timeout --signal=TERM --kill-after=5s 420s splat-transform -g cpu \
    "$BASE/v1-streamed/lod-meta.json" --select-lod 3 "$PLY"
fi

test -s "$PLY"
timeout --signal=TERM --kill-after=5s 1200s splat-transform -g cpu \
  --max-workers 2 --sh-iterations 4 "$PLY" "$OUT"
test -s "$OUT"
echo "Reduced SOG size: $(du -h "$OUT" | cut -f 1)"

# Validate that SplatTransform can read its own output before changing the live viewer.
timeout --signal=TERM --kill-after=5s 240s splat-transform -g cpu "$OUT" --info null
mkdir -p "docs/assets/exterior/382a1520/demo-900k"
cp "$OUT" "docs/assets/exterior/382a1520/demo-900k/index.sog"

python3 - <<'PY'
from pathlib import Path
old = 'assets/exterior/382a1520/v1-streamed/lod-meta.json'
new = 'assets/exterior/382a1520/demo-900k/index.sog'
for root in ('public', 'docs'):
    loader = Path(root) / 'ui/cover.js'
    text = loader.read_text(encoding='utf-8')
    assert text.count(old) == 1, f'{loader}: source reference missing'
    assert "url.searchParams.set('budget'," not in text, f'{loader}: budget already set'
    text = text.replace(old, new)
    anchor = "  url.searchParams.set('bg',"
    assert text.count(anchor) == 1, f'{loader}: no viewer budget anchor'
    text = text.replace(anchor, "  url.searchParams.set('budget', '0.9');\n" + anchor)
    loader.write_text(text, encoding='utf-8')

    html = Path(root) / 'index.html'
    text = html.read_text(encoding='utf-8')
    before = 'ui/cover.js?v=normalized-picker-1'
    after = 'ui/cover.js?v=demo-sog-900k-1'
    assert text.count(before) == 1, f'{html}: cache URL changed'
    html.write_text(text.replace(before, after), encoding='utf-8')

assert (Path('public') / new).is_file()
print('Viewer switched to reduced SOG; annotations/settings unchanged.')
PY
