// 最終TPSと「TPS rising table」の計算・描画

function calculate() {
  errorOutput.textContent = "";
  stepTableBody.innerHTML = "";
  lapBreakdownBody.innerHTML = "";
  clearRatings();

  const paramsList = [0, 1, 2].map((idx) => {
    const p = getStarParams(idx);
    const cfg = starInputs[idx];
    const bpmText = p.autoBpm !== null ? p.autoBpm : "-";
    cfg.badgeEl.textContent = `Detect: ${bpmText}`;
    cfg.bpmEl.placeholder = p.autoBpm !== null ? `Detect: ${p.autoBpm}` : "Example: 100";
    cfg.bbEl.placeholder = p.autoBb !== null ? `Detect: ${p.autoBb}` : "Example: 0.25";
    return p;
  });

  const detected = calculateAllStarsLoopScore();
  for (const d of detected.starDetails) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>★${d.star}</td>` +
      `<td>${d.singleCount} / ${d.longCount} / ${d.specialCount}</td>` +
      `<td><strong>${d.score}</strong></td>`;
    lapBreakdownBody.appendChild(tr);
  }

  const loopScore = parseFloat(loopScoreInput.value);
  const score = parseFloat(scoreInput.value);

  loopScoreBadge.textContent = isManualLoopScoreOverride
    ? `(Manual: ${loopScore} / Score: ${detected.totalScore})`
    : `(Score: ${detected.totalScore})`;

  const primary = paramsList.find((p) => !isNaN(p.effectiveBpm) && p.effectiveBpm > 0 && p.effectiveBb > 0);
  if (!primary) {
    tpsOutput.textContent = "-";
    metaOutput.textContent = "-";
    return;
  }
  if (isNaN(loopScore) || loopScore <= 0 || isNaN(score) || score <= 0) {
    tpsOutput.textContent = "-";
    metaOutput.textContent = "Please enter a number more than 0 for the score per lap and the final score.";
    return;
  }

  const loopSize = 3;
  const loopIndex0 = Math.floor((score - 1e-9) / loopScore);
  const inLoopProgress = Math.min(0.999999, Math.max(0, (score - loopIndex0 * loopScore) / loopScore));
  const sectionInLoop = Math.min(loopSize - 1, Math.floor(inLoopProgress * loopSize));
  const targetRowIndex = loopIndex0 * loopSize + sectionInLoop;

  const rows = [];
  for (let idx = 0; idx <= targetRowIndex; idx++) {
    const starIdx = idx % loopSize;
    const starP = paramsList[starIdx];
    const stepBb = (starP && starP.effectiveBb > 0) ? starP.effectiveBb : primary.effectiveBb;
    const stepInitBpm = (starP && !isNaN(starP.effectiveBpm) && starP.effectiveBpm > 0)
      ? Math.trunc(starP.effectiveBpm)
      : Math.trunc(primary.effectiveBpm);

    let bpm;
    if (idx < loopSize) {
      bpm = stepInitBpm;
    } else {
      const prev = rows[idx - 1];
      const loopTimes = Math.floor(idx / loopSize);
      bpm = getNewBpm(prev.bpm, prev.beats, stepBb, loopTimes);
    }

    const tps = bpm / stepBb / 60;
    const startScore = Number((idx * (loopScore / loopSize)).toFixed(2));
    rows.push({
      idx,
      label: `${Math.floor(idx / loopSize) + 1}-${starIdx + 1} (★${starIdx + 1})`,
      startScore,
      bpm,
      beats: stepBb,
      tps
    });
  }

  const finalRow = rows[rows.length - 1];
  updateRatings(rows, finalRow, loopScore);
  tpsOutput.textContent = `${finalRow.tps.toFixed(3)} TPS`;
  metaOutput.textContent =
    `Score: ${loopScore} | Laps: ${finalRow.label} | ` +
    `BPM: ${finalRow.bpm} | BB: ${finalRow.beats}`;

  for (const r of rows) {
    const tr = document.createElement("tr");
    if (r.idx === finalRow.idx) tr.className = "reached";
    tr.innerHTML =
      `<td>${escapeHtml(r.label)}</td>` +
      `<td>${r.startScore}</td>` +
      `<td>${r.bpm}</td>` +
      `<td>${r.beats}</td>` +
      `<td>${r.tps.toFixed(3)}</td>` +
      `<td>${(r.time ?? 0).toFixed(1)}</td>`;
    stepTableBody.appendChild(tr);
  }
}
