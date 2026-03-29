---
title: Skills & Extensions
subtitle: Build, test, and publish typed AI agent capabilities.
---

# Skills & Extensions

Effector defines three capability types: **skills**, **extensions**, and **workflows**. Each serves a different purpose but shares the same typed interface model.

## Capability Types

### Skills

The most common type. A skill is a single-purpose AI agent tool with typed inputs and outputs.

```toml
[effector]
name = "code-review"
type = "skill"

[effector.interface]
input = "CodeSnippet"
output = "ReviewReport"
```

**When to use**: Most AI agent tools are skills — they take one type of input, produce one type of output, and do one thing well.

### Extensions

Extensions augment the agent runtime with new capabilities — think "middleware" or "adapters."

```toml
[effector]
name = "github-integration"
type = "extension"

[effector.interface]
input = "RepositoryRef"
output = "JSON"
context = ["GitHubCredentials"]
```

**When to use**: When your tool provides a foundational capability that other tools build on (database adapters, API clients, authentication providers).

### Workflows

Workflows chain multiple skills into deterministic pipelines.

```toml
[effector]
name = "pr-review-pipeline"
type = "workflow"

[effector.interface]
input = "PullRequestRef"
output = "SlackMessage"
context = ["GitHubCredentials", "SlackCredentials"]
```

**When to use**: When you need a multi-step process that composes existing skills.

## Building a Skill

### 1. Scaffold

```bash
npx @effectorhq/cli init my-skill
```

The scaffolder generates a complete project with `effector.toml`, `SKILL.md`, source stubs, and tests.

### 2. Define the Interface

Edit `effector.toml` to specify exactly what your tool accepts and produces:

```toml
[effector.interface]
input = "CodeDiff"
output = "ReviewReport"
context = ["Repository", "CodingStandards"]
```

Choose types from the [42-type catalog](/types/index.html). Be as specific as possible — `CodeDiff` is better than `String` because it enables composition checking.

### 3. Declare Permissions

Be explicit about what your tool accesses:

```toml
[effector.permissions]
network = true
subprocess = false
filesystem = ["read"]
env-read = ["GITHUB_TOKEN"]
```

The principle of least privilege applies: only declare what you actually need.

### 4. Write SKILL.md

The companion file provides natural-language instructions for the AI:

```markdown
---
name: code-review
description: Reviews code changes and produces structured reports
---

## Purpose

Analyze code diffs and produce structured review reports with findings,
severity ratings, and suggestions.

## Commands

- `review` — Full code review with detailed findings
- `quick` — Quick summary with top-3 issues only

## When to Use

- During pull request review
- Before merging feature branches
- For automated code quality checks

## Examples

Given a diff of `src/auth.js`:
- Identifies missing input validation
- Flags hardcoded credentials
- Suggests error handling improvements
```

SKILL.md serves two purposes:
1. **For AI runtimes**: Instructions passed to the LLM when the tool is invoked
2. **For developers**: Documentation of what the tool does and how to use it

### 5. Validate

```bash
effector check .
effector check .
```

### 6. Compile

```bash
effector compile . -t mcp
```

## SKILL.md Structure

### Required Sections

| Section | Purpose |
|---------|---------|
| **Frontmatter** | `name` and `description` (YAML) |
| **Purpose** | What the tool does (1-2 paragraphs) |
| **Commands** | Available actions |

### Recommended Sections

| Section | Purpose |
|---------|---------|
| **When to Use** | Scenarios where this tool is appropriate |
| **Examples** | Concrete usage examples |
| **Limitations** | What the tool cannot do |
| **Configuration** | Environment variables and settings |

### Validation

`effector check` validates SKILL.md structure:

```bash
effector check .
```

It verifies:
- Frontmatter is present and contains required fields
- Body has at least a heading and description
- Recommended sections are present (warnings for missing ones)

## Quality Scoring

`@effectorhq/skill-eval` scores your capability across 10 dimensions:

```bash
npx @effectorhq/skill-eval score .
```

| Metric | Weight | What it measures |
|--------|--------|-----------------|
| Manifest completeness | 10% | All fields present in effector.toml |
| Interface completeness | 15% | Input, output, and context defined |
| Type specificity | 10% | Specific types vs generic (String, JSON) |
| Permission granularity | 10% | Precise permission declarations |
| SKILL.md quality | 15% | Structure, sections, descriptions |
| Example quality | 10% | Concrete, realistic examples |
| Description clarity | 10% | Clear, actionable descriptions |
| Composability | 10% | Can this tool connect to others? |
| Naming conventions | 5% | Consistent naming patterns |
| Documentation coverage | 5% | All features documented |

A score of 80+ indicates a well-defined capability. Below 60 suggests significant gaps.

## Testing

### Validate Locally

```bash
# Full validation
effector check .

# Type checking only
effector check .

# SKILL.md linting
effector check .

# Permission audit
effector check .

# Quality score
npx @effectorhq/skill-eval score .
```

### In CI

Add to your GitHub Actions:

```yaml
- uses: effectorHQ/effector-action@v1
  with:
    path: '.'
    fail-on-warnings: 'true'
```

## Best Practices

1. **One capability per manifest** — keep tools focused and single-purpose
2. **Use specific types** — `CodeDiff` over `String`, `ReviewReport` over `JSON`
3. **Declare all permissions** — enable auditing and trust verification
4. **Write thorough SKILL.md** — this is what the AI sees when deciding how to use your tool
5. **Include examples** — concrete examples improve both AI usage and human understanding
6. **Version with semver** — breaking interface changes deserve a major version bump
7. **Run the full pipeline in CI** — validate + check-types + audit on every PR

## Next Steps

- [Type Catalog](/types/index.html) — browse all 42 standard types
- [Composition Guide](/guides/composition.html) — connect tools into pipelines
- [Security & Auditing](/guides/security.html) — permission verification
- [Examples & Cookbook](/guides/examples.html) — practical patterns
