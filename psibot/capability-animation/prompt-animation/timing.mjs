export const FPS = 30;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => {x = clamp(x); return x * x * (3 - 2 * x);};
export const promptTiming = Object.freeze({
  fps: FPS,
  durationInFrames: {full: 1020, teaser: 180, detail: 840},
  detailOffsetFrames: 180,
  revealSpacingFrames: 15,
  revealFadeFrames: 3,
  revealFrames: [0, 15, 30, 45, 60, 75, 90],
  rgbSeconds: [4, 8, 12, 16],
  sourceRgbSeconds: [64, 68, 72, 76],
  actionStartFrames: [80, 160, 240],
  actionSpanFrames: 80,
  actionSampleHz: 20,
  goalDeltaSeconds: 12,
  detailPhases: {trajectory: 0, trajectoryHold: 90, policyHighlight: 150,
    policyEnter: 210, policyQuery: 240, policyReturn: 330, simulationHighlight: 360,
    simulationEnter: 420, simulationQuery: 450, simulationReturn: 570,
    progressHighlight: 600, progressEnter: 660, progressQuery: 690,
    progressReturn: 780, progressHold: 810}
});

export function revealOpacity(detailFrame, slot) {
  return ease((detailFrame - slot * promptTiming.revealSpacingFrames +
    promptTiming.revealFadeFrames) / promptTiming.revealFadeFrames);
}

export function getPromptDimensions({mode = 'full', width = 1160, mobile = width < 600} = {}) {
  if (!(mode in promptTiming.durationInFrames)) throw new Error(`Unknown prompt mode: ${mode}`);
  return {width, height: mode === 'detail' ? (mobile ? 270 : 320) : (mobile ? 490 : 620)};
}

export function stage(t) {
  if (t < 5) return {phase: t < 3 ? 'trajectory' : 'trajectory-hold', q: 0, trajectory: t, type: 0, elapsed: -1};
  const type = t < 12 ? 0 : t < 20 ? 1 : 2;
  const start = [5, 12, 20][type], morph = start + 2, query = morph + 1, back = [11, 19, 26][type];
  const q = t < morph ? 0 : t < query ? ease(t - morph) : t < back ? 1 : t < back + 1 ? 1 - ease(t - back) : 0;
  return {type, q, elapsed: t - query,
    trajectory: [5, 7, 9][type] + Math.min(1.999, Math.max(0, t - start)),
    phase: ['policy', 'simulation', 'progress'][type] +
      (t < morph ? '-trajectory' : t < query ? '-enter' : t < back ? '-query' : t < back + 1 ? '-return' : '-hold')};
}

export function getPromptState(frame, mode = 'full') {
  if (!(mode in promptTiming.durationInFrames)) throw new Error(`Unknown prompt mode: ${mode}`);
  const sourceFrame = frame + (mode === 'detail' ? promptTiming.detailOffsetFrames : 0);
  const t = sourceFrame / FPS;
  if (t < 6) {
    const rt = 13 + t * 2;
    const phase = rt < 16 ? 'policy-query' : rt < 20 ? 'simulation-query' : rt < 23 ? 'progress-query' : 'shared-model';
    return {sourceFrame, phase: `intro-${phase}`, capability: 'all', rows: 3};
  }
  const s = stage(t - 6);
  return {sourceFrame, phase: s.phase, capability: ['policy', 'simulation', 'progress'][s.type], rows: s.q > 0 ? 1 : 0};
}
