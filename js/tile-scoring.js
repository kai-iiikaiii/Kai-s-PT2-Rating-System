// タイル1個ぶんのスコア（シングル/ロング/スペシャル）の計算

function getBbUnits32(baseBeats) {
  const bb = parseFloat(baseBeats);
  const safeBb = !isNaN(bb) && bb > 0 ? bb : 0.25;
  return Math.max(1, Math.round(safeBb * BEAT_SCALE));
}

function formatStepValue(stepUnits32, bbUnits32) {
  return Math.round((stepUnits32 / bbUnits32) * 1e6) / 1e6;
}

function ceilBeatLength(beats, baseBeats) {
  if (!beats || beats <= 0 || !baseBeats || baseBeats <= 0) return 1;
  return Math.max(1, Math.ceil((beats / baseBeats) - 1e-9));
}

function sumTileBeats(text) {
  let total = 0;
  const re = /\[([H-P]+)\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    for (const ch of m[1]) total += TILE_BEATS[ch] || 0;
  }
  return total;
}

// 単一ノーツ: 長さ l = ceil(beats / baseBeats); l > 1 は l + 1（走査には非影響）
function calcSingleOrLongScore(beats, baseBeats) {
  if (!beats || beats <= 0 || !baseBeats || baseBeats <= 0) {
    return { score: 0, length: 0, isLong: false };
  }
  const length = ceilBeatLength(beats, baseBeats);
  if (length <= 1) return { score: 1, length, isLong: false };
  return { score: length + 1, length, isLong: true };
}

// スペシャルタイル 2..10<...> の加点算出
function calcSpecialTileScore(kind, innerStr, baseBeats) {
  const parts = (innerStr || "").split(",").map((s) => s.trim()).filter(Boolean);
  const items = parts.map((part) => {
    const beats = sumTileBeats(part);
    const effectiveBeats = beats > 0 ? beats : baseBeats;
    const length = ceilBeatLength(effectiveBeats, baseBeats);
    const isLong = length > 1;
    const longScore = isLong ? length + 1 : 1;
    return { part, beats: effectiveBeats, length, isLong, longScore };
  });

  const totalBeats = items.reduce((sum, it) => sum + it.beats, 0);
  const totalLength = totalBeats > 0 ? ceilBeatLength(totalBeats, baseBeats) : 1;

  switch (kind) {
    case 2:
      return 1;
    case 3: {
      // コンボタイル: コンボ数 - 1 のロング
      const comboLongLen = Math.max(1, items.length - 1);
      return comboLongLen > 1 ? comboLongLen + 1 : 1;
    }
    case 5:
      // ダブルタイル: 中のタイル1個につき4点（全体の長さが1以下なら1つのダブルタイル）
      return totalLength > 1 ? items.length * 4 : 4;
    case 6:
    case 7: // スライダー: ロング
    case 8: // スライダー: ロング
    case 9: // 伴奏: ロング
      return totalLength > 1 ? totalLength + 1 : 1;
    case 10:
      // バースト: +1
      return 1;
    default:
      return items.reduce((sum, it) => sum + it.longScore, 0);
  }
}
