---
title: Studio
subtitle: Visual editor for creating typed AI agent capabilities.
---

# Studio

The effector Studio is a visual editor for creating `effector.toml` and `SKILL.md` manifests. Fill in form fields, pick types from the catalog, set permissions — the manifest is generated automatically.

## When to use Studio

- Need a form-based authoring flow instead of writing TOML manually
- Need to export final files (`effector.toml`, `SKILL.md`) for real project usage
- Need non-technical teammates to edit capability metadata safely

If you only need a quick validation loop, use [Playground](/playground.html).

## Features

- **Visual form** — name, version, type, description with instant preview
- **Type picker** — select from all 40 standard types for input, output, and context
- **Permission toggles** — network, subprocess, filesystem, env-read
- **Compile targets** — preview MCP, OpenAI, LangChain, and JSON IR output
- **SKILL.md editor** — write instructions with live preview
- **Export** — download the generated files or copy to clipboard

## Run Locally

```bash
cd studio
node src/server.js
# → http://localhost:7432
```

Or with a custom port:

```bash
node src/server.js --port 8080
```

## API

Studio also exposes an HTTP API for programmatic access:

```bash
# Validate a manifest
curl -X POST http://localhost:7432/api/validate \
  -H "Content-Type: application/json" \
  -d '{"toml": "[effector]\nname = \"test\""}'

# Compile to a target
curl -X POST http://localhost:7432/api/compile \
  -H "Content-Type: application/json" \
  -d '{"toml": "...", "target": "mcp"}'
```

## Source

- **Repository**: [effectorHQ/studio](https://github.com/effectorHQ/studio)
- **Architecture**: Single-file HTML app (`src/app.html`) with Node.js server (`src/server.js`)
- **Dependencies**: Zero (Node.js built-ins only)
