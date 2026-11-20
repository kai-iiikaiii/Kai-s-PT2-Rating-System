// ビート表（タイル/スペース文字 → 拍数、32分音符単位の整数表）

const TILE_BEATS = {
  H: 8, I: 4, J: 2, K: 1, L: 0.5, M: 0.25, N: 0.125, O: 0.0625, P: 0.03125
};

const SPACE_BEATS = {
  Q: 8, R: 4, S: 2, T: 1, U: 0.5, V: 0.25, W: 0.125, X: 0.0625, Y: 0.03125
};

const BEAT_SCALE = 32;

const TILE_UNITS_32 = {
  H: 256, I: 128, J: 64, K: 32, L: 16, M: 8, N: 4, O: 2, P: 1
};

const SPACE_UNITS_32 = {
  Q: 256, R: 128, S: 64, T: 32, U: 16, V: 8, W: 4, X: 2, Y: 1
};
