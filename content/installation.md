---
title: Installation
subtitle: Get effector running in 30 seconds.
---

# Installation

## Requirements

- **Node.js 18+** (uses built-ins like `parseArgs`)
- npm, yarn, or pnpm

## Quick Start

The fastest way to start:

```bash
npx @effectorhq/cli init my-skill
cd my-skill
effector check .
effector compile . -t mcp
```

This creates a complete project with `effector.toml` and `SKILL.md`, validates it, and compiles to MCP — all with zero configuration.

## Install the CLI

For system-wide access:

```bash
npm install -g @effectorhq/cli
```

Now you can run from anywhere:

```bash
effector init my-skill           # scaffold a typed skill manifest
effector check .                 # validate + type-check + lint + audit
effector compile . -t mcp        # compile to MCP tool schema
effector inspect .               # show parsed interface + permissions
```

Or run directly without installing:

```bash
npx @effectorhq/cli check .
```

## Per-Project Setup

Add to an existing project's `package.json`:

```json
{
  "devDependencies": {
    "@effectorhq/cli": "^1.0.0"
  },
  "scripts": {
    "check": "effector check .",
    "compile:mcp": "effector compile . -t mcp"
  }
}
```

## Adding to an Existing MCP Server

If you have an existing MCP server and want to generate `effector.toml` automatically:

```bash
effector init --from-mcp .
```

This scans your source code, detects tool definitions, infers types and permissions, and generates a well-commented `effector.toml`.

## The Toolkit

| Package | Purpose | Install |
|---------|---------|---------|
| `@effectorhq/cli` | **The product.** init, check, compile, inspect, serve. | `npm i -g @effectorhq/cli` |
| `@effectorhq/core` | Embeddable zero-dep kernel. Parse, validate, compile. | `npm i @effectorhq/core` |
| `@effectorhq/serve` | Typed MCP server with preflight validation. | `npm i @effectorhq/serve` |

Internal packages (used by CLI, not installed separately): `@effectorhq/types`, `@effectorhq/audit`, `@effectorhq/compose`, `@effectorhq/lint`.

## Verify Installation

After installation, verify everything works:

```bash
# Check version
effector --version

# Scaffold and validate
effector init test-skill
effector check test-skill
effector compile test-skill -t mcp
```

## CI Integration

Add effector validation to your CI:

```yaml
# .github/workflows/effector.yml
- run: npx @effectorhq/cli check . --json
```

Or use the GitHub Action:

```yaml
- uses: effectorHQ/effector-action@v1
  with:
    path: '.'
    fail-on-warnings: 'true'
```

See the [CI/CD Integration guide](/guides/ci-integration.html) for a complete workflow file.

## Troubleshooting

**"effector: command not found"**
Make sure Node.js 18+ is installed and the CLI is installed globally (`npm i -g @effectorhq/cli`), or use `npx @effectorhq/cli`.

**"Cannot find module @effectorhq/core"**
Make sure the package is installed (`npm install @effectorhq/core`) and the version is correct.

**"Unknown type" warnings**
Your `effector.toml` references a type not in the 42-type catalog. Run `effector inspect .` to see your current interface, or check the type catalog for valid names.

## Next Steps

- [Your First Manifest](/first-manifest.html) — build an effector.toml step by step
- [CLI Reference](/cli-reference.html) — all commands and flags
- [Type Catalog](/types/index.html) — browse the 42 standard types
