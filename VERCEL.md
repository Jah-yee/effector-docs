# Deploying effector-docs to Vercel

The site is **static**: after `npm install`, `node build.js` writes to `dist/`.

## Default: single repo `effectorHQ/effector-docs`

This repo is **self-contained** for CI:

| Input | How it is resolved |
|-------|---------------------|
| Guides / blog / adoption | **Git submodule** `docs-content/` → [effectorHQ/docs](https://github.com/effectorHQ/docs) |
| `types.json` | `node_modules/@effectorhq/types` (`npm install`) |
| `effector-core` sources (API ref) | `node_modules/@effectorhq/core/src` |
| JSON Schema | **Vendored** `vendor/effector-spec/schemas/effector.schema.json` (update when spec changes) |

`vercel.json` sets:

```text
installCommand: git submodule update --init --recursive && npm install
buildCommand:  node build.js
outputDirectory: dist
```

Enable **Node 20+** in Vercel project settings.

---

## Option — Monorepo (OpenClawHQ-style)

If `effector-docs` lives next to sibling folders `docs/`, `effector-types/`, `effector-spec/`, `effector-core/`, `build.js` still picks those from `..` **after** checking `node_modules` / `vendor` / `docs-content`. You can point Vercel at subfolder `effector-docs` with the same build commands if the **whole monorepo** is one Git project.

---

## Prebuilt `dist/` only

```bash
cd effector-docs
git submodule update --init --recursive
npm install
node build.js
vercel dist/ --prod
```

---

## Homepage IA

Product home uses **6 sections** (Before/After, How It Works, Adoption, Ecosystem, Try It, CTA) under `content/` + templates in `src/`.
