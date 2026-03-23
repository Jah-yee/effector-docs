# effector-docs

Static documentation site for **effector** (typed capability layer). Built with zero-runtime `build.js` → `dist/`.

## Clone

```bash
git clone https://github.com/effectorHQ/effector-docs.git
cd effector-docs
git submodule update --init --recursive
npm install
node build.js
```

## Develop

```bash
npm run dev   # serve.js --watch
```

## Deploy (Vercel)

Connect this repo to Vercel. `vercel.json` runs submodules + `npm install` + `node build.js`. See [VERCEL.md](./VERCEL.md).

## Layout

| Source | Role |
|--------|------|
| `content/` | Product pages (markdown) |
| `docs-content/` | Submodule → [effectorHQ/docs](https://github.com/effectorHQ/docs) (guides, blog, adoption) |
| `vendor/effector-spec/` | Bundled JSON Schema (sync from effector-spec when it changes) |
| `node_modules/@effectorhq/types` | `types.json` for type catalog |
| `node_modules/@effectorhq/core` | `src/` for API reference |

For a **local monorepo** (sibling `docs/`, `effector-types/`, etc.), paths under `..` are still detected automatically.

## License

This project is currently licensed under the [Apache License, Version 2.0](LICENSE.md) 。
