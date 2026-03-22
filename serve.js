#!/usr/bin/env node
/**
 * Dev server for effector-docs.
 * Serves dist/ with live reload on file changes.
 *
 * Usage:
 *   node serve.js           # serve dist/
 *   node serve.js --watch   # rebuild + serve on changes
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, watch } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = new URL('.', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const WATCH = process.argv.includes('--watch');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// Initial build
if (!existsSync(join(DIST, 'index.html'))) {
  console.log('Building...');
  execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });
}

const server = createServer((req, res) => {
  let url = req.url.split('?')[0];

  // Clean URLs: /overview → /overview.html
  if (!extname(url) && !url.endsWith('/')) url += '.html';
  if (url.endsWith('/')) url += 'index.html';

  const file = join(DIST, url);
  try {
    const data = readFileSync(file);
    const ext = extname(file);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'text/plain',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    // Try with .html extension
    try {
      const htmlFile = file.replace(/\/?$/, '.html');
      const data = readFileSync(htmlFile);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1><p><a href="/">Back to home</a></p>');
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n  effector-docs dev server`);
  console.log(`  http://localhost:${PORT}\n`);
});

// Watch mode
if (WATCH) {
  let building = false;
  const rebuild = () => {
    if (building) return;
    building = true;
    console.log('Rebuilding...');
    try {
      execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });
    } catch (e) {
      console.error('Build failed:', e.message);
    }
    building = false;
  };

  for (const dir of ['src', 'content']) {
    const watchDir = join(ROOT, dir);
    if (existsSync(watchDir)) {
      watch(watchDir, { recursive: true }, () => {
        setTimeout(rebuild, 200); // Debounce
      });
    }
  }

  // Also watch docs/ directory
  const docsDir = join(ROOT, '..', 'docs');
  if (existsSync(docsDir)) {
    watch(docsDir, { recursive: true }, () => {
      setTimeout(rebuild, 200);
    });
  }

  console.log('  Watching for changes...\n');
}
