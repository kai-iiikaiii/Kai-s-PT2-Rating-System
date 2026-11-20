// 周回ごとのBPM上昇（TPSの計算）

function getNewBpm(lastBpm, lastBeats, currentBeats, loopTimes) {
  const tpm = lastBpm / lastBeats;
  const constant = loopTimes < 3 ? 100 : 130;
  const factor = Math.max(1.3 - (tpm - constant) * 0.001, 1.04);
  return Math.trunc(factor * tpm * currentBeats);
}
