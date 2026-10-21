# My Portfolio

A personal portfolio built with React + Vite, with a built-in **admin page** so you can edit
your site content without touching any code.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
npm run lint     # run oxlint
```

## The admin page

Open **http://localhost:5173/#admin** (or click the "Admin" link in the footer).

- **Default password:** `admin`
- Change it under the **Settings** tab. It is stored in your browser's localStorage.

### What you can edit

| Tab | Contents |
| --- | --- |
| **Site** | Logo text, browser tab title, background image, navigation links |
| **Hero** | Greeting, headline, description, button text/link, profile image |
| **Stats** | The three number boxes (value + label) |
| **Skills** | Section heading and the skill cards |
| **About** | Heading and body text |
| **Contact** | Heading and contact details |
| **Settings** | Change password, GitHub connection, export/import content |

### Adding images

Both the **background image** and the **profile image** use the image picker, so you never
need to open code or a folder to add a picture.

Each image field has three modes:

- **Upload** — drag a file in or click to browse. PNG, JPG, WEBP, GIF and SVG are supported.
  Images are resized to a maximum of 1600px and re-encoded as JPEG in your browser, so a
  3MB phone photo becomes a ~25KB file. SVG files are kept as-is.
- **Library** — pick an image that already lives in the repository. Use
  **Settings → Load image library** to refresh the list.
- **Path** — type a path by hand, for example `/images/me.png`.

The live preview updates the moment you choose an image.

### Publishing to GitHub (optional)

This is how your edits reach your real website, including uploaded images.

1. Go to **Settings → GitHub**.
2. Create a fine-grained personal access token with **Contents: Read and write** on
   `snoopy0979/portfolio`.
3. Paste the token, then click **Test connection** and **Save settings**.
4. Click **Push to GitHub** in the top bar (or in Settings).

Uploads are committed as real files under `my-portfolio/public/images/`, and
`content.json` is rewritten to point at those files — so your site serves normal image
files instead of huge inline base64. Your next deploy publishes the change.

**Pull from GitHub** does the reverse: it loads the repository's `content.json` into
the editor.

### How edits are saved

1. **Editing** updates the live preview on the right and saves an *unsaved draft* automatically.
   Drafts survive a page refresh.
2. **Publish** makes the changes live for everyone visiting the site on this device.
3. **Push to GitHub** commits them so every visitor sees them.
4. **Discard** throws away the unsaved draft and goes back to the published version.
5. **Reset** wipes all published changes and drafts, restoring the original `content.json`.

Published edits are stored in your browser's localStorage, so they only affect the device
you edited on. **Push to GitHub** (or **Settings → Export content.json**, then replacing
the file at `src/content/content.json` and rebuilding) makes a change permanent for every
visitor. **Import** does the reverse: it loads an existing `content.json` into the editor.

> **Note on the password:** it is a client-side lock, not real server-side security. Anyone with
> devtools can read localStorage. That is fine for a personal portfolio, but do not use this to
> protect anything sensitive.
>
> **Note on the GitHub token:** it is stored in localStorage in your browser and only ever sent
> to `api.github.com`. Use a token scoped to just this repository.

## Project structure

```
src/
├── components/
│   ├── Admin.jsx        # admin panel UI
│   ├── ImageField.jsx   # upload / library / path image picker
│   ├── Navbar.jsx
│   ├── Home.jsx
│   ├── Experiences.jsx
│   ├── Skills.jsx
│   ├── About.jsx
│   ├── Contact.jsx
│   └── Footer.jsx
├── content/
│   └── content.json     # the site content (source of truth for a fresh deploy)
├── context/
│   ├── ContentContext.jsx   # provider: load / update / publish / reset
│   └── useContent.js        # hook to read the content
├── lib/
│   ├── contentStore.js      # localStorage persistence, import/export, password
│   ├── imageStore.js        # compression, naming, data URL helpers
│   ├── githubClient.js      # GitHub REST API client
│   └── githubSettings.js    # repo / branch / token settings
├── App.css
├── admin.css
└── App.jsx             # routes between the portfolio and the admin page
```

## Images

Images live in `public/images/`. Reference them from the admin panel with a path starting
with `/`, for example `/images/Designer.png`.
