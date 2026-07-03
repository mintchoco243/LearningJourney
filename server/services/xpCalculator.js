const RANK_XP = {
  Associate: [40, 80],
  "Senior Associate": [80, 120],
  Senior: [80, 120],
  "Assistant Manager": [120, 180],
  Lead: [120, 180],
  Manager: [140, 220],
  "Senior Manager": [180, 260],
  Director: [180, 260],
};

export function suggestXp(rankTargets = []) {
  const ranges = rankTargets.map((rank) => RANK_XP[rank]).filter(Boolean);
  if (!ranges.length) return { suggested_min: 50, suggested_max: 100 };
  return {
    suggested_min: Math.min(...ranges.map((range) => range[0])),
    suggested_max: Math.max(...ranges.map((range) => range[1])),
  };
}
