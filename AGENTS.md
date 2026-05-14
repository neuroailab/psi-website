# Repository Notes

This is a static PSI website. There is no package manager or build step in the
current repo; serve it locally with:

```sh
python3 -m http.server 8000
```

Important files:

- `index.html` is the landing page.
- `blog.html` is the manually maintained blog index.
- `blog/*.html` are standalone blog posts with duplicated navigation/footer.
- `styles.css` contains all shared styling.
- `script.js` powers the token visualizer on the landing page.
- `examples/Example Sketchboards/` is an exported Google Doc bundle; image paths
  from blog posts should URL-encode the space as `Example%20Sketchboards`.

When adding a blog post, copy the existing page structure, link `../styles.css`,
and add a card to `blog.html`. Keep image references relative to the blog post.
