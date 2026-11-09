# PsiBorg capability film

The public page uses the Remotion composition in FullFilm.jsx: 5713 frames at 30 fps, presented at 1.2× speed (158.69 seconds), 1280×720. The interactive player is player.jsx. Install the dependencies from package.json, then run `node build.mjs` here to rebuild ../hero.js.

The animation uses relative assets/capability-film paths for the /psi-website/psiborg/ URL. Preserve recorded media, goal images, prediction values, timing, dark/light palettes, and final-frame comparison holds when editing. The page supports muted autoplay and looping, click/tap or Space/Enter to pause/resume, draggable seeking, and chapter navigation.

The opening reveals all nine input/output paths in a fixed randomized order over
45 frames (1.25 seconds at the player speed). At frames 60–90, the six general
paths compact into two banks while the three robotics paths remain fixed. The
motion shrinks the rows upward first, moves them sideways above the model, then
settles them into paired rows. This avoids token and model overlaps.

Starting at frame 90, fifteen additional training sequences appear in a seeded
random order, one every 15 frames. Each new row uses a 10-frame edge reveal and
small slide. Existing rows remain fully visible, and all 24 sequences share the
page by frame 310. The complete figure holds until the original focus at frame
375, when the general paths clear for the three robotics capabilities. Their
positions and handoff stay unchanged. Grid playback starts at frame 465 and the
final overview is frame 599; later chapter lengths and source clocks are intact.

`AccumulatingSequences.jsx` renders the compact rows. The deterministic schedule,
modality widths and bank geometry are in `TrainingSequenceAccumulation.mjs`.
Tokens use 14px labels and 13px glyphs; camera-pose tokens get extra width so their
labels fit on one line. The two banks contain 11 and 10 general sequences above
the three fixed capability rows.

`training-sequences.json` records exact, positive-weight sequences from the final saved PSI0.5 v5 32k resume recipe (`abc_v5_32k_resume1060612.yaml`), including its SHA-256, original line numbers and mode weights. Each displayed prompt is a prefix of that literal sequence; its prediction is the remaining suffix. RGB, action, depth, flow and camera pose are represented across the bank. `c` is camera pose, `d` is depth, and `dt` remains temporal distance in the fixed progress capability. We do not imply that action and camera pose occur together in a configured sequence.

`FourExampleGrid.mjs` selects four existing catalog indices per 2×2 grid: Policy [0,1,5,4], Simulation [0,1,4,5], Progress [2,0,4,3]. Policy's alternate-goal companion (7) still appears during its paired zoom. All carousel examples, goals, predictions and catalog IDs remain intact. The new `*-grid-2x2` composites and return snapshots preserve the old source timing. Regenerate them with `python3 rebuild-four-grid-assets.py --help` for options.
