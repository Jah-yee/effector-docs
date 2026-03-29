---
title: Composition Guide
subtitle: How to build type-safe pipelines between AI agent tools.
---

# Composition Guide

The real power of typed interfaces shows up when tools compose. If Tool A outputs `CodeDiff` and Tool B expects `CodeDiff`, the pipeline is structurally sound. If Tool A outputs `String` but Tool B expects `SecurityReport`, you have a type mismatch — and effector catches it *before* runtime.

## Why Composition Matters

In untyped agent systems, composition is held together by convention and prayer. Developer A writes a code review tool. Developer B writes a notification tool. They "work together" because someone manually verified the JSON shapes match. When either tool changes, the pipeline silently breaks.

Effector makes composition **verifiable**:

```bash
effector compose check ./review-tool ./notify-tool
```

## The Composition Model

Effector composition checking uses the type catalog and subtype relationships to verify pipeline compatibility.

### Direct Match

The simplest case — output type matches input type exactly:

```toml
# Tool A: code-review
[effector.interface]
input = "CodeSnippet"
output = "ReviewReport"

# Tool B: review-summarizer
[effector.interface]
input = "ReviewReport"
output = "Summary"
```

```bash
effector compose check ./code-review ./review-summarizer
# ✓ Pipeline valid: CodeSnippet → ReviewReport → Summary
```

### Subtype Match

Effector supports structural subtyping. `SecurityReport` is a subtype of `ReviewReport` — it has all the same required fields plus additional ones. So a tool that outputs `SecurityReport` can feed into a tool that expects `ReviewReport`:

```toml
# Tool A: security-scan
[effector.interface]
output = "SecurityReport"

# Tool B: review-summarizer (expects ReviewReport)
[effector.interface]
input = "ReviewReport"
```

This works because `SecurityReport <: ReviewReport` — every `SecurityReport` *is* a valid `ReviewReport`.

### Compatibility Scores

Not all type relationships are binary. Effector assigns compatibility scores:

| Relationship | Score | Example |
|---|---|---|
| Exact match | 1.0 | `ReviewReport` → `ReviewReport` |
| Direct subtype | 0.95 | `SecurityReport` → `ReviewReport` |
| Same category | 0.9 | `LintReport` → `ReviewReport` |
| Compatible fields | 0.8 | Types with overlapping required fields |
| Incompatible | 0.0 | `ImageRef` → `ReviewReport` |

### Multi-Step Pipelines

For longer pipelines, compose validates every adjacent pair:

```toml
# Pipeline: fetch → review → notify
[pipeline]
steps = ["git-fetch", "code-review", "slack-notify"]
```

```bash
effector compose check ./git-fetch ./code-review ./slack-notify
# ✓ git-fetch(Repository → CodeSnippet) → code-review(CodeSnippet → ReviewReport) → slack-notify(ReviewReport → SlackMessage)
```

## Using effector compose Programmatically

```javascript
import { checkComposition } from '@effectorhq/compose';

const result = checkComposition(
  { output: 'SecurityReport' },
  { input: 'ReviewReport' }
);

console.log(result.compatible);  // true
console.log(result.score);       // 0.95
console.log(result.reason);      // "SecurityReport is a subtype of ReviewReport"
```

## Context Propagation

Context types flow through the entire pipeline. If any tool in the chain requires `GitHubCredentials` in its context, the pipeline's aggregate context must include it:

```toml
# Tool A
[effector.interface]
context = ["Repository"]

# Tool B
[effector.interface]
context = ["GitHubCredentials"]
```

The composed pipeline requires both `Repository` and `GitHubCredentials` in its context.

## Common Patterns

### Fan-out

One tool's output feeds multiple downstream tools:

```
code-review → slack-notify
           → github-comment
           → jira-update
```

Each downstream tool must accept the upstream output type (or a supertype).

### Aggregation

Multiple tools feed into a single aggregator:

```
security-scan  → aggregate-reports
lint-check     →
test-runner    →
```

The aggregator's input type must be a common supertype of all upstream outputs.

### Conditional Routing

Use the compatibility score to route dynamically:

```javascript
const tools = [slackNotify, discordNotify, emailNotify];
const bestMatch = tools
  .map(t => ({ tool: t, score: checkComposition(upstream, t).score }))
  .sort((a, b) => b.score - a.score)[0];
```

## Next Steps

- [Type System](/type-system.html) — understand the 42 standard types and subtype relationships
- [CLI Reference](/cli-reference.html) — all compose commands
- [Security & Auditing](/guides/security.html) — verify permissions across composed pipelines
