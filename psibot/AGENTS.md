# PsiBorg blog editing

Use the existing Remotion project for all animation edits, including motion,
transitions, animated typography, and composition layout, as requested by the
user. `hero-animation/Story.jsx` is the composition;
`hero-animation/player.jsx` integrates it; `hero-animation/build.mjs` builds
`hero.js`. Preserve fixed desktop/mobile stage heights and matching `hero.css`
aspect ratios so playback never moves surrounding article text.

Preserve original media, timing, and prediction values during presentation
changes. Maintain continuous muted autoplay, looping, and theme matching.
Keep media URLs relative to support the `/psi-website/psibot/` prefix.
