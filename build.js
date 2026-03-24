#!/usr/bin/env node
/**
 * effector-docs — Static Site Generator
 * Zero-dependency. Reads markdown + types.json + schema → generates HTML.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, cpSync } from 'node:fs';
import { join, dirname, basename, extname, relative, resolve } from 'node:path';

const ROOT = dirname(new URL(import.meta.url).pathname);
const CONTENT = join(ROOT, 'content');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

/** Parent of effector-docs: monorepo root, or set EFFECTOR_DOCS_PARENT */
const PARENT = process.env.EFFECTOR_DOCS_PARENT
  ? resolve(process.env.EFFECTOR_DOCS_PARENT)
  : resolve(ROOT, '..');

function pickFile(candidates) {
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}
function pickDir(candidates) {
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

/* Order: standalone (Vercel) first — node_modules + vendor — then monorepo siblings under PARENT */
const DOCS = pickDir([
  join(ROOT, 'docs-content'),
  join(ROOT, 'external-docs'),
  join(PARENT, 'docs'),
]);
const TYPES = pickFile([
  join(ROOT, 'node_modules/@effectorhq/types/types.json'),
  join(PARENT, 'effector-types/types.json'),
]);
const SCHEMA = pickFile([
  join(ROOT, 'vendor/effector-spec/schemas/effector.schema.json'),
  join(PARENT, 'effector-spec/schemas/effector.schema.json'),
]);
const CORE = pickDir([
  join(ROOT, 'node_modules/@effectorhq/core/src'),
  join(PARENT, 'effector-core/src'),
]);

console.log('[build] sources — DOCS:', DOCS || '—', '| TYPES:', TYPES || '—', '| SCHEMA:', SCHEMA || '—', '| CORE:', CORE || '—');
const ASSET_VERSION = Date.now().toString(36);

// ─── Markdown → HTML ──────────────────────────────────────

function parseMarkdown(src) {
  const lines = src.split('\n');
  let html = '';
  let inCode = false, codeLang = '', codeLines = [];
  let inList = false, listType = '';
  let inTable = false, tableRows = [];

  function flushList() {
    if (inList) { html += listType === 'ul' ? '</ul>\n' : '</ol>\n'; inList = false; }
  }
  function flushTable() {
    if (!inTable) return;
    html += '<table>\n<thead><tr>';
    const headers = tableRows[0];
    for (const h of headers) html += `<th>${inlineMarkdown(h.trim())}</th>`;
    html += '</tr></thead>\n<tbody>\n';
    for (let i = 2; i < tableRows.length; i++) {
      html += '<tr>';
      for (const c of tableRows[i]) html += `<td>${inlineMarkdown(c.trim())}</td>`;
      html += '</tr>\n';
    }
    html += '</tbody></table>\n';
    inTable = false; tableRows = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks
    if (line.startsWith('```')) {
      if (!inCode) {
        flushList(); flushTable();
        codeLang = line.slice(3).trim();
        inCode = true; codeLines = [];
      } else {
        const escaped = codeLines.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const langAttr = codeLang ? ` data-lang="${codeLang}"` : '';
        html += `<pre${langAttr}><code>${escaped}</code><button class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">Copy</button></pre>\n`;
        inCode = false;
      }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    // Empty line
    if (line.trim() === '') { flushList(); flushTable(); continue; }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1);
      if (!inTable) { inTable = true; tableRows = []; }
      tableRows.push(cells);
      continue;
    } else { flushTable(); }

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      const text = hMatch[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      html += `<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>\n`;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      html += `<blockquote><p>${inlineMarkdown(line.slice(2))}</p></blockquote>\n`;
      continue;
    }

    // HR
    if (/^-{3,}$/.test(line.trim()) || /^\*{3,}$/.test(line.trim())) {
      flushList();
      html += '<hr>\n';
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line.trim())) {
      if (!inList || listType !== 'ul') { flushList(); html += '<ul>\n'; inList = true; listType = 'ul'; }
      html += `<li>${inlineMarkdown(line.trim().slice(2))}</li>\n`;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      if (!inList || listType !== 'ol') { flushList(); html += '<ol>\n'; inList = true; listType = 'ol'; }
      html += `<li>${inlineMarkdown(line.trim().replace(/^\d+\.\s/, ''))}</li>\n`;
      continue;
    }

    // Paragraph
    flushList();
    html += `<p>${inlineMarkdown(line)}</p>\n`;
  }
  flushList(); flushTable();
  return html;
}

function inlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
      // Convert .md links to .html
      const href = u.endsWith('.md') ? u.replace(/\.md$/, '.html') : u;
      return `<a href="${href}">${t}</a>`;
    });
}

// ─── Frontmatter ─────────────────────────────────────────

function parseFrontmatter(src) {
  if (!src.startsWith('---')) return { meta: {}, body: src };
  const end = src.indexOf('---', 3);
  if (end === -1) return { meta: {}, body: src };
  const yaml = src.slice(3, end).trim();
  const meta = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return { meta, body: src.slice(end + 3).trim() };
}

// ─── Sidebar Structure ───────────────────────────────────

const SIDEBAR = [
  { title: 'Product', items: [
    { title: 'Overview', url: '/overview.html' },
    { title: 'About Effector', url: '/about.html' },
    { title: 'Installation', url: '/installation.html' },
    { title: 'FAQ', url: '/faq.html' },
  ]},
  { title: 'Getting Started', items: [
    { title: 'Quick Start', url: '/guides/getting-started.html' },
    { title: 'Your First Manifest', url: '/first-manifest.html' },
    { title: 'Examples & Cookbook', url: '/guides/examples.html' },
    { title: 'MCP Migration', url: '/guides/mcp-migration.html' },
  ]},
  { title: 'Core Concepts', items: [
    { title: 'Architecture', url: '/guides/architecture.html' },
    { title: 'Why effector.toml', url: '/guides/why-effector.html' },
    { title: 'Type System', url: '/type-system.html' },
    { title: 'Permissions Model', url: '/permissions.html' },
    { title: 'Composition', url: '/guides/composition.html' },
    { title: 'Security & Auditing', url: '/guides/security.html' },
    { title: 'Skills & Extensions', url: '/guides/skill-development.html' },
  ]},
  { title: 'Reference', items: [
    { title: 'Type Catalog', url: '/types/index.html' },
    { title: 'API Reference', url: '/api/index.html' },
    { title: 'CLI Reference', url: '/cli-reference.html' },
    { title: 'Manifest Schema', url: '/spec/schema.html' },
    { title: 'SKILL.md Format', url: '/reference/skill-format.html' },
  ]},
  { title: 'Tools', items: [
    { title: 'Playground', url: '/playground.html' },
    { title: 'Studio', url: '/studio.html' },
    { title: 'Graph Explorer', url: '/graph.html' },
    { title: 'Reverse Compiler', url: '/reverse-compiler.html' },
  ]},
  { title: 'Operations', items: [
    { title: 'CI/CD Integration', url: '/guides/ci-integration.html' },
    { title: 'Extension Development', url: '/guides/extension-development.html' },
    { title: 'Adoption Kit', url: '/adoption/index.html' },
  ]},
  { title: 'Community', items: [
    { title: 'Blog', url: '/blog/index.html' },
    { title: 'Changelog', url: '/changelog.html' },
  ]},
];

// ─── Templates ───────────────────────────────────────────

function renderShell(
  title,
  bodyHtml,
  {
    activeUrl = '',
    isHome = false,
    subtitle = '',
    description = 'we build hands for AI that moves first'
  } = {}
) {
  const shell = readFileSync(join(SRC, 'templates', 'shell.html'), 'utf-8');
  const sidebarHtml = SIDEBAR.map(section => {
    const items = section.items.map(item => {
      const cls = item.url === activeUrl ? ' class="active"' : '';
      return `<a href="${item.url}"${cls}>${item.title}</a>`;
    }).join('\n      ');
    return `    <div class="sidebar-section">
      <div class="sidebar-section-title">${section.title}</div>
      ${items}
    </div>`;
  }).join('\n');

  const subtitleHtml = subtitle ? `<p class="page-subtitle">${subtitle}</p>` : '';
  const layoutClass = isHome ? 'layout-home' : 'layout';

  return shell
    .replace('{{TITLE}}', title + ' - effector docs')
    .replace('{{DESCRIPTION}}', description)
    .replace('{{ASSET_VERSION}}', ASSET_VERSION)
    .replace('{{SIDEBAR}}', sidebarHtml)
    .replace('{{CONTENT}}', subtitleHtml + bodyHtml)
    .replace('{{LAYOUT_CLASS}}', layoutClass)
    .replace(/\{\{ACTIVE_NAV_(\w+)\}\}/g, (_, key) => {
      if (key === 'HOME' && isHome) return 'active';
      if (key === 'DOCS' && (activeUrl.startsWith('/overview') || activeUrl.startsWith('/about') || activeUrl.startsWith('/install') || activeUrl.startsWith('/guides') || activeUrl.startsWith('/first') || activeUrl.startsWith('/type-system') || activeUrl.startsWith('/permissions') || activeUrl.startsWith('/cli') || activeUrl.startsWith('/reverse') || activeUrl.startsWith('/reference') || activeUrl.startsWith('/api') || activeUrl.startsWith('/spec') || activeUrl.startsWith('/changelog') || activeUrl.startsWith('/blog') || activeUrl.startsWith('/adoption'))) return 'active';
      if (key === 'TYPES' && activeUrl.startsWith('/types')) return 'active';
      if (key === 'TOOLS' && (activeUrl.startsWith('/playground') || activeUrl.startsWith('/studio') || activeUrl.startsWith('/graph'))) return 'active';
      return '';
    });
}

// ─── Build pages from markdown ─────────────────────────

function buildMarkdownPages() {
  const pages = [];

  // Content directory (new product pages)
  const contentFiles = findMarkdown(CONTENT);
  for (const file of contentFiles) {
    const rel = relative(CONTENT, file);
    const url = '/' + rel.replace(/\.md$/, '.html');
    const src = readFileSync(file, 'utf-8');
    const { meta, body } = parseFrontmatter(src);
    const title = meta.title || extractTitle(body) || basename(file, '.md');
    const subtitle = meta.subtitle || '';
    const html = parseMarkdown(body);
    const outPath = join(DIST, rel.replace(/\.md$/, '.html'));
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, renderShell(title, html, { activeUrl: url, subtitle }));
    pages.push({ title, url, content: body.slice(0, 300) });
  }

  // Docs directory (guides, reference, blog, adoption-kit) — optional
  if (!DOCS) {
    console.warn('[build] docs repo not found (../docs, ./docs-content, ./external-docs); skipping imported guides/blog');
  } else {
  const mappings = [
    { from: join(DOCS, 'guides'), to: 'guides' },
    { from: join(DOCS, 'reference'), to: 'reference' },
    { from: join(DOCS, 'blog'), to: 'blog' },
    { from: join(DOCS, 'adoption-kit'), to: 'adoption' },
  ];

  for (const { from, to } of mappings) {
    if (!existsSync(from)) continue;
    const files = findMarkdown(from);
    for (const file of files) {
      const name = basename(file, '.md');
      const url = `/${to}/${name}.html`;
      const outPath = join(DIST, to, name + '.html');
      // Skip if content/ already generated this page (content takes priority)
      if (existsSync(outPath)) { continue; }
      const src = readFileSync(file, 'utf-8');
      const { meta, body } = parseFrontmatter(src);
      const title = meta.title || extractTitle(body) || name;
      const html = parseMarkdown(body);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, renderShell(title, html, { activeUrl: url }));
      pages.push({ title, url, content: body.slice(0, 300) });
    }

    // Generate index page for section
    if (existsSync(from)) {
      const files2 = findMarkdown(from);
      const listHtml = files2.map(f => {
        const name = basename(f, '.md');
        const src = readFileSync(f, 'utf-8');
        const { body } = parseFrontmatter(src);
        const title = extractTitle(body) || name;
        const desc = body.split('\n').find(l => l.trim() && !l.startsWith('#'))?.trim() || '';
        return `<a href="/${to}/${name}.html" class="type-card"><div class="type-name">${title}</div><div class="type-desc">${desc.slice(0, 120)}</div></a>`;
      }).join('\n');
      const indexHtml = `<h1>${to.charAt(0).toUpperCase() + to.slice(1)}</h1>\n<div class="type-grid">${listHtml}</div>`;
      const outPath = join(DIST, to, 'index.html');
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, renderShell(to.charAt(0).toUpperCase() + to.slice(1), indexHtml, { activeUrl: `/${to}/index.html` }));
    }
  }
  }

  return pages;
}

// ─── Build type catalog ──────────────────────────────────

function buildTypeCatalog() {
  if (!TYPES) { console.warn('types.json not found, skipping type catalog'); return []; }
  const catalog = JSON.parse(readFileSync(TYPES, 'utf-8'));
  // Copy catalog to dist for client-side Type Explorer
  writeFileSync(join(DIST, 'types-catalog.json'), JSON.stringify(catalog));
  const pages = [];
  const allTypes = [];

  for (const [group, types] of Object.entries(catalog.types)) {
    for (const [name, def] of Object.entries(types)) {
      allTypes.push({ name, group, ...def });
    }
  }

  // Type index page
  const groupSections = ['input', 'output', 'context'].map(group => {
    const types = allTypes.filter(t => t.group === group);
    const cards = types.map(t => `
      <a href="/types/${t.name}.html" class="type-card">
        <div class="type-name">${t.name} <span class="badge badge-${t.group}">${t.group}</span></div>
        <div class="type-cat">${t.category}</div>
        <div class="type-desc">${t.description}</div>
      </a>`).join('\n');
    return `<h2>${group.charAt(0).toUpperCase() + group.slice(1)} Types (${types.length})</h2>\n<div class="type-grid">${cards}</div>`;
  }).join('\n');

  const indexHtml = `<h1>Type Catalog</h1>
<p class="page-subtitle">40 standard types across input, output, and context — the building blocks of typed AI agent capabilities.</p>
<div id="type-explorer-mount"></div>
${groupSections}`;

  const indexPath = join(DIST, 'types', 'index.html');
  mkdirSync(dirname(indexPath), { recursive: true });

  // Include type-explorer.js
  const explorerScript = existsSync(join(SRC, 'components', 'type-explorer.js'))
    ? `<script src="https://d3js.org/d3.v7.min.js"></script>\n<script type="module" src="/components/type-explorer.js"></script>`
    : '';
  writeFileSync(indexPath, renderShell('Type Catalog', indexHtml + explorerScript, { activeUrl: '/types/index.html' }));
  pages.push({ title: 'Type Catalog', url: '/types/index.html', content: '40 standard types across input, output, and context.' });

  // Individual type pages
  for (const t of allTypes) {
    const requiredFields = t.fields?.required?.map(f => `<li><code>${f}</code> <span class="badge badge-${t.group}">required</span></li>`).join('\n') || '<li><em>None</em></li>';
    const optionalFields = t.fields?.optional?.map(f => `<li><code>${f}</code></li>`).join('\n') || '<li><em>None</em></li>';
    const aliases = t.aliases?.length ? t.aliases.map(a => `<code>${a}</code>`).join(', ') : '<em>None</em>';
    const freq = t.frequency !== undefined ? `<div class="stat"><div class="stat-value">${Math.round(t.frequency * 100)}%</div><div class="stat-label">Frequency</div></div>` : '';
    const subtype = t.subtypeOf ? `<p>Structural subtype of: ${t.subtypeOf.map(s => `<a href="/types/${s}.html"><code>${s}</code></a>`).join(', ')}</p>` : '';

    const typeHtml = `
<h1>${t.name} <span class="badge badge-${t.group}">${t.group}</span></h1>
<p class="page-subtitle">${t.description}</p>
${subtype}
<div class="stats-bar" style="justify-content:flex-start;gap:32px;padding:0;margin-bottom:24px">
  ${freq}
  <div class="stat"><div class="stat-value" style="font-size:20px">${t.category}</div><div class="stat-label">Category</div></div>
</div>
<h2>Required Fields</h2>
<ul>${requiredFields}</ul>
<h2>Optional Fields</h2>
<ul>${optionalFields}</ul>
<h2>Aliases</h2>
<p>${aliases}</p>
<h2>Usage in effector.toml</h2>
<pre data-lang="toml"><code>[effector.interface]
${t.group === 'context' ? `context = ["${t.name}"]` : `${t.group} = "${t.name}"`}</code><button class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">Copy</button></pre>`;

    const outPath = join(DIST, 'types', t.name + '.html');
    writeFileSync(outPath, renderShell(t.name, typeHtml, { activeUrl: '/types/index.html' }));
    pages.push({ title: t.name, url: `/types/${t.name}.html`, content: t.description });
  }

  return pages;
}

// ─── Build API reference ─────────────────────────────────

function buildAPIReference() {
  if (!CORE) { console.warn('effector-core/src not found, skipping API ref'); return []; }
  const pages = [];
  const modules = readdirSync(CORE).filter(f => f.endsWith('.js') && f !== 'cli.js');
  const entries = [];

  for (const file of modules) {
    const src = readFileSync(join(CORE, file), 'utf-8');
    const exports = [];

    // Extract export function/const
    const exportRe = /export\s+(?:function|const|class)\s+(\w+)/g;
    let m;
    while ((m = exportRe.exec(src)) !== null) {
      // Look for JSDoc above
      const before = src.slice(0, m.index);
      const jsdocMatch = before.match(/\/\*\*\s*([\s\S]*?)\*\/\s*$/);
      const doc = jsdocMatch ? jsdocMatch[1].replace(/^\s*\*\s?/gm, '').trim() : '';
      exports.push({ name: m[1], doc });
    }

    if (exports.length > 0) {
      entries.push({ file, exports });
    }
  }

  const listHtml = entries.map(({ file, exports }) => {
    const funcs = exports.map(e => {
      const docHtml = e.doc ? `<p style="color:var(--text2);font-size:13px">${inlineMarkdown(e.doc.split('\n')[0])}</p>` : '';
      return `<li><code>${e.name}</code>${docHtml}</li>`;
    }).join('\n');
    return `<h3>${file}</h3>\n<ul>${funcs}</ul>`;
  }).join('\n');

  const apiHtml = `<h1>API Reference</h1>
<p class="page-subtitle">Exported functions and constants from <code>@effectorhq/core</code>.</p>
${listHtml}`;

  const outPath = join(DIST, 'api', 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderShell('API Reference', apiHtml, { activeUrl: '/api/index.html' }));
  pages.push({ title: 'API Reference', url: '/api/index.html', content: 'All exported functions from @effectorhq/core.' });
  return pages;
}

// ─── Build schema reference ──────────────────────────────

function buildSchemaReference() {
  if (!SCHEMA) { console.warn('effector.schema.json not found, skipping'); return []; }
  const schema = JSON.parse(readFileSync(SCHEMA, 'utf-8'));
  const formatted = JSON.stringify(schema, null, 2)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const schemaHtml = `<h1>Manifest Schema</h1>
<p class="page-subtitle">The JSON Schema that defines valid <code>effector.toml</code> manifests.</p>
<pre data-lang="json"><code>${formatted}</code><button class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">Copy</button></pre>`;

  const outPath = join(DIST, 'spec', 'schema.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, renderShell('Manifest Schema', schemaHtml, { activeUrl: '/spec/schema.html' }));
  return [{ title: 'Manifest Schema', url: '/spec/schema.html', content: 'JSON Schema for effector.toml.' }];
}

// ─── Build homepage ──────────────────────────────────────

function buildHomepage() {
  const homeTemplate = readFileSync(join(SRC, 'templates', 'home.html'), 'utf-8');
  const shell = readFileSync(join(SRC, 'templates', 'shell.html'), 'utf-8');

  const sidebarHtml = ''; // Home has no sidebar
  const description = 'we build hands for AI that moves first';
  const result = shell
    .replace('{{TITLE}}', 'effector — Typed Capability Layer for AI Agents')
    .replace('{{ASSET_VERSION}}', ASSET_VERSION)
    .replace('{{SIDEBAR}}', sidebarHtml)
    .replace('{{CONTENT}}', homeTemplate)
    .replace('{{DESCRIPTION}}', description)
    .replace('{{LAYOUT_CLASS}}', 'layout-home')
    .replace(/\{\{ACTIVE_NAV_(\w+)\}\}/g, (_, key) => key === 'HOME' ? 'active' : '');

  writeFileSync(join(DIST, 'index.html'), result);
  return [{ title: 'Home', url: '/', content: 'effector — the typed capability layer for AI agents.' }];
}

// ─── Build playground ────────────────────────────────────

function buildPlayground() {
  if (!existsSync(join(SRC, 'templates', 'playground.html'))) return [];
  const tpl = readFileSync(join(SRC, 'templates', 'playground.html'), 'utf-8');
  const outPath = join(DIST, 'playground.html');
  writeFileSync(outPath, renderShell('Playground', tpl, { activeUrl: '/playground.html' }));
  return [{ title: 'Playground', url: '/playground.html', content: 'Interactive TOML playground.' }];
}

// ─── Search index ────────────────────────────────────────

function buildSearchIndex(pages) {
  const index = pages.map(p => ({
    t: p.title,
    u: p.url,
    c: p.content?.replace(/<[^>]+>/g, '').replace(/[#*`\[\]]/g, '').slice(0, 200) || '',
  }));
  writeFileSync(join(DIST, 'search-index.json'), JSON.stringify(index));
}

// ─── Copy static assets ─────────────────────────────────

function copyAssets() {
  // CSS
  mkdirSync(join(DIST, 'styles'), { recursive: true });
  copyFileSync(join(SRC, 'styles', 'main.css'), join(DIST, 'styles', 'main.css'));

  // Components (JS)
  mkdirSync(join(DIST, 'components'), { recursive: true });
  const compDir = join(SRC, 'components');
  if (existsSync(compDir)) {
    for (const f of readdirSync(compDir)) {
      if (f.endsWith('.js')) copyFileSync(join(compDir, f), join(DIST, 'components', f));
    }
  }

  // Assets
  mkdirSync(join(DIST, 'assets'), { recursive: true });
  const assetsDir = join(SRC, 'assets');
  if (existsSync(assetsDir)) {
    for (const f of readdirSync(assetsDir)) {
      copyFileSync(join(assetsDir, f), join(DIST, 'assets', f));
    }
  }
}

function writePagesCname() {
  // Keep GitHub Pages custom domain persistent on every build output.
  writeFileSync(join(DIST, 'CNAME'), 'effector.wtf\n');
}

function getSiteBaseUrl() {
  // Allow local/dev overrides without changing code.
  return (
    process.env.EFFECTOR_SITE_URL ||
    process.env.SITE_BASE_URL ||
    'https://effector.wtf'
  ).replace(/\/+$/, '');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function copyDotFiles() {
  const dotDir = join(ROOT, '.dot');
  if (!existsSync(dotDir)) return;

  // sitemap.xml / robots.txt are generated to keep them accurate.
  const skip = new Set(['sitemap.xml', 'robots.txt']);

  for (const entry of readdirSync(dotDir, { withFileTypes: true })) {
    const f = entry.name;
    const from = join(dotDir, f);
    if (!f || skip.has(f)) continue;
    if (!existsSync(from)) continue;
    if (!entry.isFile()) continue;
    copyFileSync(from, join(DIST, f));
  }
}

function writeCrawlerFiles(pages) {
  const baseUrl = getSiteBaseUrl();
  const today = new Date().toISOString().slice(0, 10);
  const locSet = new Set();

  for (const p of pages || []) {
    if (!p || typeof p.url !== 'string') continue;
    const raw = p.url.trim();
    if (!raw) continue;

    let loc = raw;
    if (loc === '/') {
      loc = baseUrl + '/';
    } else if (loc.startsWith('http://') || loc.startsWith('https://')) {
      // keep absolute
    } else if (loc.startsWith('/')) {
      loc = baseUrl + loc;
    } else {
      loc = baseUrl + '/' + loc;
    }

    locSet.add(loc);
  }

  const sortedLoc = Array.from(locSet).sort();
  const urlsXml = sortedLoc
    .map(loc => `  <url><loc>${escapeXml(loc)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`)
    .join('\n');

  const sitemapTemplatePath = join(ROOT, '.dot', 'sitemap.xml');
  let sitemapXml = '';
  if (existsSync(sitemapTemplatePath)) {
    const tpl = readFileSync(sitemapTemplatePath, 'utf-8');
    sitemapXml = tpl.replace('{{URLS}}', `\n${urlsXml}\n`);
  } else {
    sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`;
  }
  writeFileSync(join(DIST, 'sitemap.xml'), sitemapXml.endsWith('\n') ? sitemapXml : sitemapXml + '\n');

  const robotsTemplatePath = join(ROOT, '.dot', 'robots.txt');
  let robots = '';
  if (existsSync(robotsTemplatePath)) {
    robots = readFileSync(robotsTemplatePath, 'utf-8');
    robots = robots.replace(
      /^Sitemap:.*$/m,
      `Sitemap: ${baseUrl}/sitemap.xml`
    );
  } else {
    robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;
  }
  writeFileSync(join(DIST, 'robots.txt'), robots.endsWith('\n') ? robots : robots + '\n');
}

// ─── Helpers ─────────────────────────────────────────────

function findMarkdown(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...findMarkdown(join(dir, entry.name)));
    } else if (entry.name.endsWith('.md')) {
      results.push(join(dir, entry.name));
    }
  }
  return results.sort();
}

function extractTitle(body) {
  const m = body.match(/^#\s+(.+)/m);
  return m ? m[1] : null;
}

// ─── Prev/Next Navigation ─────────────────────────────

function getPageOrder() {
  const order = [];
  for (const section of SIDEBAR) {
    for (const item of section.items) {
      order.push(item);
    }
  }
  return order;
}

function injectPageNav(filePath, activeUrl) {
  const order = getPageOrder();
  const idx = order.findIndex(p => p.url === activeUrl);
  if (idx === -1) return;

  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx < order.length - 1 ? order[idx + 1] : null;

  if (!prev && !next) return;

  let html = readFileSync(filePath, 'utf-8');
  const navHtml = `
    <nav class="page-nav">
      ${prev ? `<a href="${prev.url}"><span class="nav-label">Previous</span><span class="nav-title">&larr; ${prev.title}</span></a>` : '<span></span>'}
      ${next ? `<a href="${next.url}" class="next"><span class="nav-label">Next</span><span class="nav-title">${next.title} &rarr;</span></a>` : '<span></span>'}
    </nav>`;

  // Insert before closing </article>
  html = html.replace('</article>', navHtml + '\n    </article>');
  writeFileSync(filePath, html);
}

// ─── Main ────────────────────────────────────────────────

console.log('Building effector-docs...');
const t0 = Date.now();

// Clean dist
mkdirSync(DIST, { recursive: true });

const allPages = [];
allPages.push(...buildHomepage());
allPages.push(...buildMarkdownPages());
allPages.push(...buildTypeCatalog());
allPages.push(...buildAPIReference());
allPages.push(...buildSchemaReference());
allPages.push(...buildPlayground());
copyAssets();
copyDotFiles();
writePagesCname();
writeCrawlerFiles(allPages);
buildSearchIndex(allPages);

// Inject prev/next navigation into sidebar-linked pages
const order = getPageOrder();
for (const page of order) {
  const filePath = join(DIST, page.url);
  if (existsSync(filePath)) {
    injectPageNav(filePath, page.url);
  }
}

console.log(`Done. ${allPages.length} pages generated in ${Date.now() - t0}ms → dist/`);
