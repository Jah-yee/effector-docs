---
title: Architecture
subtitle: How effector's components fit together — from manifest to compiled output.
---

# Architecture

Effector is a **compiler and verification layer**, not a runtime. It sits alongside your existing AI agent framework and adds typed interoperability through a sidecar manifest.

## The Big Picture

```
                    Your AI Agent Tool
                    (any language, any framework)
                           │
                    effector.toml + SKILL.md
                    (sidecar manifest)
                           │
              ┌────────────┼────────────────┐
              │            │                │
         ┌────▼────┐  ┌───▼────┐   ┌──────▼──────┐
         │ validate │  │ compile│   │    audit    │
         │ + types  │  │  -t X  │   │ permissions │
         └────┬────┘  └───┬────┘   └──────┬──────┘
              │            │                │
              ▼            ▼                ▼
         ✓/✗ errors   MCP / OpenAI /   ✓/✗ findings
                       LangChain /
                       JSON IR
```

## Core Principles

### 1. Sidecar Architecture

Your tool doesn't import effector. It doesn't link against it. The `effector.toml` manifest sits *next to* your tool like a `.d.ts` file sits next to a `.js` file. Your implementation is untouched.

### 2. Shared Kernel

All packages share `@effectorhq/core` — the kernel containing:

- **TOML parser** — section-aware, handles inline arrays and nested objects
- **SKILL.md parser** — YAML frontmatter + markdown body
- **Type checker** — resolves types against the 42-type catalog
- **Schema validator** — validates manifest structure
- **Compiler** — transforms manifest to runtime targets

### 3. Zero Dependencies

Every package uses only Node.js built-ins. No `node_modules` tree. No supply chain surface. The entire toolchain installs in under a second.

## Package Architecture

```
┌─────────────────────────────────────────────────────┐
│                  @effectorhq/core                    │
│  TOML parser · SKILL parser · Type checker ·         │
│  Schema validator · Compiler · CLI                   │
└──────────┬───────────┬──────────┬──────────┬────────┘
           │           │          │          │
    ┌──────▼──┐  ┌─────▼────┐ ┌──▼───┐ ┌───▼────────┐
    │skill-lint│  │  audit   │ │graph │ │  compose   │
    └─────────┘  └──────────┘ └──────┘ └────────────┘
           │           │          │          │
    ┌──────▼──┐  ┌─────▼────┐
    │skill-eval│  │  studio  │
    └─────────┘  └──────────┘
```

### Tier 1: Core

| Package | Purpose |
|---------|---------|
| `@effectorhq/core` | Shared kernel — parsing, validation, compilation |
| `effector-types` | 42 standard types (JSON catalog) |
| `effector-spec` | JSON Schema for `effector.toml` |

### Tier 2: Tools

| Package | Purpose |
|---------|---------|
| `@effectorhq/lint` | SKILL.md structure validation (internal) |
| `@effectorhq/audit` | Permission verification and trust tracking |
| `@effectorhq/compose` | Type-based composition checking |
| `@effectorhq/graph` | Interactive dependency visualization (D3) |
| `@effectorhq/skill-eval` | Quality scoring (10 metrics, 0-100 scale) |

### Tier 3: Distribution

| Package | Purpose |
|---------|---------|
| `@effectorhq/cli` | Unified CLI (init, check, compile, inspect, serve) |
| `effector-studio` | Visual manifest editor |
| `effector-action` | GitHub Action for CI validation |
| `@effectorhq/serve` | Typed MCP server with preflight validation |

## Data Flow

### Validation Pipeline

```
effector.toml  →  TOML parser  →  EffectorDef (IR)
                                       │
                  Schema validator  ←───┘
                       │
                  Type checker  →  resolve against types.json
                       │
                  Result: { valid, errors, warnings }
```

### Compilation Pipeline

```
EffectorDef (IR)  →  Target selector  →  Compiler
                                             │
                              ┌──────────────┼───────────────┐
                              │              │               │
                         MCP JSON     OpenAI JSON     LangChain JSON
```

### Audit Pipeline

```
effector.toml  →  Permission declarations
      +
Source code    →  Permission detection (AST-like scanning)
      │
      ▼
Comparison: declared vs actual  →  findings[]
```

## The Capability IR

The internal representation (`EffectorDef`) is the pivot format. All tools operate on it:

```javascript
{
  name: "pr-summarizer",
  version: "0.1.0",
  description: "...",
  type: "skill",
  interface: {
    input: "PullRequestRef",
    output: "Markdown",
    context: ["GitHubCredentials"]
  },
  permissions: {
    network: true,
    subprocess: false,
    filesystem: [],
    envRead: ["GITHUB_TOKEN"]
  }
}
```

This IR is:
- **Runtime-neutral** — no assumption about MCP, OpenAI, or any framework
- **Serializable** — can be compiled to any target format
- **Validatable** — every field has a schema constraint and type semantics

## Execution Model

Effector is a build-time / CI-time tool, not a runtime. The typical execution points are:

1. **Development**: `effector check .` after editing manifests
2. **Pre-commit**: Hook that validates before allowing commits
3. **CI/CD**: GitHub Action validates on every PR
4. **Deployment**: Compile step generates runtime-specific schemas

No effector code runs when your tool is actually serving requests.

## Design Decisions

### Why TOML, not YAML?

TOML has unambiguous semantics. No indentation sensitivity. No type coercion surprises (`yes` ≠ `true`, `3.10` ≠ `3.1`). Comments are first-class. Section syntax (`[effector.interface]`) maps naturally to the IR.

### Why a Type Catalog, not Arbitrary Types?

A fixed catalog (42 types) maximizes interoperability. If every project defines its own types, composition checking becomes impossible. The 42 types cover the vast majority of real-world AI agent tools, grounded in analysis of 13,000+ tools.

### Why Structural Subtyping?

It enables open extension without coordination. If you define a type with all the fields of `ReviewReport` plus more, it's automatically compatible. No need to register subtypes or modify a central registry.

## Next Steps

- [Type System](/type-system.html) — the 42-type catalog in depth
- [Permissions Model](/permissions.html) — how permissions are declared and audited
- [Composition](/guides/composition.html) — how tools compose through types
- [CLI Reference](/cli-reference.html) — all commands and flags
