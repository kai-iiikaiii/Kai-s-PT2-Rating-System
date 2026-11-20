// レーティング値 → 表示色（滑らかなグラデーション）

// Rating 色の基準ストップ: 0=青, 5=緑, 10=黄, 15=オレンジ, 20=赤, 30以上=黒
const RATING_COLOR_STOPS = [
  { value: 0,  rgb: [37, 99, 235] },
  { value: 5,  rgb: [22, 163, 74] },
  { value: 10, rgb: [234, 179, 8] },
  { value: 15, rgb: [249, 115, 22] },
  { value: 20, rgb: [220, 38, 38] },
  { value: 30, rgb: [15, 23, 42] }
];

function getSmoothRatingColor(val) {
  if (typeof val !== "number" || isNaN(val)) return "";
  const v = Math.max(0, val);
  if (v <= RATING_COLOR_STOPS[0].value) {
    const [r, g, b] = RATING_COLOR_STOPS[0].rgb;
    return `rgb(${r}, ${g}, ${b})`;
  }
  for (let i = 0; i < RATING_COLOR_STOPS.length - 1; i++) {
    const a = RATING_COLOR_STOPS[i];
    const b = RATING_COLOR_STOPS[i + 1];
    if (v <= b.value) {
      const t = (v - a.value) / (b.value - a.value);
      const r = Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t);
      const g = Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t);
      const bl = Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t);
      return `rgb(${r}, ${g}, ${bl})`;
    }
  }
  const [r, g, b] = RATING_COLOR_STOPS[RATING_COLOR_STOPS.length - 1].rgb;
  return `rgb(${r}, ${g}, ${b})`;
}

function applyRatingValue(elId, val) {
  const el = document.getElementById(elId);
  if (typeof val !== "number" || isNaN(val)) {
    el.textContent = "-";
    el.style.color = "";
    return;
  }
  el.textContent = val.toFixed(2);
  el.style.color = getSmoothRatingColor(val);
}
