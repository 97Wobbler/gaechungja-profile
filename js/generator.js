export function pickIndexWithWeights(layerWeights, length) {
  if (Array.isArray(layerWeights) && layerWeights.length === length) {
    const total = layerWeights.reduce(
      (sum, w) => sum + (Number.isFinite(w) ? Math.max(0, w) : 0),
      0
    );
    if (total <= 0) return Math.floor(Math.random() * length);
    let r = Math.random() * total;
    for (let i = 0; i < layerWeights.length; i++) {
      const w = Number.isFinite(layerWeights[i])
        ? Math.max(0, layerWeights[i])
        : 0;
      r -= w;
      if (r < 0) return i;
    }
    return layerWeights.length - 1;
  }
  return Math.floor(Math.random() * length);
}
