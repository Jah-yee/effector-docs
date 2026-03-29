---
title: Type System
subtitle: Standard capability types for AI agent tools — the lib.d.ts for Effectors.
---

# Type System

`@effectorhq/types` provides a standard library of **capability types** — reusable type definitions for the inputs, outputs, and contexts that AI agent tools commonly work with. 42 types across three roles, grounded in real-world usage from 13,000+ analyzed tools.

## Why Types for Agent Capabilities

TypeScript proved that adding types to an untyped ecosystem transforms it. Before TypeScript, JavaScript developers composed modules by convention and prayer. After TypeScript, composition became verifiable.

AI agent capabilities are in the pre-TypeScript era right now:

| What we have today | What types enable |
|-------------------|------------------|
| Chain two tools, pray they work | **Type-check composition before execution** |
| Search tools by keyword | **Discover capabilities by interface type** |
| Read the README to understand a tool | **Machine-readable interface contracts** |
| Manually test every combination | **Automated compatibility verification** |
| "It works on my runtime" | **Cross-runtime interface portability** |

With effector types, compatibility is checked statically:

```toml
# Tool A: produces ReviewReport
[effector.interface]
output = "ReviewReport"

# Tool B: accepts ReviewReport
[effector.interface]
input = "ReviewReport"
```

The composition checker knows these connect. It also knows that `SecurityReport` (a structural subtype of `ReviewReport`) would work too.

## The Three Categories

### Input Types (15 types)

What your capability accepts. Every input type defines required and optional fields:

| Type | Category | Description |
|------|----------|-------------|
| String | primitive | Plain text input |
| FilePath | primitive | A filesystem path |
| URL | primitive | A URL string |
| JSON | primitive | JSON data with optional schema |
| RepositoryRef | reference | A repo reference (owner + repo) |
| CodeDiff | code | A code diff between two states |
| CodeSnippet | code | Source code with language metadata |
| IssueRef | reference | A reference to an issue/ticket |
| PullRequestRef | reference | A reference to a pull request |
| CommitRef | reference | A reference to a specific commit |
| TextDocument | document | A text document in any format |
| DataTable | data | Tabular data (headers + rows) |
| ImageRef | media | An image with metadata |
| PatchSet | code | A set of code patches |
| StructuredData | data | Structured data with optional schema |

### Output Types (14 types)

What your capability produces:

| Type | Category | Description |
|------|----------|-------------|
| Markdown | primitive | Markdown-formatted text (most common) |
| JSON | primitive | JSON data output |
| String | primitive | Plain text output |
| ReviewReport | analysis | Code review with findings |
| SecurityReport | analysis | Security scan report (subtype of ReviewReport) |
| Notification | communication | A notification message |
| SlackMessage | communication | Slack-specific notification |
| DiscordMessage | communication | Discord-specific notification |
| OperationStatus | status | Generic operation result |
| TestResult | status | Test run results |
| DeploymentStatus | status | Deployment status |
| LintReport | analysis | Static analysis report |
| Summary | analysis | Content summary |
| TranslatedText | analysis | Translated text output |

### Context Types (13 types)

Runtime environment your capability needs:

| Type | Category | Description |
|------|----------|-------------|
| GitHubCredentials | credentials | GitHub token |
| GenericAPIKey | credentials | Generic API key |
| Docker | tools | Docker environment |
| Kubernetes | tools | K8s cluster context |
| AWSCredentials | credentials | AWS credentials |
| SlackCredentials | credentials | Slack workspace token |
| Repository | config | Source code repository |
| CodingStandards | config | Style guide / linter config |
| ShellEnvironment | tools | Shell / process environment |
| UserPreferences | config | User preferences |
| ConversationHistory | agent | Chat history |
| PromptContext | agent | Template variable bindings |
| APICredentials | credentials | Opaque API credentials |

## Structural Subtyping

Types use **structural subtyping** (like TypeScript, not like Java). Two types are compatible if their shapes match — no explicit inheritance required.

```
ReviewReport:    { findings, severity, summary }
SecurityReport:  { vulnerabilities, risk, summary, findings, severity, ... }

→ SecurityReport is a structural subtype of ReviewReport
→ Any Effector expecting ReviewReport will accept SecurityReport
```

This means the ecosystem is **open to extension without coordination.** You define a new type that structurally matches an existing one, and it automatically composes with everything that existing type composes with.

Known subtype relations:

- `SecurityReport` → subtype of `ReviewReport`
- `SlackMessage` → subtype of `Notification`
- `DiscordMessage` → subtype of `Notification`

### Compatibility Rules

```
1. Exact match           → precision 1.0
2. Alias resolution      → precision 0.95  (PlainText → String)
3. Subtype relation      → precision 0.9   (SecurityReport → ReviewReport)
4. Wildcard matching     → precision 0.8   (*Report matches ReviewReport)
5. Structural subtyping  → precision varies
6. Otherwise             → incompatible
```

## Fields

Every type defines required and optional fields. For example, `PullRequestRef`:

- **Required**: `number`
- **Optional**: `repo`, `provider`, `title`, `headBranch`, `baseBranch`, `url`

Fields are the structural contract. When two types connect, the type checker verifies field compatibility.

## Frequency

Every type includes a frequency score (0.0 to 1.0) derived from analysis of 13,000+ real-world AI tools. This grounds the type catalog in actual usage patterns:

- **Discovery** — sort search results by relevance
- **Scaffolding** — suggest likely types when creating new capabilities
- **Ecosystem analysis** — understand what the community builds

## Relationship to Existing Standards

| Standard | What it types | What effector-types adds |
|----------|--------------|------------------------|
| JSON Schema | Parameter shapes | **Semantic capability types** (not just data shapes) |
| MCP Tool Schema | Tool parameters | **Composition semantics** (chains-after, parallel-with) |
| OpenAPI | HTTP endpoint contracts | **AI-specific types** (context, cost, nondeterminism) |
| WIT (WASM) | Code module interfaces | **Agent capability interfaces** (not just function signatures) |

## Using Types

### In effector.toml

```toml
[effector.interface]
input = "CodeDiff"
output = "ReviewReport"
context = ["Repository", "GitHubCredentials"]
```

### Checking Types

```bash
# Validate types against the catalog
effector check .

# List all available types
effector inspect .
```

### Composition

```bash
# Check if two capabilities compose
npx @effectorhq/compose check ./capability-a ./capability-b
```

## Browse the Full Catalog

See every type with its fields, aliases, and relationships in the [Type Catalog](/types/index.html).
