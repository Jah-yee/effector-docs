---
title: Your First Manifest
subtitle: Build an effector.toml from scratch, field by field.
---

# Your First effector.toml

This walkthrough builds a complete `effector.toml` manifest from scratch. By the end, you'll have a typed, validated capability definition.

## What We're Building

A "GitHub PR Summarizer" — a capability that takes a pull request reference and produces a markdown summary. It needs network access to fetch PR data from GitHub.

## Step 1: The Header

Every manifest starts with the `[effector]` section:

```toml
[effector]
name = "pr-summarizer"
version = "0.1.0"
description = "Summarizes GitHub pull requests into concise markdown reports"
type = "skill"
```

- **name** — unique identifier, lowercase with hyphens
- **version** — semver version string
- **description** — one-line human-readable description
- **type** — one of `skill`, `extension`, or `workflow`

## Step 2: The Interface

This is the heart of the manifest. Declare what your capability accepts and produces:

```toml
[effector.interface]
input = "PullRequestRef"
output = "Markdown"
context = ["GitHubCredentials"]
```

- **input** — what data your capability needs. `PullRequestRef` requires `number` and optionally `repo`, `provider`, `title`, etc.
- **output** — what your capability produces. `Markdown` is the most common output type.
- **context** — runtime context your capability needs. `GitHubCredentials` means it needs a GitHub token.

All three reference types from the [42-type catalog](/types/index.html). The type checker validates these at build time.

## Step 3: Permissions

Declare what your capability can access:

```toml
[effector.permissions]
network = true
subprocess = false
filesystem = []
env-read = ["GITHUB_TOKEN"]
```

- **network** — can it make HTTP requests?
- **subprocess** — can it spawn child processes?
- **filesystem** — which filesystem operations? (`[]` = none, `["read"]`, `["read", "write"]`)
- **env-read** — which environment variables can it read?

Permissions are auditable. The `@effectorhq/audit` tool checks that your code's actual behavior matches these declarations.

## Step 4: The Complete Manifest

Putting it all together:

```toml
[effector]
name = "pr-summarizer"
version = "0.1.0"
description = "Summarizes GitHub pull requests into concise markdown reports"
type = "skill"

[effector.interface]
input = "PullRequestRef"
output = "Markdown"
context = ["GitHubCredentials"]

[effector.permissions]
network = true
subprocess = false
filesystem = []
env-read = ["GITHUB_TOKEN"]
```

## Step 5: Add SKILL.md

The companion file provides natural-language instructions for the AI:

```markdown
---
name: pr-summarizer
description: Summarizes GitHub pull requests into concise markdown reports
---

## Purpose

Analyze a GitHub pull request and produce a structured markdown summary including: what changed, why, risk assessment, and review suggestions.

## Commands

- `summarize` — Generate a full PR summary
- `quick` — One-paragraph summary only

## When to Use

- During code review to get a quick overview
- When triaging a large backlog of PRs
- To generate release notes from merged PRs

## Examples

Given PR #42 on myorg/myrepo:
- Summarizes file changes, commit messages, and discussion
- Highlights breaking changes and security concerns
- Outputs structured markdown with headings and bullet points
```

## Step 6: Validate

```bash
effector check .
```

Expected output:

```
✓ effector.toml parsed successfully
✓ Schema validation passed
✓ Types valid: PullRequestRef (input), Markdown (output), GitHubCredentials (context)
✓ SKILL.md parsed successfully
```

## Step 7: Compile

Generate runtime-specific schemas:

```bash
# MCP tool schema
effector compile . -t mcp

# OpenAI function definition
effector compile . -t openai-agents

# LangChain tool config
effector compile . -t langchain
```

## What's Next

- [Type System](/type-system.html) — understand the 42-type catalog in depth
- [Permissions Model](/permissions.html) — learn about security and trust
- [CLI Reference](/cli-reference.html) — all commands and options
- [Playground](/playground.html) — try editing manifests live in the browser
