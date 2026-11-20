// 星ごとの譜面解析（主旋律+伴奏の合成）と1周スコアの自動検出

function findMusicForStar(starIndex0) {
  const musics = Array.isArray(songData?.musics) ? songData.musics : [];
  const targetId = starIndex0 + 1;
  return musics.find((m) => Number(m?.id) === targetId) || musics[starIndex0] || null;
}

function getStarParams(starIndex0) {
  const cfg = starInputs[starIndex0];
  const m = findMusicForStar(starIndex0);

  const autoBpm = m?.bpm ?? songData?.baseBpm ?? null;
  const autoBb = m?.baseBeats ?? null;

  const manualBpm = parseFloat(cfg.bpmEl.value);
  const manualBb = parseFloat(cfg.bbEl.value);

  const effectiveBpm = !isNaN(manualBpm) && manualBpm > 0
    ? manualBpm
    : (autoBpm !== null && !isNaN(parseFloat(autoBpm)) ? parseFloat(autoBpm) : NaN);

  const effectiveBb = !isNaN(manualBb) && manualBb > 0
    ? manualBb
    : (autoBb !== null && !isNaN(parseFloat(autoBb)) ? parseFloat(autoBb) : 0.25);

  return { autoBpm, autoBb, effectiveBpm, effectiveBb, music: m };
}

function calculateSingleStar(starIndex0) {
  const { music, effectiveBb } = getStarParams(starIndex0);
  const scores = Array.isArray(music?.scores) ? music.scores : [];

  const track0 = buildBeatTrack(scores[0] || "", effectiveBb);
  const track1 = buildBeatTrack(scores[1] || "", effectiveBb);

  const step0 = track0.step;
  const step1 = track1.step;
  const beat0 = track0.beat;
  const beat1 = track1.beat;

  const mainSoundMap = new Map();
  const mainBlankStepUnits = new Set();
  let singleCount = 0;
  let longCount = 0;
  let specialCount = 0;

  for (let i = 0; i < track0.events.length; i++) {
    const ev = track0.events[i];
    if (beat0[i] === -1 || ev.isRest) {
      mainBlankStepUnits.add(ev.stepUnits32);
    } else {
      const prev = mainSoundMap.get(ev.stepUnits32);
      if (!prev || ev.score > prev.score) {
        mainSoundMap.set(ev.stepUnits32, ev);
      }
    }
  }

  const subSoundMap = new Map();
  for (let i = 0; i < track1.events.length; i++) {
    const ev = track1.events[i];
    if (beat1[i] !== -1 && !ev.isRest) {
      const prev = subSoundMap.get(ev.stepUnits32);
      if (!prev || ev.score > prev.score) {
        subSoundMap.set(ev.stepUnits32, ev);
      }
    }
  }

  const targetStepUnits = new Set(mainSoundMap.keys());
  for (const subStepUnit of subSoundMap.keys()) {
    if (mainBlankStepUnits.has(subStepUnit)) {
      targetStepUnits.add(subStepUnit);
    }
  }

  const sortedStepUnits = [...targetStepUnits].sort((a, b) => a - b);

  let starScore = 0;
  const steps = [];
  const W = { single: 0, long: 0, special: 0 };

  for (const su of sortedStepUnits) {
    const m0 = mainSoundMap.get(su) || null;
    const m1 = mainBlankStepUnits.has(su) ? (subSoundMap.get(su) || null) : null;

    let chosen = null;
    if (m0 && m1) {
      chosen = m1.score > m0.score ? m1 : m0;
    } else if (m0) {
      chosen = m0;
    } else if (m1) {
      chosen = m1;
    }

    const gained = chosen ? chosen.score : 0;
    starScore += gained;

    if (chosen?.cat === "long") longCount += 1;
    else if (chosen?.cat === "special") specialCount += 1;
    else if (chosen?.cat === "single") singleCount += 1;

    if (chosen?.cat && chosen.w > 0) {
      W[chosen.cat] += chosen.w;
    }
    steps.push({
      stepBeats: chosen?.stepBeats || effectiveBb,
      w: chosen?.w || 0
    });
  }

  return {
    score: Math.round(starScore * 1e6) / 1e6,
    step0,
    step1,
    beat0,
    beat1,
    singleCount,
    longCount,
    specialCount,
    steps,
    W
  };
}

function calculateAllStarsLoopScore() {
  let total = 0;
  const starDetails = [];
  for (let s = 0; s < 3; s++) {
    const res = calculateSingleStar(s);
    total += res.score;
    starDetails.push({ star: s + 1, ...res });
  }
  return {
    totalScore: Math.round(total * 1e6) / 1e6,
    starDetails
  };
}

function syncLoopScore(force = false) {
  const detected = calculateAllStarsLoopScore();
  if (force || !isManualLoopScoreOverride) {
    loopScoreInput.value = detected.totalScore;
  }
  loopScoreBadge.textContent = isManualLoopScoreOverride
    ? `(Manual / Score: ${detected.totalScore})`
    : `(Score: ${detected.totalScore})`;
}
