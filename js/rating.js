// Singles / Longs / Specials / Stamina と総合レーティングの計算・表示

const RATING_IDS = ["ratingOverall", "rSingles", "rLongs", "rSpecials", "rStamina"];

function setRatingVisibility() {
  const loaded = !!songData;
  document.getElementById("ratingBody").hidden = !loaded;
  document.getElementById("ratingHint").hidden = loaded;
}

function clearRatings() {
  RATING_IDS.forEach((id) => {
    const el = document.getElementById(id);
    el.textContent = "-";
    el.style.color = "";
  });
  document.getElementById("ratingTime").textContent = "";
  setRatingVisibility();
}

function updateRatings(rows, finalRow, loopScore) {
  const stars = [0, 1, 2].map(calculateSingleStar);
  const W = { single: 0, long: 0, special: 0 };
  stars.forEach((s) => { for (const k in W) W[k] += s.W[k]; });

  const r = {
    Singles: RATING.K.single * (W.single / loopScore) * finalRow.tps,
    Longs: RATING.K.long * (W.long / loopScore) * finalRow.tps,
    Specials: RATING.K.special * (W.special / loopScore) * finalRow.tps
  };

  let F = 0, t = 0, peak = 0;
  for (const row of rows) {
    let secs = 0;
    for (const st of stars[row.idx % 3].steps) {
      F += st.w;
      const s = (F / RATING.TAU) * (1 + RATING.GAMMA * Math.log(1 + t / RATING.T0));
      if (s > peak) peak = s;
      const dt = st.stepBeats * 60 / row.bpm;
      F *= Math.exp(-dt / RATING.TAU);
      t += dt;
      secs += dt;
    }
    row.time = secs;
  }
  r.Stamina = RATING.K.stamina * peak;

  const lastLap = Math.floor(finalRow.idx / 3);
  const lapTime = rows
    .filter((x) => Math.floor(x.idx / 3) === lastLap)
    .reduce((a, x) => a + x.time, 0);
  document.getElementById("ratingTime").textContent =
    `Play time: ${t.toFixed(1)} s | Lap ${lastLap + 1} time: ${lapTime.toFixed(1)} s`;

  const overall = Math.pow(
    Object.values(r).reduce((a, v) => a + Math.pow(v, RATING.P), 0),
    1 / RATING.P
  );

  applyRatingValue("rSingles", r.Singles);
  applyRatingValue("rLongs", r.Longs);
  applyRatingValue("rSpecials", r.Specials);
  applyRatingValue("rStamina", r.Stamina);
  applyRatingValue("ratingOverall", overall);
}
