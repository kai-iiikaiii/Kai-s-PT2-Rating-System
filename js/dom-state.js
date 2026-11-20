// 読み込んだ譜面データの状態と、画面要素（DOM）への参照

let songData = null;
let isManualLoopScoreOverride = false;

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileLabel = document.getElementById("fileLabel");

const starInputs = [
  { id: 1, bpmEl: document.getElementById("bpm1Input"), bbEl: document.getElementById("bb1Input"), badgeEl: document.getElementById("star1AutoBadge") },
  { id: 2, bpmEl: document.getElementById("bpm2Input"), bbEl: document.getElementById("bb2Input"), badgeEl: document.getElementById("star2AutoBadge") },
  { id: 3, bpmEl: document.getElementById("bpm3Input"), bbEl: document.getElementById("bb3Input"), badgeEl: document.getElementById("star3AutoBadge") }
];

const loopScoreInput = document.getElementById("loopScoreInput");
const loopScoreBadge = document.getElementById("loopScoreBadge");
const scoreInput = document.getElementById("scoreInput");
const tpsOutput = document.getElementById("tpsOutput");
const metaOutput = document.getElementById("metaOutput");
const errorOutput = document.getElementById("errorOutput");
const stepTableBody = document.getElementById("stepTableBody");
const lapBreakdownBody = document.getElementById("lapBreakdownBody");
