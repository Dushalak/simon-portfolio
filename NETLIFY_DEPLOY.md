# Netlify deployment

This repository is a static JavaScript portfolio, with a custom build rather than Vite or React. The tracked `dist/index.html` is the page entry used by the build; `src/` contains the JavaScript, styles and routing configuration.

Netlify reads `netlify.toml` at the repository root:

- Base directory: repository root (`.`).
- Build command: `npm run build && npm run check`.
- Publish directory: `dist`.
- Node version: `24`.

The build copies `src/_redirects` to `dist/_redirects`. Unknown paths serve `index.html` with status 200, while existing assets are served normally. The page's root base URL keeps scripts, styles, images and project data working when the document is served at a nested path. Existing project links continue to use `#project/...`.

Connect `Dushalak/simon-portfolio` and its `main` branch in Netlify. A Git push triggers deployment when continuous deployment is enabled. Manual uploads must contain the contents of `dist`, including `index.html` and `_redirects`.
