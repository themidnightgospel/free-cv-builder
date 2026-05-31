#!/usr/bin/env bash
# Record a README demo video by running the dedicated Playwright spec and
# converting the resulting .webm into MP4 + GIF that can be embedded in the
# README. Requires ffmpeg on PATH.
set -euo pipefail

DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$DEMO_DIR/.." && pwd)"
cd "$ROOT_DIR"

OUTPUT_DIR="$DEMO_DIR"

echo "==> Running Playwright demo spec"
rm -rf test-results
npx playwright test --config=demo/playwright.config.ts

WEBM_PATH="$(find test-results -name 'video.webm' -type f -print -quit)"
if [[ -z "${WEBM_PATH}" ]]; then
  echo "ERROR: no video.webm produced under test-results/." >&2
  exit 1
fi
echo "==> Captured: ${WEBM_PATH}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found on PATH. Install it (e.g. 'choco install ffmpeg' or 'winget install ffmpeg') and re-run." >&2
  echo "Raw webm left at: ${WEBM_PATH}" >&2
  exit 1
fi

MP4_PATH="${OUTPUT_DIR}/demo.mp4"
GIF_PATH="${OUTPUT_DIR}/demo.gif"
PALETTE_PATH="${OUTPUT_DIR}/demo-palette.png"

echo "==> Encoding MP4 -> ${MP4_PATH}"
ffmpeg -y -i "$WEBM_PATH" \
  -vf "scale=900:-2:flags=lanczos,fps=20" \
  -c:v libx264 -crf 23 -pix_fmt yuv420p -movflags +faststart \
  -an "$MP4_PATH"

echo "==> Building palette for GIF"
ffmpeg -y -i "$WEBM_PATH" \
  -vf "fps=15,scale=900:-2:flags=lanczos,palettegen=stats_mode=diff" \
  "$PALETTE_PATH"

echo "==> Encoding GIF -> ${GIF_PATH}"
ffmpeg -y -i "$WEBM_PATH" -i "$PALETTE_PATH" \
  -filter_complex "fps=15,scale=900:-2:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a" \
  "$GIF_PATH"

rm -f "$PALETTE_PATH"

echo
echo "Done."
echo "  MP4: ${MP4_PATH}"
echo "  GIF: ${GIF_PATH}"
echo
echo "Embed in README.md, e.g.:"
echo "  ![demo](demo/demo.gif)"
echo "  or"
echo "  <video src=\"demo/demo.mp4\" controls autoplay muted loop></video>"
