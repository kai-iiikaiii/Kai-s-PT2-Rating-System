// song.json の読み込みと、入力欄のイベント登録

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => { dropZone.classList.remove("dragover"); });
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files[0]) loadJsonFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) loadJsonFile(e.target.files[0]);
});

loopScoreInput.addEventListener("input", () => {
  isManualLoopScoreOverride = loopScoreInput.value.trim() !== "";
  calculate();
});

starInputs.forEach((cfg) => {
  cfg.bpmEl.addEventListener("input", calculate);
  cfg.bbEl.addEventListener("input", () => {
    if (!isManualLoopScoreOverride) syncLoopScore(true);
    calculate();
  });
});

scoreInput.addEventListener("input", calculate);
scoreInput.addEventListener("change", calculate);

function loadJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      songData = JSON.parse(reader.result);
      isManualLoopScoreOverride = false;
      starInputs.forEach((cfg) => {
        cfg.bpmEl.value = "";
        cfg.bbEl.value = "";
      });
      fileLabel.innerHTML = `Loaded! : <strong>${escapeHtml(file.name)}</strong>`;
      errorOutput.textContent = "";
      syncLoopScore(true);
      calculate();
    } catch (err) {
      songData = null;
      setRatingVisibility();
      errorOutput.textContent = "Failed to analyze JSON: " + err.message;
    }
  };
  reader.readAsText(file, "UTF-8");
}
