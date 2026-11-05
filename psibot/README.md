# PsiBorg blog

Published at `/psi-website/psibot/`. This is a static page; serve the repository
root with `python3 -m http.server`. Hosting does not require a build or backend.

`index.html` contains the article and capability tabs. `styles.css`, `hero.css`,
and `carousel.css` define the responsive dark and light presentation. The local
draft's comments interface is excluded because it requires a local API.

The opening animation uses Remotion. Edit `hero-animation/Story.jsx` and
`hero-animation/player.jsx`, then run `npm install` and `npm run build` in
`hero-animation/` to regenerate the committed `hero.js`. Keep the fixed desktop
and mobile stage heights aligned with `hero.css` so the article does not move
as the animation zooms. Preserve continuous muted autoplay, looping, theme
matching, original recordings, timing, and prediction values.

`carousel.js` reads `assets/carousel/catalog.json`. Visible tabs contain nine
policy episodes, four simulation episodes, and all nine progress examples from
the hero grid, numbered independently as Episode 1 onward. Policy and progress
show one scene with its recorded time-to-goal overlay. Side previews navigate
to the enlarged active video; hidden carousels pause.

The failure tab and section remain commented out in `index.html`, with all 16
50% failure examples and references retained in the catalog and media assets.
Uncomment both retained HTML blocks to restore that section.

The prompt animation uses the recorded trajectory assets. Training-data figures
switch between their existing dark/light variants. Code, Paper, and Model
buttons remain disabled until their release URLs are supplied.
