---
title: About Effector
subtitle: The principles, design decisions, and story behind the project.
---

# About Effector

## The Idea

Every REST API has an OpenAPI schema. Every TypeScript function has types. Every database column has a declared type. But AI agent tools — the building blocks of autonomous systems — are defined in ad-hoc JSON, undocumented Python classes, or freeform natural language.

effector exists because we believe AI capabilities deserve the same engineering rigor as the rest of the software stack. A **standard, typed, auditable manifest** for every AI tool — portable across any runtime.

## Design Principles

### Zero Dependencies

Every effector package uses only Node.js built-ins. No lodash, no chalk, no yargs, no commander. This isn't minimalism for its own sake — it's a deliberate engineering choice:

- **No supply chain risk** — every line of code is auditable, no transitive surprises
- **No version conflicts** — no diamond dependency problems across the 9-package ecosystem
- **Instant installs** — `npm install` completes in seconds, not minutes
- **Long-term stability** — Node.js built-ins maintain backward compatibility across major versions

### Sidecar Architecture

effector is not a runtime, not a framework, not a plugin system. It's a **sidecar manifest** — a file that sits next to your existing tool and describes what it does. Your MCP server, your LangChain tool, your custom agent code continues to run exactly as before.

This means adoption is incremental. Add `effector.toml` to an existing project. Run `effector validate`. Nothing else changes until you choose to.

### Static Over Dynamic

We catch errors before execution, not during. Type mismatches, composition failures, permission violations, and structural issues are all flagged at build time — before your agent starts making API calls, reading files, or executing subprocesses.

If it can be checked statically, it should be. Runtime surprises are expensive.

### One Source, Many Targets

`effector.toml` is the canonical definition of a capability. MCP tool schemas, OpenAI function definitions, LangChain tool configs — these are all compiled output. Write once, compile to any target. When the spec changes, every output format updates automatically.

## Project Status

effector is in active development with a stable core spec and a functional toolchain.

**Where things stand today:**
- 249+ tests passing across 9 repositories
- Complete validation → compilation → composition pipeline
- 40 standard types covering input, output, and context categories
- Reverse compiler for adopting existing MCP servers (`effector init --from-mcp`)
- Interactive tools: Studio editor, Graph Explorer, TOML Playground

**What's next:**
- Publishing all packages to npm under the `@effectorhq` scope
- Adding `effector.toml` to popular open-source MCP servers
- Community feedback and spec evolution
- Language-agnostic core (currently Node.js, exploring Rust/WASM)

## Contributing

effector is open source under the MIT License.

- **GitHub**: [github.com/effectorHQ](https://github.com/effectorHQ)
- **Issues**: Bug reports, feature requests, and type proposals welcome
- **Pull requests**: Each repo has contributing guidelines

Every package follows the same patterns: zero dependencies, Node.js built-ins only, `node --test` for testing, ESM modules.

## Team

Built by [Jiayi Du](https://github.com/effectorHQ). effectorHQ is an independent project with a clear mission: make AI agent capabilities typed, composable, and portable.
