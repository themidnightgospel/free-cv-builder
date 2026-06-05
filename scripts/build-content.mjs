// Renders content/*.md into dist/{slug}/index.html using templates/page.html,
// and emits dist/sitemap.xml. Runs after `vite build`.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'page.html');
const DIST = path.join(ROOT, 'dist');
const SITE_ORIGIN = 'https://buildmyfree.cv';

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildJsonLd = (data, urlPath) => {
  const type = data.jsonLdType || 'WebPage';
  const base = {
    '@context': 'https://schema.org',
    '@type': type,
    name: data.title,
    headline: data.h1 || data.title,
    description: data.description,
    url: `${SITE_ORIGIN}${urlPath}`,
    inLanguage: 'en',
  };
  if (type === 'Article') {
    base.datePublished = data.datePublished;
    base.dateModified = data.updated || data.datePublished;
    base.author = { '@type': 'Organization', name: data.author || 'Free CV Builder' };
    base.publisher = {
      '@type': 'Organization',
      name: 'Free CV Builder',
      url: SITE_ORIGIN,
    };
    base.mainEntityOfPage = `${SITE_ORIGIN}${urlPath}`;
  }
  return `<script type="application/ld+json">\n${JSON.stringify(base, null, 2)}\n    </script>`;
};

const renderPage = (template, data, html) => {
  const urlPath = `/${data.slug}/`;
  const replacements = {
    title: escapeHtml(data.title),
    description: escapeHtml(data.description),
    path: urlPath,
    ogType: escapeHtml(data.ogType || 'website'),
    h1: escapeHtml(data.h1 || data.title),
    lede: escapeHtml(data.lede || ''),
    content: html,
    jsonLd: buildJsonLd(data, urlPath),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in replacements ? replacements[key] : '',
  );
};

const writeSitemap = async (entries) => {
  const urls = [
    { loc: `${SITE_ORIGIN}/`, lastmod: new Date().toISOString().slice(0, 10), priority: '1.0' },
    ...entries.map((e) => ({
      loc: `${SITE_ORIGIN}/${e.slug}/`,
      lastmod: e.updated || new Date().toISOString().slice(0, 10),
      priority: '0.8',
    })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;
  await fs.writeFile(path.join(DIST, 'sitemap.xml'), xml, 'utf8');
  console.log(`  sitemap.xml (${urls.length} urls)`);
};

const main = async () => {
  const template = await fs.readFile(TEMPLATE_PATH, 'utf8');
  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('No content files found. Skipping.');
    return;
  }
  console.log(`Rendering ${files.length} content pages:`);
  const entries = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    if (!data.slug) throw new Error(`Missing 'slug' frontmatter in ${file}`);
    if (!data.title) throw new Error(`Missing 'title' frontmatter in ${file}`);
    if (!data.description) throw new Error(`Missing 'description' frontmatter in ${file}`);
    const html = marked.parse(content, { mangle: false, headerIds: false });
    const page = renderPage(template, data, html);
    const outDir = path.join(DIST, data.slug);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, 'index.html'), page, 'utf8');
    entries.push(data);
    console.log(`  ${data.slug}/index.html`);
  }
  await writeSitemap(entries);
  console.log('Content build done.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
