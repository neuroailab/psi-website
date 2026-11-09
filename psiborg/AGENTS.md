# PsiBorg published blog

This post lives at /psi-website/psiborg/. All animation edits use Remotion: capability-animation/FullFilm.jsx and capability-animation/player.jsx; build with `node capability-animation/build.mjs` after installing its package.json dependencies. The built player is hero.js.

Keep relative asset URLs, matching dark/light themes, the fixed 16:9 stage, continuous muted looping playback, click/tap and keyboard pause/resume, timeline seeking, and chapter controls. Preserve recorded media, goal images, prediction data, and approved timing. The result thumbnail strip is one-third width; the selected result panel remains large.

The authoring draft has local comments UI. Do not include that UI, review.js, local API references, or noindex when publishing. Older hero-animation and prompt-animation sources are historical; do not build them over the current player.

The v22 opening has 13 fixed paths: the original nine plus four representative
literal training sequences. All input and output chips are 92×38, with 16px text
and 17px glyphs. ScatteredSequenceLayout.mjs assigns staggered horizontal anchors
so rows fit around the shared model; no row resizes or moves during reveal/hold.
Paths appear in seeded random order every five frames with a five-frame reveal,
finishing at frame 65. The 10 secondary paths dim from full opacity to 0.12 during
frames 315–345, then remain visible while the three robotics paths stay bright.
They clear during 390–405. In the 390–435 handoff, the main paths and model
marks move directly to their destinations using the same interpolation fraction
for both axes. Do not add waypoints or staged horizontal/vertical movement.
All thirteen row centers are exactly 45px apart, from 145 through 685.
Initial main centers are Simulation 145, Policy 550, Progress 685; preserve the
overview target geometry. Every row has independent horizontal input/output
offsets, giving different connector lengths. Keep those offsets fixed during
the opening hold. Reserve a broad clear corridor on each side of the model for
smooth cubic connectors with horizontal tangents at their joins. Do not collapse
the curves into vertical elbows or route through token chips. Overview titles appear during 417–435 after the tokens clear them.
The opening remains 600 frames. Grid clocks start from source frame 0 at 465, and
the canonical overview is 599. Keep the complete 15-entry training source catalog,
all carousel examples and the policy alternate-goal comparison. The player runs at 1.2×; its timeline shows wall time. Narration cards precede policy and progress grids. Preserve the original sixteen prefetched result clips plus the added simulation and Bridge clips, early image preloads, and final comparison holds.
