const RANK_XP = {
  Associate: [40, 80],
  Senior: [80, 120],
  Lead: [120, 180],
  Manager: [140, 220],
};

export function suggestXp(rankTargets = []) {
  const ranges = rankTargets.map((rank) => RANK_XP[rank]).filter(Boolean);
  if (!ranges.length) return { suggested_min: 50, suggested_max: 100 };
  return {
    suggested_min: Math.min(...ranges.map((range) => range[0])),
    suggested_max: Math.max(...ranges.map((range) => range[1])),
  };
}
