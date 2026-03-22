---
title: Installation
subtitle: Get effector running in 30 seconds.
---

# Installation

## Requirements

- **Node.js 22+** (uses modern built-ins like `parseArgs`)
- npm, yarn, or pnpm

## Quick Start

The fastest way to start is with the scaffolder:

```bash
npx create-effector my-skill
cd my-skill
```

This creates a complete project with `effector.toml`, `SKILL.md`, and a working test setup.

## Install the CLI

To add effector validation to an existing project:

```bash
npm install @effectorhq/core
```

Then validate your manifest:

```bash
npx @effectorhq/core validate .
```

## Global Installation

For system-wide CLI access:

```bash
npm install -g @effectorhq/core
```

Now you can run from anywhere:

```bash
effector-core validate ./my-project
effector-core types
effector-core compile ./my-project -t mcp
```

## Per-Project Setup

Add to an existing project's `package.json`:

```json
{
  "devDependencies": {
    "@effectorhq/core": "^1.0.0"
  },
  "scripts": {
    "validate": "effector-core validate .",
    "compile:mcp": "effector-core compile . -t mcp"
  }
}
```

## Adding to an Existing MCP Server

If you have an existing MCP server and want to generate `effector.toml` automatically:

```bash
npx @effectorhq/core init --from-mcp .
```

This scans your source code, detects tool definitions, infers types and permissions, and generates a well-commented `effector.toml`.

## The Full Toolkit

| Package | Purpose | Install |
|---------|---------|---------|
| `@effectorhq/core` | Parse, validate, type-check, compile | `npm i @effectorhq/core` |
| `create-effector` | Scaffold new projects | `npx create-effector` |
| `@effectorhq/skill-lint` | Validate SKILL.md structure | `npm i @effectorhq/skill-lint` |
| `@effectorhq/audit` | Security & permission audit | `npm i @effectorhq/audit` |
| `@effectorhq/compose` | Composition checking | `npm i @effectorhq/compose` |
| `@effectorhq/graph` | Dependency visualization | `npm i @effectorhq/graph` |
| `@effectorhq/skill-eval` | Quality scoring | `npm i @effectorhq/skill-eval` |

## Verify Installation

After installation, verify everything works:

```bash
# Check version
npx @effectorhq/core --version

# List all 40 standard types
npx @effectorhq/core types

# Validate a project
npx @effectorhq/core validate .
```

## CI Integration

Add effector validation to your GitHub Actions workflow:

```yaml
- uses: effectorHQ/effector-action@v1
  with:
    path: '.'
    fail-on-warnings: 'true'
```

See the [CI/CD Integration guide](/guides/ci-integration.html) for a complete workflow file.

## Troubleshooting

**"effector-core: command not found"**
Make sure Node.js 22+ is installed and `node_modules/.bin` is in your PATH, or use `npx @effectorhq/core`.

**"Cannot find module @effectorhq/core"**
Make sure the package is installed (`npm install @effectorhq/core`) and the version is correct.

**"Unknown type" warnings**
Your `effector.toml` references a type not in the 40-type catalog. Run `npx @effectorhq/core types` to see all valid types, or use `String`/`JSON` as a generic fallback.

## Next Steps

- [Your First Manifest](/first-manifest.html) — build an effector.toml step by step
- [CLI Reference](/cli-reference.html) — all commands and flags
- [Type Catalog](/types/index.html) — browse the 40 standard types
