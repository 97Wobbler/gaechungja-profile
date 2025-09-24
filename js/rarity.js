export function computeRarityScore(resourceData, current) {
  const getScoreFactor = (layerName, index) => {
    if (!resourceData?.parts?.[layerName]) return 1.0;
    const parts = resourceData.parts[layerName];
    if (!parts.length || index >= parts.length) return 1.0;
    return Number.isFinite(parts[index]?.scoreFactor)
      ? parts[index].scoreFactor
      : 1.0;
  };

  const skinScore = getScoreFactor("skin", current.skin);
  const faceScore = getScoreFactor("face", current.face);
  const face2Score = getScoreFactor("face2", current.face2);
  const hairScore = getScoreFactor("hair", current.hair);
  return skinScore + faceScore + face2Score + hairScore;
}

export function scoreToGrade(score) {
  if (score >= 16) return "SSSS";
  if (score >= 13) return "SSS";
  if (score >= 10) return "SS";
  if (score >= 7) return "S";
  if (score >= 5) return "A";
  if (score >= 4) return "B";
  if (score >= 3) return "C";
  return "N";
}
