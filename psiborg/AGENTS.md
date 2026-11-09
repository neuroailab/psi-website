# PsiBorg published blog

This post lives at /psi-website/psiborg/. All animation edits use Remotion: capability-animation/FullFilm.jsx and capability-animation/player.jsx; build with `node capability-animation/build.mjs` after installing its package.json dependencies. The built player is hero.js.

Keep relative asset URLs, matching dark/light themes, the fixed 16:9 stage, continuous muted looping playback, click/tap and keyboard pause/resume, timeline seeking, and chapter controls. Preserve recorded media, goal images, prediction data, and approved timing. The result thumbnail strip is one-third width; the selected result panel remains large.

The authoring draft has local comments UI. Do not include that UI, review.js, local API references, or noindex when publishing. Older hero-animation and prompt-animation sources are historical; do not build them over the current player.

The v19 opening has 18 fixed paths: the original nine plus nine representative
literal training sequences. All input and output chips are 92×38, with 16px text
and 17px glyphs. ScatteredSequenceLayout.mjs assigns staggered horizontal anchors
so rows fit around the shared model; no row resizes or moves during reveal/hold.
Paths appear in seeded random order every five frames with a five-frame reveal,
finishing at frame 90. The 15 secondary paths dim from full opacity to 0.12 during
frames 315–345, then remain visible while the three robotics paths stay bright.
They clear during 390–405. In the 390–435 handoff, the main paths and model
marks separate into columns first, then lift; keep tokens clear throughout.
Keep the main centers at 464/516/568 and preserve the overview target geometry.
The opening remains 600 frames. Grid clocks start from source frame 0 at 465, and
the canonical overview is 599. Keep the complete 15-entry training source catalog,
all carousel examples and the policy alternate-goal comparison. The player runs at 1.2×; its timeline shows wall time. Narration cards precede policy and progress grids. Preserve the original sixteen prefetched result clips plus the added simulation and Bridge clips, early image preloads, and final comparison holds.
