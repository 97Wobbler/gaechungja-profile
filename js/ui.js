export function setupUI({ onGenerate, onDownload }) {
  const genBtn = document.getElementById("generateBtn");
  const dlBtn = document.getElementById("downloadBtn");
  if (genBtn) genBtn.addEventListener("click", onGenerate);
  if (dlBtn) dlBtn.addEventListener("click", onDownload);
}
