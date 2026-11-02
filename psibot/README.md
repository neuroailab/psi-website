# PSI0.5-r landing page

The reviewed robotics post lives at `/psi-website/psibot/`, replacing the PSI Bot
holding page. This is static HTML, CSS, JavaScript, GIFs and MP4s; no build step
or backend is required. Serve the repository root with `python3 -m http.server`.

Edit `index.html` for prose and `styles.css` for layout. `results.js` synchronizes
policy videos and time-to-goal curves, `benchmarks.js` compares failed episodes
with their matching successful replays, and `simulation.js` aligns the expert
and predicted videos. All media and chart data use relative URLs in `assets/`.

The local draft's temporary comment form is intentionally excluded because it
requires a local API. The draft and review history remain in the authoring
workspace. The toys-sorting web video is re-encoded to fit GitHub's file limit;
its resolution, frame count and timestamps are preserved for chart alignment.
