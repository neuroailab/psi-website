# PsiBorg published blog

This post lives at /psi-website/psiborg/. All animation edits use Remotion: capability-animation/FullFilm.jsx and capability-animation/player.jsx; build with `node capability-animation/build.mjs` after installing its package.json dependencies. The built player is hero.js.

Keep relative asset URLs, matching dark/light themes, the fixed 16:9 stage, continuous muted looping playback, click/tap and keyboard pause/resume, timeline seeking, and chapter controls. Preserve recorded media, goal images, prediction data, and approved timing. The result thumbnail strip is one-third width; the selected result panel remains large.

The authoring draft has local comments UI. Do not include that UI, review.js, local API references, or noindex when publishing. Older hero-animation and prompt-animation sources are historical; do not build them over the current player.

The v17 opening retains the 45-frame randomized path reveal, then cycles six general-purpose rows through 15 actual training sequences in seeded random row and sequence order during a 330-frame complete-figure phase. Each change fades out for 10 frames, holds blank for 2, then fades in for 10. Keep the three capability rows fixed. The 15-frame focus and downstream chapter lengths are unchanged. All three grid clocks release from source frame 0 at frame 465; the canonical overview is frame 599. Each capability grid has four examples selected in FourExampleGrid.mjs; keep all carousel examples and the policy alternate-goal comparison. The player runs at 1.2×; its timeline shows wall time. Narration cards precede policy and progress grids. Preserve the original sixteen prefetched result clips plus the added simulation and Bridge clips, early image preloads, and final comparison holds.
