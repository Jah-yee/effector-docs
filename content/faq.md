---
title: FAQ
subtitle: Frequently asked questions about effector.
---

# FAQ

## General

### What is effector?

Effector is a typed interface layer for AI agent tools. Think of it as **lib.d.ts for AI capabilities** — it doesn't replace your runtime or framework, it adds a standard type system on top. You write a sidecar manifest (`effector.toml`), and the toolchain validates types, checks composition, audits permissions, and compiles to any runtime target.

### Is effector a runtime or framework?

No. Effector is a **compiler and verification layer**. MCP owns the protocol. LangChain, CrewAI, and others own the runtimes. Effector sits alongside your existing stack and adds typed interoperability.

### How is this different from JSON Schema?

JSON Schema validates data shapes. Effector validates **semantic capability types**. A `SecurityReport` isn't just "an object with certain fields" — it has a known category (analysis), frequency score (0.45), subtype relationships (`SecurityReport <: ReviewReport`), and implied permission requirements. This semantic layer enables composition checking, quality scoring, and cross-runtime compilation that raw JSON Schema can't provide.

### How is this different from MCP?

MCP (Model Context Protocol) defines how LLMs communicate with tools at the *protocol* level. Effector defines how tools describe themselves at the *type* level. They're complementary — you can compile an `effector.toml` manifest directly to a valid MCP tool definition.

### Do I have to use all 40 types?

No. Use the types that match your tool. If none of the 40 standard types fit, use `String` or `JSON` as generic fallbacks. The type system is designed for progressive adoption — start with basic types and refine as you see the value.

---

## Type System

### Where do the 40 types come from?

We analyzed 13,000+ tools across MCP servers, LangChain tools, and CrewAI integrations. The 40 types represent the canonical vocabulary that covers the vast majority of real-world AI agent capabilities. Each type has a frequency score reflecting how often it appears in the wild.

### What is structural subtyping?

If Type A has all the required fields of Type B (plus possibly more), then A is a **structural subtype** of B. For example, `SecurityReport` has all the fields of `ReviewReport` plus `vulnerabilities` and `severity` — so `SecurityReport <: ReviewReport`. A tool that outputs `SecurityReport` can feed into any tool that expects `ReviewReport`.

### Can I define custom types?

The current spec focuses on the 40 standard types for maximum interoperability. Custom type extensions are on the roadmap. In the meantime, you can use `JSON` with a description that explains your custom shape, or contribute a proposal for a new standard type.

### What are frequency scores?

Each type has a frequency score from 0.0 to 1.0 reflecting how commonly it appears across the 13,000+ analyzed tools. `String` has the highest frequency (0.95), while specialized types like `Kubernetes` are lower (0.12). Frequency helps with discovery and ranking — higher-frequency types are more likely to compose with other tools.

---

## Workflow

### How do I add effector to an existing project?

```bash
npx @effectorhq/cli init .
```

This creates a starter `effector.toml` and `SKILL.md`. If you have an existing MCP server, use:

```bash
effector init --from-mcp .
```

The reverse compiler scans your source and generates a typed manifest automatically.

### Do I need to change my source code?

No. The `effector.toml` manifest is a **sidecar file** — it sits next to your code and describes it. Your tool's implementation doesn't need to import or reference effector at all.

### What compile targets are supported?

Currently: **MCP**, **OpenAI Agents**, **LangChain**, **CrewAI**, and **JSON IR**. The compiler reads your `effector.toml` and generates runtime-specific tool definitions. Adding new targets is straightforward.

### How does CI integration work?

Add to your GitHub Actions workflow:

```yaml
- uses: effectorHQ/effector-action@v1
  with:
    path: '.'
    fail-on-warnings: 'true'
```

This validates your manifest, checks types, and optionally runs permission audits on every PR.

---

## Technical

### Why zero dependencies?

Every package in the effector toolchain uses only Node.js built-ins. This means no supply chain risk, no version conflicts, no `node_modules` bloat. The entire toolchain installs in under a second.

### Why TOML instead of YAML or JSON?

TOML is readable, unambiguous, and has clear section semantics. Unlike YAML, there are no gotchas with indentation or type coercion (`yes` → `true`, `3.10` → `3.1`). Unlike JSON, it supports comments. The `[effector.interface]` section in TOML maps naturally to the capability IR.

### What Node.js version do I need?

Node.js 22 or later. We use modern built-ins like `parseArgs` and `node:test` that aren't available in older versions.

### Is there editor support?

The manifest is standard TOML — any editor with TOML syntax highlighting works. For richer experiences:
- **VS Code**: Install the TOML extension for syntax highlighting. The effector-graph VS Code extension adds in-editor type visualization.
- **JetBrains**: Built-in TOML support works out of the box.

---

## Community

### How can I contribute?

The entire toolchain is open-source under Apache 2.0. Contributions welcome:
- **New type proposals**: Open an issue with the type name, fields, category, and frequency rationale
- **Compile targets**: Add support for new runtimes
- **Bug fixes and improvements**: PRs welcome across all repos

### Where do I report issues?

Open an issue on the relevant GitHub repo. For general questions, use the main [effectorHQ](https://github.com/OpenClawHQ) organization.

### Is there a roadmap?

Key upcoming areas:
- Custom type extensions
- IDE language server (LSP) for effector.toml
- Registry for discovering typed capabilities
- Runtime type verification (beyond static checking)
