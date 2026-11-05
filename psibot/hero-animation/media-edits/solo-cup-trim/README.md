# Solo cup eight-second trim

This reproducible Remotion edit removes the first 240 frames (8 seconds at 30
fps) from the Solo cup prediction video. This adds two seconds to the previous
six-second trim. The resulting clip contains 396 frames
(13.2 seconds), preserving source frame 240 through source frame 635.

The simulation grid uses the original 1248 × 714 video as its base, with a
Remotion `Loop` containing the trimmed clip over tile 4 at x=420, y=242,
width=408, height=230. The grid preserves its original 400 ms prediction cadence
at 30 fps. Verified 12-frame prediction holds differ only by tiny H.264 encoding
noise: maximum mean RGB differences within the first two holds were 0.05005 and
0.12173 on a 0–255 scale. Remotion therefore renders 227 samples at frames
0, 12, 24, …, 2712, and the encoder repeats each for 12 frames (the final sample
for 4 frames). Every other tile retains its original prediction frame timing.
The clip is stretched to
the same cell bounds used by the original grid generation. The grid's own
duration remains 2716 frames (90.533333 seconds).

Inputs copied without changes into `public/`:

- `original-simulation-5.mp4`: original `assets/carousel/simulation-5.mp4`.
- `original-simulation-grid.mp4`: original `assets/hero-story/simulation-grid.mp4`.

The two input SHA256 values are recorded in `output/render-receipt.json`.
Original model outputs, source recordings, and social video exports are not
changed. `remotion/index.jsx` is the edit source; `render.mjs` is the renderer.

## Reproduce in this environment

Use Node and the existing Remotion 4.0.523 dependencies. This working directory
uses a `node_modules` symlink resolving to:

`/ccn2/u/atlask/ccwm/ccwm/psi2/robots/corl_demo/remotion/node_modules`

The renderer documents the local Chromium and ffmpeg binary locations. These
absolute runtime paths must be adjusted when reproducing elsewhere. Chromium
requires permission to launch outside the restricted execution sandbox.

Run `node render.mjs --blog-root=/path/to/blog` from this directory. If absent,
the original inputs are copied from the supplied blog root, or the
`PSIBORG_BLOG_ROOT` environment variable, or the containing blog root when this
edit is archived under `hero-animation/media-edits/solo-cup-trim`. The standalone
clip renders all 396 frames as lossless PNGs through Remotion; the grid renders
the 227 verified hold samples. The included ffmpeg binary then encodes the
PNG sequence to H.264 with one encoder thread. Frame PNGs are restartable: a
rerun reuses existing numbered PNGs. When changing the composition, remove its
corresponding `output/*-frames` cache first to avoid reusing outdated frames.
Posters are rendered by Remotion from frame zero at JPEG quality 95.

Outputs:

- `output/simulation-5.mp4` and `.jpg`: standalone trimmed clip and poster.
- `output/simulation-grid.mp4` and `.jpg`: full-duration updated grid and poster.
- `output/*-render.json`: per-composition render metadata.
- `output/render-receipt.json`: source hashes, trim, grid geometry, render data,
  output hashes, and validation summary after running `validate.py`.
- `output/validation.json`: frame-level validation results.
- `output/cache-reuse.json`: provenance and hashes for reused lossless frames.
- `output/cadence-validation.json`: fresh checks of original prediction holds,
  including each of the six grid loop boundaries.

The site's integration may give the outputs versioned names, such as
`simulation-5-trim8.mp4` and `simulation-trim8-grid.mp4`. The grid basename
must retain `-grid.` because the existing hero asset resolver uses it to select
the `assets/hero-story/` directory.

Run `python3 validate_cadence.py` followed by `python3 validate.py` after
rendering. The cadence script checks original prediction holds around every
loop boundary and the retained clip endpoints. The main validator checks decoded frame counts and
dimensions, compares trimmed frames with source frame +240, checks each grid
loop boundary against the trimmed source, and compares unchanged grid pixels
at multiple original frame positions. Pixels outside the replaced tile must
match the original exactly at rendered sample boundaries. Video comparison
tolerates expected H.264 re-encoding differences; the lossless Remotion grid renders are also
compared with the same original source time outside the replaced cell. Python
validation uses Pillow and single-thread ffmpeg, avoiding NumPy/OpenCV runtime
threading behavior in this environment. It may also need permission to launch
the local ffmpeg subprocess outside the restricted execution sandbox.

The current run reuses all 396 lossless standalone Remotion PNGs from the
previous verified six-second-trim render, mapping new frame `n` to old
frame `n + 60` (original frame `n + 240`). `output/cache-reuse.json` records
the source-recipe hash and every reused PNG hash. The grid cache is newly
rendered with the 396-frame loop; no old grid frames are reused.
