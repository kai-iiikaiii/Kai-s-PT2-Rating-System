// scores 文字列の分割と、ビート時間軸へのイベント化

// ; , 改行で区切る（<...> の内側のカンマでは区切らない）
function splitScoreTokens(str) {
  if (typeof str !== "string" || !str.trim()) return [];
  const out = [];
  let cur = "";
  let depth = 0;
  for (const ch of str) {
    if (ch === "<") depth++;
    if (ch === ">") depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ";" || ch === "," || ch === "\n")) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((t) => t.trim()).filter(Boolean);
}

function buildBeatTrack(scoreStr, baseBeats) {
  const bbUnits32 = getBbUnits32(baseBeats);
  let stepUnits32 = 0;
  const beat = [];
  const events = [];

  const tokens = splitScoreTokens(scoreStr || "");
  for (const token of tokens) {
    const specialMatch = token.match(/^(2|3|5|6|7|8|9|10)<([^>]*)>$/);
    if (specialMatch) {
      const kind = parseInt(specialMatch[1], 10);
      const inner = specialMatch[2];
      let innerUnits32 = 0;
      const innerRe = /\[([H-P]+)\]/g;
      let im;
      while ((im = innerRe.exec(inner)) !== null) {
        for (const ch of im[1]) innerUnits32 += TILE_UNITS_32[ch] || 0;
      }
      const deltaUnits32 = innerUnits32 > 0 ? innerUnits32 : bbUnits32;
      stepUnits32 += deltaUnits32;
      const stepVal = formatStepValue(stepUnits32, bbUnits32);
      beat.push(stepVal);

      const score = calcSpecialTileScore(kind, inner, baseBeats);
      let cat = "special";
      let w = specialWeight(kind, score);

      if (kind === 3) {
        const parts = (inner || "").split(",").map((s) => s.trim()).filter(Boolean);
        const len = Math.max(1, parts.length - 1);
        if (len > 1) {
          cat = "long";
          w = longWeight(len);
        }
      } else if (kind === 6 || kind === 7 || kind === 8 || kind === 9) {
        const len = score;
        if (len > 1) {
          cat = "long";
          w = longWeight(len);
        }
      }

      events.push({
        stepUnits32,
        step: stepVal,
        isRest: false,
        score,
        cat,
        w,
        stepBeats: baseBeats,
        raw: token
      });
      continue;
    }

    const parts = token.match(/\[[H-P]+\]|[H-Y]/g) || [];
    for (const p of parts) {
      if (p.startsWith("[") && p.endsWith("]")) {
        let noteUnits32 = 0;
        for (const ch of p.slice(1, -1)) noteUnits32 += TILE_UNITS_32[ch] || 0;
        if (noteUnits32 > 0) {
          stepUnits32 += noteUnits32;
          const stepVal = formatStepValue(stepUnits32, bbUnits32);
          beat.push(stepVal);

          const beats = noteUnits32 / BEAT_SCALE;
          const { score, length, isLong } = calcSingleOrLongScore(beats, baseBeats);
          events.push({
            stepUnits32,
            step: stepVal,
            isRest: false,
            score,
            cat: isLong ? "long" : "single",
            w: isLong ? longWeight(length) : 1,
            stepBeats: baseBeats,
            raw: token
          });
        }
      } else if (TILE_UNITS_32[p] !== undefined) {
        const noteUnits32 = TILE_UNITS_32[p];
        stepUnits32 += noteUnits32;
        const stepVal = formatStepValue(stepUnits32, bbUnits32);
        beat.push(stepVal);

        const beats = noteUnits32 / BEAT_SCALE;
        const { score, length, isLong } = calcSingleOrLongScore(beats, baseBeats);
        events.push({
          stepUnits32,
          step: stepVal,
          isRest: false,
          score,
          cat: isLong ? "long" : "single",
          w: isLong ? longWeight(length) : 1,
          stepBeats: baseBeats,
          raw: p
        });
      } else if (SPACE_UNITS_32[p] !== undefined) {
        const spUnits32 = SPACE_UNITS_32[p];
        stepUnits32 += spUnits32;
        beat.push(-1);
        events.push({
          stepUnits32,
          step: formatStepValue(stepUnits32, bbUnits32),
          isRest: true,
          score: 0,
          cat: null,
          w: 0,
          stepBeats: spUnits32 / BEAT_SCALE,
          raw: p
        });
      }
    }
  }

  return {
    step: formatStepValue(stepUnits32, bbUnits32),
    beat,
    events
  };
}
