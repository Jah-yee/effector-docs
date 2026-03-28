---
title: Quick Start
subtitle: Get a typed AI agent tool running in under 2 minutes.
---

# Quick Start

This guide takes you from zero to a validated, compiled AI agent tool in under 2 minutes.

## Prerequisites

- **Node.js 18+** (check with `node -v`)
- A terminal

## Step 1: Scaffold

```bash
npx @effectorhq/cli init my-tool
cd my-tool
```

This generates a complete project:

```
my-tool/
├── effector.toml        # Typed manifest (the core of effector)
└── SKILL.md             # Human-readable capability description
```

No questions asked. The generated files are ready to validate and compile immediately.

## Step 2: Understand the Manifest

Open `effector.toml` — this is the typed interface definition:

```toml
[effector]
name = "my-tool"
version = "0.1.0"
description = "Reviews code diffs and produces structured review reports"
type = "skill"

[effector.interface]
input = "CodeDiff"
output = "ReviewReport"
context = ["Repository", "GitHubCredentials"]

[effector.permissions]
network = true
subprocess = false
filesystem = ["read"]
env-read = ["GITHUB_TOKEN"]
```

The `[effector.interface]` section is the heart. It declares:
- **input** — what data the tool accepts (from 42 standard types)
- **output** — what the tool produces
- **context** — what runtime environment it needs (credentials, configs)

## Step 3: Check

```bash
effector check .
```

```
  my-tool v0.1.0

  Manifest    ✓ valid
  Types       ✓ CodeDiff → ReviewReport (known, compatible)
  Lint        ✓ 0 warnings
  Audit       ✓ Score 5/5

  ✓ All checks passed (3.1ms)

  → Next: effector compile . -t mcp
```

One command does everything: validates the manifest schema, checks types against the 42-type catalog, lints SKILL.md, and runs a security audit. If there are errors, it tells you exactly what to fix.

## Step 4: Compile

Generate a runtime-specific tool definition:

```bash
# For MCP (Claude, Cursor, Windsurf)
effector compile . -t mcp

# For OpenAI Agents
effector compile . -t openai-agents

# For LangChain (Python)
effector compile . -t langchain

# Raw JSON IR
effector compile . -t json
```

The compiler reads your `effector.toml` and outputs a ready-to-use tool definition for your target runtime. **One manifest, any runtime.**

## Step 5: Inspect (Optional)

See the full parsed interface:

```bash
effector inspect .
```

```
  my-tool v0.1.0 (skill)
  Reviews code diffs and produces structured review reports

  Interface
    input    CodeDiff
    output   ReviewReport
    context  Repository, GitHubCredentials

  Permissions
    network      yes
    subprocess   no
    filesystem   read
```

## Step 6: Iterate

Edit `effector.toml` to refine your types. As your tool evolves:

1. Update the interface types to be more specific (e.g., `String` → `CodeSnippet`)
2. Add context requirements (e.g., `context = ["GitHubCredentials"]`)
3. Declare actual permissions (`network = true` if you make API calls)
4. Run `effector check .` after each change

## The Full Workflow

```
effector init       →  scaffold typed manifest
       ↓
  edit effector.toml  →  define types + permissions
       ↓
  effector check .    →  validate + type-check + lint + audit
       ↓
  effector compile .  →  compile to mcp / openai / langchain / json
       ↓
  effector serve .    →  run as typed MCP server (optional)
```

## What to Learn Next

- [Your First Manifest](/first-manifest.html) — build `effector.toml` field by field with a real example
- [Type System](/type-system.html) — understand the 42-type catalog
- [CLI Reference](/cli-reference.html) — all commands and options
- [Examples & Cookbook](/guides/examples.html) — practical patterns
