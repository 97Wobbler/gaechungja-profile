export const RANK_SCORE = {
  SSSS: 13,
  SSS: 11,
  SS: 9.5,
  S: 8,
  A: 5.5,
  B: 3.5,
  C: 1,
};

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
  if (score >= RANK_SCORE.SSSS) return "SSSS";
  if (score >= RANK_SCORE.SSS) return "SSS";
  if (score >= RANK_SCORE.SS) return "SS";
  if (score >= RANK_SCORE.S) return "S";
  if (score >= RANK_SCORE.A) return "A";
  if (score >= RANK_SCORE.B) return "B";
  if (score >= RANK_SCORE.C) return "C";
  return "N";
}
