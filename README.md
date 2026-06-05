<h1 align="center">Free CV Builder</h1>

<p align="center">
  A clean, fast, privacy-first CV builder. No sign-up, no paywall, no watermarks.
  <br />
  Build a professional CV in a few minutes and download it as a PDF.
</p>

<p align="center">
  <a href="https://buildmyfree.cv/"><strong>buildmyfree.cv »</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/themidnightgospel/free-cv-builder/issues">Report a bug</a>
  &nbsp;·&nbsp;
  <a href="#contributing">Contribute</a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="Static site" src="https://img.shields.io/badge/hosting-GitHub%20Pages-181717.svg?logo=github" />
  <img alt="Built with React + Vite" src="https://img.shields.io/badge/built%20with-React%20%2B%20Vite-61dafb.svg?logo=react" />
</p>

<p align="center">
  <img src="demo/demo.gif" alt="Free CV Builder walkthrough" width="900" />
</p>

---

## Why this exists

Most free CV builders gate the download, harvest your data, or splash a watermark
across your résumé until you upgrade. This one doesn't:

- ✅ **No paywall** — every feature is free, forever.
- ✅ **No sign-up** — your CV never leaves your browser.
- ✅ **No watermarks** — the PDF you download is the one you exported.
- ✅ **Open source** — MIT licensed, self-host it in two commands.

## Features

- **Inline editing.** Click any field on the preview to edit it. No separate form to fill in.
- **Live preview.** The page you see *is* the page that prints.
- **Re-import your PDF.** Upload an old CV exported from the app and keep editing where you left off.
- **Typography & layout controls.** Tweak font sizes, section gap, line height, accent color, page padding.
- **Reorder and remove sections.** Add custom sections too.
- **Smart pagination.** Section headings stay glued to their first entry, individual entries never split mid-text.
- **Saved locally.** Auto-saves to `localStorage` so you can close the tab and come back.

## Run locally

```bash
git clone https://github.com/themidnightgospel/free-cv-builder.git
cd free-cv-builder
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

## Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Type-check and produce a production build under `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run the vitest unit suite. |
| `npm run test:e2e` | Run the Playwright end-to-end suite. |
| `npm run demo:record` | Re-record the README demo video (requires `ffmpeg`). |

## Tech stack

- **React 19** + **TypeScript 5** + **Vite 7**
- **Tailwind CSS 3** for styling
- **pdf.js** for reading uploaded PDFs and **window.print()** for export
- **vitest** for unit tests, **Playwright** for e2e
- Deployed to **GitHub Pages** via the workflow in `.github/workflows/deploy.yml`

## Project layout

```
src/
  components/        UI — preview, editor surfaces, advanced panel
    editable/        Inline-edit primitives, popovers, entry forms
    toast/           Toast provider
  pdf/               PDF embedding, extraction and text-layer parsing
  state/             CV model, validators, persistence, sample data
  utils/             Field validators, date helpers, uuid
demo/                Playwright spec + script that records the README demo
tests/
  unit/              vitest specs
  e2e/               Playwright specs (run in CI)
  fixtures/          Reference PDFs for regression tests
```

## Contributing

Issues and PRs are welcome. The CI workflow runs `tsc`, the unit suite and the
Playwright e2e suite on every PR against `master` — green tests are a hard
requirement for merging.

## License

[MIT](LICENSE)
