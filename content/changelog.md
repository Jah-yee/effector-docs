---
title: Changelog
subtitle: Release history across the effector ecosystem.
---

# Changelog

## @effectorhq/core v1.0.0

- **Reverse compiler** (`init --from-mcp`) — auto-generate effector.toml from MCP server source
- **Badge command** — generate shields.io badge URLs
- **42-type catalog** — expanded from 36 to 42 standard types
- **Compiler targets** — MCP, OpenAI Agents, LangChain, JSON IR
- **Cross-runtime compilation** pipeline
- **Section-aware TOML parsing** — fields scoped to correct sections
- 69 tests passing

## effector-types v1.0.0

- 42 standard types across input (15), output (14), context (13)
- Structural subtype relations: SecurityReport < ReviewReport, SlackMessage < Notification, DiscordMessage < Notification
- Category taxonomy: primitive, code, reference, document, data, media, analysis, communication, status, credentials, tools, config, agent
- Frequency scores for discovery and ranking
- Field definitions with required/optional separation

## effector-graph v1.1.0

- **D3 interactive visualization** — force-directed graph in browser
- **Web server** (`serve` command) with Dashboard, Pipeline, Diff views
- **Spectrum interactivity** — type spectrum with click-to-inspect
- **Web Components** — `<effector-graph>`, `<effector-spectrum>`
- **VS Code extension** — in-editor graph visualization
- **Diff engine** — compare registry states over time
- **Stats engine** — type coverage, composition density, trust distribution
- 12 tests passing

## effector-audit v0.1.0

- Permission verification against source code
- Interface-permission mismatch detection
- Trust state tracking (unsigned, audited, signed)
- 24 tests passing

## skill-eval v0.1.0

- 10-metric quality scoring (0-100 scale)
- Interface completeness, example quality, composability metrics
- 14 tests passing

## effector-compose v0.1.0

- Static composition checking between capabilities
- Type compatibility verification
- Subtype-aware matching
- 16 tests passing

## create-effector v0.1.0

- Project scaffolding for skill, extension, and workflow types
- Interactive prompts for name, type, permissions
- 14 tests passing

## skill-lint v0.1.0

- SKILL.md structure validation
- Section completeness checking
- 21 tests passing

## openclaw-mcp v0.1.0

- MCP server for effector toolchain
- Instruction passthrough execution model
- 39 tests passing

## effector-action v0.1.0

- GitHub Action for CI validation of effector.toml
- Schema validation, type checking, permission verification
- Inline PR annotations for errors and warnings
- 10 tests passing

## effector-studio v0.1.0

- Visual TOML/SKILL editor
- Compile targets with live preview
- Scaffold-to-disk export
- HTTP API for programmatic access
