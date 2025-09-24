const STORAGE_KEY = "gaechungja_stats_v1";

export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getEmptyStats();
    const parsed = JSON.parse(raw);
    return normalizeStats(parsed);
  } catch (_) {
    return getEmptyStats();
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (_) {}
}

export function increment(stats, grade) {
  stats.total += 1;
  const key = grade?.toUpperCase?.();
  if (key && stats.byGrade[key] !== undefined) {
    stats.byGrade[key] += 1;
  } else {
    stats.byGrade.N += 1;
  }
}

export function getEmptyStats() {
  return {
    total: 0,
    byGrade: {
      SSSS: 0,
      SSS: 0,
      SS: 0,
      S: 0,
      A: 0,
      B: 0,
      C: 0,
      N: 0,
    },
  };
}

function normalizeStats(obj) {
  const base = getEmptyStats();
  const result = {
    total: Number(obj?.total) || 0,
    byGrade: { ...base.byGrade },
  };
  for (const k of Object.keys(base.byGrade)) {
    result.byGrade[k] = Number(obj?.byGrade?.[k]) || 0;
  }
  return result;
}

export function renderStats(stats) {
  // 테이블 셀만 갱신
  const byId = (id) => document.getElementById(id);
  const g = stats.byGrade;
  const mapping = [
    ["count-ssss", g.SSSS],
    ["count-sss", g.SSS],
    ["count-ss", g.SS],
    ["count-s", g.S],
    ["count-a", g.A],
    ["count-b", g.B],
    ["count-c", g.C],
    ["count-n", g.N],
    ["count-total", stats.total],
  ];
  for (const [id, value] of mapping) {
    const cell = byId(id);
    if (cell) cell.textContent = String(value);
  }
}
