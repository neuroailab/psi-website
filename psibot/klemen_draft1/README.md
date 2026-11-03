# Klemen draft 1

Separate editorial draft of the PsiBorg post, based on `f4922e2`.
Published at `/psi-website/psibot/klemen_draft1/`.

Edit `index.html` for prose and `draft.css` for draft-specific presentation.
The missing-pieces section is intentionally a writing outline. The parent
post's styles, figures and full results assets are reused. Copies of its three
players resolve their data and media relative to the parent directory.

The three opening videos use existing results:

- `policy.mp4`: `../assets/results/plate-stacking.mp4`, source time
  29.1–77.8 seconds, at 6× playback, encoded at 24 fps.
- `simulation.mp4`: the prediction half (right 672 × 384 pixels) of
  `../assets/simulation/red-solo-cup.mp4`, preserving its 2.5 fps timing.
- `progress.mp4`: the same plate-stacking excerpt and speed as the policy
  clip, with recorded values from the first track in
  `../assets/results/plate-stacking.json`. The graph reveals predictions
  only when their original video timestamp is reached. Its horizontal
  axis is source-video time; its vertical axis is predicted seconds to goal.

All three have native playback controls, posters, and no autoplay or looping.
The policy/progress posters are at 3.8 seconds in the excerpts; the simulation
poster is at 10 seconds. No model inference or synthetic predictions were used.
