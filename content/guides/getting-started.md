---
title: Quick Start
subtitle: Get a typed AI agent tool running in under 5 minutes.
---

# Quick Start

This guide takes you from zero to a validated, compiled AI agent tool in under 5 minutes.

## Prerequisites

- **Node.js 22+** (check with `node -v`)
- A terminal

## Step 1: Scaffold

```bash
npx create-effector my-tool
cd my-tool
```

The scaffolder asks a few questions — tool name, description, input/output types, permissions — then generates a complete project:

```
my-tool/
├── effector.toml        # Typed manifest (the core of effector)
├── SKILL.md             # Human-readable capability description
├── src/
│   └── index.js         # Implementation stub
├── tests/
│   └── index.test.js    # Test scaffold
└── package.json
```

## Step 2: Understand the Manifest

Open `effector.toml` — this is the typed interface definition:

```toml
[effector]
name = "my-tool"
version = "0.1.0"
description = "A short description of what this tool does"
type = "skill"

[effector.interface]
input = "String"
output = "Markdown"
context = []

[effector.permissions]
network = false
subprocess = false
filesystem = []
env-read = []
```

The `[effector.interface]` section is the heart. It declares:
- **input** — what data the tool accepts (from 40 standard types)
- **output** — what the tool produces
- **context** — what runtime environment it needs (credentials, configs)

## Step 3: Validate

```bash
npx @effectorhq/core validate .
```

```
✓ effector.toml parsed successfully
✓ Schema validation passed
✓ Types valid: String (input), Markdown (output)
✓ SKILL.md parsed successfully
```

If there are errors, the validator tells you exactly what to fix.

## Step 4: Check Types

```bash
npx @effectorhq/core check-types .
```

This verifies that all types in your manifest exist in the 40-type catalog and reports their categories, frequencies, and field definitions.

## Step 5: Compile

Generate a runtime-specific tool definition:

```bash
# For MCP
npx @effectorhq/core compile . -t mcp

# For OpenAI Agents
npx @effectorhq/core compile . -t openai-agents

# For LangChain
npx @effectorhq/core compile . -t langchain
```

The compiler reads your `effector.toml` and outputs a ready-to-use tool definition for your target runtime. **One manifest, any runtime.**

## Step 6: Iterate

Edit `effector.toml` to refine your types. As your tool evolves:

1. Update the interface types to be more specific (e.g., `String` → `CodeSnippet`)
2. Add context requirements (e.g., `context = ["GitHubCredentials"]`)
3. Declare actual permissions (`network = true` if you make API calls)
4. Run `npx @effectorhq/core validate .` after each change

## The Full Workflow

```
create-effector    →  scaffold project
       ↓
  edit effector.toml  →  define types + permissions
       ↓
  validate + check-types  →  catch errors statically
       ↓
  compile -t mcp    →  generate runtime schema
       ↓
  audit (optional)  →  verify permissions match code
```

## What to Learn Next

- [Your First Manifest](/first-manifest.html) — build `effector.toml` field by field with a real example
- [Type System](/type-system.html) — understand the 40-type catalog
- [CLI Reference](/cli-reference.html) — all commands and options
- [Examples & Cookbook](/guides/examples.html) — practical patterns
