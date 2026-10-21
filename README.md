# Portfolio

A single-page portfolio built with Vite and React 19. Content is editable from a
built-in admin panel, and the site can be deployed as static files.

## Structure

```
my-portfolio/
  src/
    components/   page sections, admin panel, sign-in
    content/      content.json - the content baked into each build
    context/      content provider
    lib/          storage, GitHub client, image helpers
  public/images/  images served as-is
  vercel.json     SPA routing for Vercel
```

## Development

```bash
cd my-portfolio
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build      # writes dist/
npm run preview
```

Node 22 or newer (see `.nvmrc`).

To open the site on a phone connected to the same network, run
`npm run dev -- --host` and visit the printed Network URL.

## Admin panel

- Sign in at `#login`; the panel is at `#admin`.
- `Ctrl+Shift+A` opens the panel from the site.
- The default password is `admin`. **Change it in Admin → Settings** before
  sharing the site, and keep in mind that this is a client-side lock only: it
  hides the UI, it does not protect a server.

## How content is stored

The admin panel writes to `localStorage`, which is per browser and per device.
That means:

1. Edits are visible immediately in **your** browser only.
2. Deployed content comes from `src/content/content.json`, baked in at build.

To publish for everyone, either use the admin's **GitHub** settings (fine-grained
token with `Contents: read and write`) to commit `content.json` to the
repository, which triggers a rebuild, or export `content.json` and commit it
yourself.

## Deployment

### Vercel

Import the repository, then set:

| Setting         | Value           |
| --------------- | --------------- |
| Root Directory  | `my-portfolio`  |
| Framework       | Vite            |
| Build Command   | `npm run build` |
| Output Directory| `dist`          |

`vercel.json` rewrites unknown paths to `index.html`, so `/admin` works on a
direct visit.

### GitHub Pages

`.github/workflows/deploy.yml` builds on every push to `main` and publishes
`dist/`. It also copies `index.html` to `404.html` so the SPA fallback works
there. The site is served from a subpath, which is why `vite.config.js` uses
`base: './'` — keep it relative or Pages links break.

## Images

Reference images as `/images/name.webp`; paths are resolved through
`src/lib/assets.js` so they respect the Vite base. Prefer WebP and resize before
committing: the page background is currently 147 KB and the hero image 116 KB.

The background image is drawn on a fixed `body::before` layer so it covers the
viewport rather than being stretched over the full page height. On screens up
to 768px the app looks for a portrait crop with a `-mobile` suffix next to the
configured image (`punk2.webp` → `punk2-mobile.webp`) and only downloads that
file; without a crop it falls back to the landscape image.
