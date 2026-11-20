// レーティング式の定数と重み関数（ここを書き換えて調整）

const RATING = {
  RHO: 0.5,
  BETA: 0.3,
  TAU: 20,
  GAMMA: 0.3,
  T0: 60,
  P: 3,
  K: { single: 1, long: 1, special: 1, stamina: 1 },
  OMEGA: { 2: 1, 3: 1, 5: 1, 6: 1.2, 7: 1.5, 8: 1.5, 9: 1, 10: 1.3 }
};

function longWeight(L) {
  return 1 + RATING.RHO + RATING.BETA * Math.log(Math.max(1, L));
}

function specialWeight(kind, score) {
  if (!(score > 0)) return 0;
  const om = RATING.OMEGA[kind] ?? 1;
  const longLike = (kind >= 6 && kind <= 9) || (kind === 2 && score > 1);
  return om * (longLike ? longWeight(score - 1) : score);
}
