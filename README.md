FreeCvBuilder
==============

Live app: `https://buildmyfree.cv/`

FreeCvBuilder is an open‑source CV/Resume builder focused on being **genuinely free**:
no sign‑up, no trial, no “pay to download” step, and no watermarks.

Why “free” really means free
----------------------------

- **No paywall at download** – you can always export your CV to PDF without paying.
- **No account required** – you can use the app anonymously.
- **No subscriptions or upsells** – there is no “pro” tier hiding basic features.
- **Open‑source** – the code lives in this repository, so you can verify how it works.

Key features
------------

- Modern, distraction‑free CV editor with live preview.
- Clean A4 PDF export with real, selectable text (no rasterized images).
- Downloaded PDFs **embed your CV data as JSON**, so you can:
  - Re‑upload a PDF later and continue editing from exactly the same data.
  - Keep your own backups without relying on a server account.
- Local, automatic saving of your CVs in the browser (no backend account needed).
- Support for profile photo, multiple sections (experience, education, projects, skills, etc.), and custom sections.

How the PDF round‑trip works
----------------------------

- When you click “Download PDF”, the app:
  - Renders a print‑optimized version of your CV in the browser.
  - Embeds a compact JSON representation of your CV into the PDF as invisible text blocks.
- When you later use “Upload PDF”:
  - The app reads the PDF in the browser.
  - Extracts the embedded JSON payload.
  - Normalizes it into the current CV data model and restores it into the editor.

Running locally
---------------

Requirements:

- Node.js (LTS recommended)
- npm

Steps:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm run dev
   ```

3. Open the URL shown in the terminal (typically `http://localhost:5173`) in your browser.

Build for production:

```bash
npm run build
```

Then you can preview the built app with:

```bash
npm run preview
```

Project goals
-------------

- Stay **free to use, forever**, with no paywalls or surprise charges.
- Remain **transparent and privacy‑friendly**, keeping data in the browser wherever possible.
- Provide a **high‑quality CV layout** that works well both on screen and as a printed/PDF document.

If you have suggestions or find issues, please open an issue or pull request in this repository.
