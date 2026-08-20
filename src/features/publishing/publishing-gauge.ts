const ARC_CENTER_X = 120;
const ARC_CENTER_Y = 116;
const ARC_RADIUS = 100;
const ARC_LENGTH = 314;

function roundCoordinate(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function getContentScoreGauge(score: number) {
  const clampedScore = Math.min(100, Math.max(0, Number.isFinite(score) ? score : 0));
  const progress = clampedScore / 100;
  const angle = Math.PI * (1 - progress);

  return {
    score: clampedScore,
    dashLength: Math.round(ARC_LENGTH * progress),
    cx: roundCoordinate(ARC_CENTER_X + ARC_RADIUS * Math.cos(angle)),
    cy: roundCoordinate(ARC_CENTER_Y - ARC_RADIUS * Math.sin(angle)),
  };
}
