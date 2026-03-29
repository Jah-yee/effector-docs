---
title: Overview
subtitle: What effector is, why it exists, and how it fits into the AI agent landscape.
---

# Overview

**Effector** is the standard toolkit for typed AI agent tool interoperability. It adds a typed interface layer to AI agent tools — 42 standard capability types, static composition checking, and cross-runtime compilation from a single sidecar manifest.

AI agent capabilities are in the pre-TypeScript era. `effector-types` is the `lib.d.ts` for Effectors — the standard library of capability types grounded in real-world usage from 13,000+ analyzed tools.

## The Problem

Every AI agent tool has an implicit interface: it takes *something*, produces *something*, and needs *something* from the environment. But today, these interfaces are invisible. The consequences:

- **Composition by prayer.** You chain two MCP tools and discover at runtime that they're incompatible — after burning tokens, time, and API calls.
- **Runtime lock-in.** MCP tools only work in MCP. LangChain tools only work in Python. Your capability definitions are trapped in one ecosystem.
- **Discovery by keyword.** Finding a tool that produces `ReviewReport` from `CodeDiff` requires reading READMEs, not querying a type catalog.
- **Implicit security.** Whether a tool accesses the network or filesystem is buried in implementation, not declared in metadata.

## The Solution

Effector adds a typed interface layer to AI agent tools. It's a sidecar manifest — your tool keeps running exactly as before. Drop an `effector.toml` next to your tool:

Now your tool has:

1. **Type-safe interfaces** — input/output/context from 42 standard capability types
2. **Static composition checking** — verify tool chains before execution
3. **Cross-runtime portability** — compile to MCP, OpenAI, LangChain, or JSON
4. **Security auditing** — declared permissions vs actual behavior

## How It Compares

| Feature | Raw MCP | LangChain | CrewAI | **effector** |
|---------|---------|-----------|--------|------------|
| Type safety | None | None | None | **42 standard types** |
| Composition | Manual | Runtime only | Rigid roles | **Static verification** |
| Cross-runtime | MCP only | Python only | Python only | **MCP, OpenAI, LangChain, JSON IR** |
| Discovery | By name | By name | By name | **By input/output type** |
| Dependencies | Varies | Heavy | Heavy | **Zero** |
| Permission model | None | None | None | **Declared + audited** |
| Existing tools | N/A | Rewrite | Rewrite | **Unchanged (sidecar)** |

## The Toolchain

effector is a cohesive ecosystem of focused tools, each doing one thing well:

### Choose by task

- **Validate fast**: [Playground](/playground.html) — edit TOML and get immediate validation/compile output
- **Author visually**: [Studio](/studio.html) — form-based manifest + SKILL.md generation
- **Migrate existing MCP**: [Reverse Compiler](/reverse-compiler.html) — generate first-draft manifest from code
- **Analyze registries**: [Graph Explorer](/graph.html) — graph, spectrum, dashboard, diff

| Tool | What it does |
|------|-------------|
| `@effectorhq/cli` | **The product.** `init`, `check`, `compile`, `inspect`, `serve` — one install, one tool |
| `@effectorhq/core` | Embeddable zero-dep kernel — TOML parser, type checker, schema validator, compiler |
| `@effectorhq/serve` | Typed MCP server with preflight validation, permission enforcement |
| `@effectorhq/graph` | Interactive dependency graph (D3 force layout, spectrum, dashboard) |
| `effector-studio` | Visual editor for building manifests with compile target preview |

## Architecture

```
effector.toml + SKILL.md  (your capability definition)
        │
        ├── validate  →  schema validator + type checker
        ├── lint      →  SKILL.md structure checks
        ├── audit     →  permission + trust analysis
        ├── compose   →  type-based pipeline verification
        ├── compile   →  MCP / OpenAI / LangChain / JSON IR
        └── graph     →  dependency visualization
```

All tools share `@effectorhq/core` as a kernel. Every module uses only Node.js built-ins — zero external dependencies, zero supply chain risk.

## Next Steps

- [Installation](/installation.html) — get started in 30 seconds
- [Your First Manifest](/first-manifest.html) — build an `effector.toml` from scratch
- [Type System](/type-system.html) — understand the 42-type catalog
- [Playground](/playground.html) — validate manifests live in your browser
