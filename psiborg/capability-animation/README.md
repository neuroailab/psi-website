# PsiBorg capability film

The public page uses the Remotion composition in FullFilm.jsx: 5713 frames at 30 fps, presented at 1.2× speed (158.69 seconds), 1280×720. The interactive player is player.jsx. Install the dependencies from package.json, then run `node build.mjs` here to rebuild ../hero.js.

The animation uses relative assets/capability-film paths for the /psi-website/psiborg/ URL. Preserve recorded media, goal images, prediction values, timing, dark/light palettes, and final-frame comparison holds when editing. The page supports muted autoplay and looping, click/tap or Space/Enter to pause/resume, draggable seeking, and chapter navigation.

The opening presents 13 paths at one size: the original nine paths plus four
representative literal training sequences. Every input and output chip is 92×38,
with 16px labels and 17px glyphs. Independent horizontal input/output offsets
give each path a different distance to the model, with every row exactly 45px apart
from y=145 through y=685. Smooth cubic connectors use clear corridors beside
the model and matching horizontal tangents, without square elbows. All routes pass through the shared Ψ model,
and every path appears directly at its final position without compaction.

The seeded random reveal adds a complete path every five frames, using a
five-frame reveal, and finishes at frame 65. All 13 remain visible through frame
315. The 10 secondary paths dim to 0.12 opacity over frames 315–345, giving the
three robotics paths a clear reading hold before their existing handoff at 390.
Secondary paths clear during 390–405. During the 45-frame handoff, the main
paths and model marks move straight to their overview destinations, with one
shared eased fraction for both axes and no intermediate stops. Their initial
y centers are Simulation 145, Policy 550 and Progress 685. Overview titles appear
during frames 417–435 after the moving tokens clear them; overview destinations and footage clocks remain
unchanged. The opening still lasts 600 frames, grid playback starts at 465, and
the final overview is 599. Later chapters retain their timing and media.

The expanded simulation view reads “Video prediction from low level actions
in diverse environments” over two lines. The short overview label transitions
into this caption, which remains visible during the simulation prompt and
recorded examples.

`ScatteredSequenceLayout.mjs` records the selected training IDs, fixed track
positions, uniform geometry and model ports. `TrainingSequences.mjs` reads exact
prefix/suffix splits from the unchanged 15-entry source catalog. `PromptDiagram.jsx`
owns the shared routing, seeded reveal and capability emphasis.

`training-sequences.json` records exact, positive-weight sequences from the final saved PSI0.5 v5 32k resume recipe (`abc_v5_32k_resume1060612.yaml`), including its SHA-256, original line numbers and mode weights. Each displayed prompt is a prefix of that literal sequence; its prediction is the remaining suffix. RGB, action, depth, flow and camera pose are represented across the bank. `c` is camera pose, `d` is depth, and `dt` remains temporal distance in the fixed progress capability. We do not imply that action and camera pose occur together in a configured sequence.

`FourExampleGrid.mjs` selects four existing catalog indices per 2×2 grid: Policy [0,1,5,4], Simulation [0,1,4,5], Progress [2,0,4,3]. Policy's alternate-goal companion (7) still appears during its paired zoom. All carousel examples, goals, predictions and catalog IDs remain intact. The `*-grid-2x2` composites and return snapshots preserve the old source timing. `rebuild-four-grid-assets.py` reconstructs the original grids; after running it, restore the current simulation overlays with the command below.

The four simulation recordings now include their supplied conditioning-action
charts. `refresh-simulation-action-overlays.py` extracts the clean windows from
the colleague's `simulation.mp4` montage, excluding its crossfades and final hold.
Existing clips retain 144/144/396/144 frames, and the simulation grid still loops
each recording independently from frame zero over 2716 frames. Its return image
uses grid frame 1714. The clips keep their native 1920×1080 detail and BT.709
matrix; the Results carousel uses the complete frame. The separate recorded
observation/action atlases used to explain the prompt remain unchanged.

```sh
python3 refresh-simulation-action-overlays.py --source /path/to/simulation.mp4 \
  --work-dir /tmp/psiborg-simulation-actions --install
```

`simulation-action-overlays.json` records the verified montage hash, exact frame
windows, installed outputs and clocks. These charts are baked into the supplied
recordings; the website does not generate or infer new action commands.
