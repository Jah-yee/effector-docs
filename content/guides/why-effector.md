---
title: Why effector.toml
subtitle: The case for adding a typed sidecar manifest to AI agent tools.
---

# Why effector.toml

## The Status Quo is Broken

Today, AI agent tools describe themselves with unstructured metadata — a name, a description string, and maybe a JSON Schema for parameters. That's it.

This is equivalent to JavaScript before TypeScript: everything "works" until you try to compose two libraries and discover they're incompatible. Except with AI agents, you discover the incompatibility *after* burning tokens, making API calls, and waiting for responses.

## What effector.toml Adds

A single file. Drop it next to your existing tool. No code changes required.

```toml
[effector]
name = "code-review"
version = "1.0.0"
description = "Reviews code changes and produces structured reports"
type = "skill"

[effector.interface]
input = "CodeDiff"
output = "ReviewReport"
context = ["Repository", "CodingStandards"]

[effector.permissions]
network = false
subprocess = false
filesystem = ["read"]
env-read = []
```

This 14-line file gives you:

### 1. Type-Safe Composition

Before effector:
> "I'll chain the review tool with the notification tool... hope the output format matches."

After effector:
```bash
npx @effectorhq/core compose check ./code-review ./slack-notify
# ✓ ReviewReport → SlackMessage (compatible via Notification supertype)
```

### 2. Cross-Runtime Portability

Before effector:
> "This tool only works with MCP. We need to rewrite it for LangChain."

After effector:
```bash
npx @effectorhq/core compile . -t mcp
npx @effectorhq/core compile . -t langchain
npx @effectorhq/core compile . -t openai-agents
```

One manifest, any runtime. Your tool's implementation doesn't change.

### 3. Declared Permissions

Before effector:
> "Does this tool access the network? Let me read through the source code..."

After effector:
```toml
[effector.permissions]
network = false     # Explicit: no network access
filesystem = ["read"]  # Read-only filesystem
```

And `@effectorhq/audit` verifies these declarations match actual behavior.

### 4. Discoverable Interfaces

Before effector:
> "I need a tool that produces security reports from code. Let me search GitHub..."

After effector:
```bash
npx @effectorhq/core types | grep SecurityReport
# SecurityReport (output, analysis) — subtype of ReviewReport
```

Tools are discoverable by what they accept and produce, not just by name.

## The TypeScript Analogy

| JavaScript → TypeScript | AI Tools → effector |
|------------------------|-------------------|
| `.js` files | Tool implementations |
| `.d.ts` type definitions | `effector.toml` manifests |
| `lib.d.ts` standard library | `effector-types` (40 types) |
| `tsc` compiler | `@effectorhq/core compile` |
| Type checking | `@effectorhq/core check-types` |
| No runtime overhead | No runtime overhead (sidecar) |

TypeScript didn't replace JavaScript. It added a type layer that made the ecosystem dramatically better. Effector does the same for AI agent tools.

## Cost of Adoption

- **Zero code changes** — `effector.toml` is a sidecar file
- **Zero dependencies** — the toolchain uses only Node.js built-ins
- **Zero runtime overhead** — effector runs at build/CI time only
- **5 minutes to start** — `npx create-effector my-tool` scaffolds everything

## Who Benefits

- **Tool authors**: Types make your tool more discoverable and composable
- **Platform teams**: Validate tool definitions in CI before deployment
- **Agent builders**: Verify pipeline compatibility statically
- **Security teams**: Audit permissions without reading source code

## Next Steps

- [Installation](/installation.html) — get started
- [Quick Start](/guides/getting-started.html) — build your first typed tool
- [Type System](/type-system.html) — explore the 40-type catalog
