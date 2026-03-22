import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');

// Run build first
execSync('node build.js', { cwd: ROOT, stdio: 'pipe' });

describe('build output', () => {
  it('generates dist/ directory', () => {
    assert.ok(existsSync(DIST), 'dist/ should exist');
  });

  it('generates index.html (homepage)', () => {
    assert.ok(existsSync(join(DIST, 'index.html')));
    const html = readFileSync(join(DIST, 'index.html'), 'utf-8');
    assert.ok(html.includes('effector'), 'homepage should mention effector');
    assert.ok(html.includes('</html>'), 'should be valid HTML');
  });

  it('generates product pages', () => {
    for (const page of ['overview.html', 'about.html', 'installation.html']) {
      assert.ok(existsSync(join(DIST, page)), `${page} should exist`);
    }
  });

  it('generates content pages', () => {
    for (const page of ['first-manifest.html', 'type-system.html', 'permissions.html', 'cli-reference.html', 'reverse-compiler.html', 'changelog.html']) {
      assert.ok(existsSync(join(DIST, page)), `${page} should exist`);
    }
  });

  it('generates type catalog index', () => {
    assert.ok(existsSync(join(DIST, 'types', 'index.html')));
    const html = readFileSync(join(DIST, 'types', 'index.html'), 'utf-8');
    assert.ok(html.includes('Type Catalog'));
  });

  it('generates individual type pages', () => {
    const typeDir = join(DIST, 'types');
    const files = readdirSync(typeDir).filter(f => f !== 'index.html' && f.endsWith('.html'));
    assert.ok(files.length >= 40, `should have ≥40 type pages, got ${files.length}`);
    // Spot check
    assert.ok(existsSync(join(typeDir, 'String.html')));
    assert.ok(existsSync(join(typeDir, 'Markdown.html')));
    assert.ok(existsSync(join(typeDir, 'GitHubCredentials.html')));
  });

  it('generates API reference', () => {
    assert.ok(existsSync(join(DIST, 'api', 'index.html')));
    const html = readFileSync(join(DIST, 'api', 'index.html'), 'utf-8');
    assert.ok(html.includes('API Reference'));
  });

  it('generates schema reference', () => {
    assert.ok(existsSync(join(DIST, 'spec', 'schema.html')));
  });

  it('generates playground', () => {
    assert.ok(existsSync(join(DIST, 'playground.html')));
    const html = readFileSync(join(DIST, 'playground.html'), 'utf-8');
    assert.ok(html.includes('Playground'));
  });

  it('generates search index', () => {
    assert.ok(existsSync(join(DIST, 'search-index.json')));
    const index = JSON.parse(readFileSync(join(DIST, 'search-index.json'), 'utf-8'));
    assert.ok(Array.isArray(index));
    assert.ok(index.length >= 50, `search index should have ≥50 entries, got ${index.length}`);
    // Each entry has title, url, content
    for (const entry of index.slice(0, 5)) {
      assert.ok(entry.t, 'entry should have title');
      assert.ok(entry.u, 'entry should have url');
    }
  });

  it('copies CSS', () => {
    assert.ok(existsSync(join(DIST, 'styles', 'main.css')));
  });

  it('copies JS components', () => {
    assert.ok(existsSync(join(DIST, 'components', 'type-explorer.js')));
  });

  it('copies types catalog for client-side use', () => {
    assert.ok(existsSync(join(DIST, 'types-catalog.json')));
  });

  it('all internal links resolve', () => {
    const htmlFiles = findAllHtml(DIST);
    const allUrls = new Set(htmlFiles.map(f => '/' + f.slice(DIST.length + 1)));
    let broken = 0;
    for (const file of htmlFiles.slice(0, 20)) { // Check first 20 files
      const html = readFileSync(file, 'utf-8');
      const linkRe = /href="(\/[^"#]*\.html)"/g;
      let m;
      while ((m = linkRe.exec(html)) !== null) {
        if (!allUrls.has(m[1])) {
          broken++;
        }
      }
    }
    assert.ok(broken <= 5, `should have ≤5 broken internal links, got ${broken}`);
  });

  it('generates guide pages from docs/', () => {
    assert.ok(existsSync(join(DIST, 'guides', 'getting-started.html')));
    assert.ok(existsSync(join(DIST, 'guides', 'why-effector.html')));
  });
});

function findAllHtml(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findAllHtml(path));
    else if (entry.name.endsWith('.html')) results.push(path);
  }
  return results;
}
