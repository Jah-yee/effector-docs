---
title: CLI Reference
subtitle: All commands, flags, and examples for the effector CLI.
---

# CLI Reference

The `@effectorhq/core` CLI provides commands for validating, compiling, and managing effector manifests.

## Usage

```bash
effector <command> [dir] [options]
```

If `dir` is omitted, the current directory is used.

## Commands

### validate

Parse and validate `effector.toml` and `SKILL.md`.

```bash
effector check [dir]
```

Checks:
- TOML syntax is valid
- Schema validation (required fields, correct types)
- Type checking against the 42-type catalog
- SKILL.md structure (if present)

**Exit codes**: `0` = valid, `1` = errors found

### compile

Compile `effector.toml` to a runtime target.

```bash
effector compile [dir] -t <target>
```

**Targets**:

| Target | Output |
|--------|--------|
| `mcp` | MCP tool schema JSON |
| `openai-agents` | OpenAI function definition |
| `langchain` | LangChain tool config |
| `json` | Normalized JSON IR |

**Example**:

```bash
effector compile ./my-skill -t mcp
```

### check-types

Validate interface types against the 42-type catalog.

```bash
effector check [dir]
```

Reports unknown types, suggests corrections, and shows type details.

### types

List all standard types in the catalog.

```bash
effector types
```

Outputs all 42 types grouped by category (input, output, context).

### init

Scaffold a new `effector.toml` and `SKILL.md`.

```bash
effector init
```

Creates a minimal valid manifest in the current directory.

### init --from-mcp

Auto-generate `effector.toml` from an existing MCP server project.

```bash
effector init --from-mcp [dir]
```

Scans source code to detect:
- Tool definitions (MCP SDK patterns)
- Input/output type mapping
- Permission requirements (network, subprocess, filesystem, env vars)

Produces a well-commented `effector.toml` with `# TODO` markers where manual review is needed.

### badge

Generate a shields.io badge URL for your capability.

```bash
effector check [dir]
```

Outputs a URL like:

```
https://img.shields.io/badge/effector-CodeDiff%20→%20ReviewReport-E03E3E
```

Paste into your README to show interface types.

## Global Options

| Flag | Short | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |
| `--target` | `-t` | Compile target (for `compile` command) |
| `--from-mcp` | | Generate from MCP server (for `init` command) |

## Environment Variables

| Variable | Effect |
|----------|--------|
| `NO_COLOR` | Disable colored output |

## Examples

```bash
# Validate a project
effector check ./my-skill

# Compile to MCP
effector compile ./my-skill -t mcp

# List all types
effector types

# Scaffold a new project
effector init

# Auto-generate from MCP server
effector init --from-mcp ./my-mcp-server

# Get a badge URL
effector check ./my-skill
```

## Programmatic API

### Fluent Builder

The simplest way to use effector programmatically:

```javascript
import { Effector } from '@effectorhq/core';

const result = Effector
  .fromDir('./my-skill')
  .validate()
  .checkTypes()
  .compile('mcp');

console.log(result); // MCP tool schema, ready to use
```

### Subpath Imports

For tree-shakeable usage, import individual modules:

```javascript
import { parseEffectorToml } from '@effectorhq/core/toml';
import { parseSkillFile } from '@effectorhq/core/skill';
import { checkTypeCompatibility, isKnownType } from '@effectorhq/core/types';
import { validateManifest } from '@effectorhq/core/schema';
import { compile, registerTarget } from '@effectorhq/core/compile';
```

### Barrel Exports

| Export | Description |
|--------|-------------|
| `Effector` | Fluent builder: `.fromDir()` → `.validate()` → `.compile()` |
| `parseEffectorToml(content)` | Parse effector.toml → `EffectorDef` |
| `parseSkillFile(content)` | Parse SKILL.md → `ParsedSkill` |
| `checkTypeCompatibility(out, in)` | Check type compatibility → `TypeCheckResult` |
| `isKnownType(name)` | Check if type exists in catalog |
| `validateManifest(def)` | Validate manifest → `{ valid, errors, warnings }` |
| `compile(def, target)` | Compile to runtime target → string |
| `registerTarget(name, fn)` | Register a custom compile target |

### Custom Compile Targets

Register your own compile target:

```javascript
import { registerTarget, compile } from '@effectorhq/core';

registerTarget('crewai', (def) => {
  return JSON.stringify({
    name: def.name,
    description: def.description,
    expected_output: `A ${def.interface?.output} from ${def.interface?.input}`,
  }, null, 2);
}, { description: 'CrewAI agent tool', format: 'json' });

compile(myDef, 'crewai'); // works!
```

### Type Compatibility Rules

```
1. Exact match           → precision 1.0
2. Alias resolution      → precision 0.95  (PlainText → String)
3. Subtype relation      → precision 0.9   (SecurityReport → ReviewReport)
4. Wildcard matching     → precision 0.8   (*Report matches ReviewReport)
5. Structural subtyping  → precision varies
6. Otherwise             → incompatible
```

See the [API Reference](/api/index.html) for the full module surface.
