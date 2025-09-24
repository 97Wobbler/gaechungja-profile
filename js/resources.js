export async function loadResources() {
  const res = await fetch("assets/data/resources.json", { cache: "no-cache" });
  const json = await res.json();
  const parts = json?.parts || {};

  const toWeights = (arr) =>
    Array.isArray(arr) ? arr.map((x) => Number(x?.possibility ?? 1) || 0) : [];
  const weights = {
    skin: parts.skin ? toWeights(parts.skin) : [],
    face: parts.face ? toWeights(parts.face) : [],
    face2: parts.face2 ? toWeights(parts.face2) : [],
    hair: parts.hair ? toWeights(parts.hair) : [],
  };
  const keys = {
    skin: (parts.skin || []).map((x) => x.key),
    face: (parts.face || []).map((x) => x.key),
    face2: (parts.face2 || []).map((x) => x.key),
    hair: (parts.hair || []).map((x) => x.key),
  };

  return { resourceData: json, weights, keys };
}
