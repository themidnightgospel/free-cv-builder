---
title: "Open source MIT CV builder — buildmyfree.cv"
description: "Free CV Builder is open source under MIT. Self-host it, contribute, or just trust the code."
slug: "open-source"
h1: "Open source"
lede: "MIT licensed. Self-hostable. Code you can read."
ogType: "website"
jsonLdType: "WebPage"
updated: "2026-06-05"
---

## Why open source matters here

Most CV builders are closed-source SaaS. You upload your résumé to a stranger's server and trust the marketing copy on the privacy page.

Free CV Builder is the opposite. The entire app is a static site you can read end-to-end. The "we don't collect your data" claim is verifiable because you can grep the code for `fetch` and see what we send. Spoiler: nothing.

## The repository

**[github.com/themidnightgospel/free-cv-builder](https://github.com/themidnightgospel/free-cv-builder)**

- License: **MIT**
- Stack: React 19, TypeScript, Vite, Tailwind CSS
- Hosting: GitHub Pages
- No tracking, no backend, no analytics

## Self-host it

The site is a static bundle. Two commands:

```bash
git clone https://github.com/themidnightgospel/free-cv-builder
cd free-cv-builder
npm install
npm run build
```

Deploy the `dist/` directory to any static host — GitHub Pages, Netlify, Vercel, Cloudflare Pages, an S3 bucket, your own server. There is no server-side runtime.

## Contributing

Pull requests welcome. Bug reports welcome. Templates, accessibility fixes, and translation contributions are especially welcome.

Before sending a big change, please open an issue first so we can discuss scope.

## The story

This project exists because the author was tired of "free" CV builders that hold your finished PDF hostage behind a paywall, watermark, or signup wall. The goal is a CV tool that doesn't punish you for using it.

If that resonates, [star the repo](https://github.com/themidnightgospel/free-cv-builder) and tell a friend.

---

*MIT licensed. No warranty. Build something with it.*
