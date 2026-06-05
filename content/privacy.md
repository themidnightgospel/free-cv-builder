---
title: "Privacy policy — buildmyfree.cv"
description: "We don't collect your data. CVs live in your browser only. Full privacy stance."
slug: "privacy"
h1: "Privacy policy"
lede: "What we collect, what we don't, and where your CV actually lives."
ogType: "website"
jsonLdType: "WebPage"
updated: "2026-06-05"
---

## The short version

Free CV Builder is a static website. We have no backend, no database, and no user accounts. We do not collect, store, or transmit your personal information.

## Where your CV lives

Your CV is stored in your browser's **localStorage**. It never leaves your device unless you download the PDF and share it yourself.

Clear your browser data and your saved CVs are gone. We cannot recover them — we never had them. This is a feature, not a bug. The [source code](/open-source/) is open: you can verify there is no upload path.

## What we don't do

- **No accounts.** You cannot sign up. There is nothing to sign up for.
- **No tracking pixels.** No Google Analytics, Plausible, Mixpanel, Segment, no analytics of any kind.
- **No cookies.** Only first-party `localStorage` holds your CV.
- **No third-party advertising.** Ever.
- **No fingerprinting.** We do not profile your device.
- **No data sales.** We have no data to sell.

## Third-party requests we make

- **Google Fonts** — loads the Geist and Source Sans 3 typefaces. Google sees your IP. Block it with uBlock Origin if you prefer.
- **GitHub** — only when you click a link to the repository.

## Hosting

The site is hosted on **GitHub Pages**. GitHub collects standard server logs (IP, user agent, requested URL) per their own privacy policy. We do not have access to these logs.

## PDF export and upload

PDF generation runs entirely in your browser via the browser's print engine. The PDF is never uploaded anywhere.

When you upload an existing CV PDF, the file is read and parsed in your browser. It is never sent to a server.

## Contact

[Open an issue on GitHub](https://github.com/themidnightgospel/free-cv-builder/issues).

---

*Last updated: 2026-06-05.*
