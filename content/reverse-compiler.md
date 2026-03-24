---
title: Reverse Compiler
subtitle: Auto-generate effector.toml from existing MCP server projects.
---

# Reverse Compiler

The reverse compiler scans an existing MCP server project and auto-generates an `effector.toml` manifest. This is the fastest way to adopt effector for an existing project.

## When to use Reverse Compiler

- You already have an MCP server and want to bootstrap `effector.toml` quickly
- You are migrating existing tools and need a best-effort first draft
- You want permission/type hints before manual cleanup

If you start from scratch, use [Studio](/studio.html) or [Playground](/playground.html).

## Usage

```bash
npx @effectorhq/core init --from-mcp [dir]
```

## How It Works

The reverse compiler runs four phases:

### Phase 1: Tool Extraction

Scans `.js` and `.ts` files (skipping `node_modules`, `.git`, `dist`) looking for MCP tool definitions:

- `server.tool("name", "description", { schema })` — MCP SDK v1 pattern
- `{ name: "...", inputSchema: { ... } }` — JSON literal in tools/list handler
- `server.setRequestHandler(ListToolsRequestSchema, ...)` — older MCP SDK

### Phase 2: Type Mapping

Maps detected JSON Schema properties to effector types using heuristics:

| Pattern | Inferred Type |
|---------|---------------|
| `url` or `href` property | `URL` |
| `path` or `file` property | `FilePath` |
| `code` + `language` properties | `CodeSnippet` |
| `owner` + `repo` properties | `RepositoryRef` |
| Complex object | `JSON` |
| Simple string | `String` |

Output defaults to `Markdown` with a `# TODO: verify output type` comment.

### Phase 3: Permission Inference

Scans source code for permission-relevant patterns:

| Code Pattern | Inferred Permission |
|-------------|-------------------|
| `fetch(`, `http.request(`, `axios` | `network = true` |
| `spawn(`, `exec(`, `child_process` | `subprocess = true` |
| `fs.readFile`, `fs.writeFile` | `filesystem = [...]` |
| `process.env.GITHUB_TOKEN` | `env-read = ["GITHUB_TOKEN"]` |

### Phase 4: TOML Generation

Produces a well-commented `effector.toml` with:
- All detected tools as the primary capability
- Inferred types with confidence markers
- `# TODO` comments where human review is needed
- Complete `[effector.permissions]` section

## Example

Given an MCP server with:

```javascript
server.tool("search_issues", "Search GitHub issues", {
  owner: { type: "string" },
  repo: { type: "string" },
  query: { type: "string" }
}, async ({ owner, repo, query }) => {
  const response = await fetch(`https://api.github.com/...`);
  // ...
});
```

The reverse compiler generates:

```toml
[effector]
name = "search-issues"
version = "0.1.0"
description = "Search GitHub issues"
type = "skill"

[effector.interface]
input = "RepositoryRef"    # owner + repo detected
output = "Markdown"        # TODO: verify output type
context = []

[effector.permissions]
network = true             # fetch() detected
subprocess = false
filesystem = []
env-read = []
```

## Limitations

- Only detects **static** tool definitions (not dynamically registered tools)
- Type inference is heuristic — review the `# TODO` comments
- Output type defaults to `Markdown` — usually needs manual adjustment
- Doesn't parse TypeScript type annotations (works on runtime code patterns)

## After Generation

1. Review and edit the generated `effector.toml`
2. Add a `SKILL.md` with instructions
3. Run `effector-core validate .` to verify
4. Optionally run `@effectorhq/audit scan .` for security audit

## Next Steps

- [Your First Manifest](/first-manifest.html) — understand every field
- [Type Catalog](/types/index.html) — find the right type for your capability
- [Adoption Playbook](/adoption/ADOPTION_PLAYBOOK.html) — step-by-step guide for adding effector to repos
