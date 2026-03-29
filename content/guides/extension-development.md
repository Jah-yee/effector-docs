---
title: Building Extensions
subtitle: Create compile targets, custom validators, and toolchain plugins for the effector ecosystem.
---

# Building Extensions

Extensions extend the effector toolchain itself — adding new compile targets, custom validation rules, or specialized analysis. Unlike skills (which are AI agent capabilities described by `effector.toml`), extensions are JavaScript modules that plug into `@effectorhq/core`.

## When to Build an Extension

Build an extension when you need:

- **New compile target** — emit tool definitions for a runtime not yet supported (e.g., AutoGPT, Semantic Kernel)
- **Custom validation rules** — enforce organization-specific policies beyond the standard schema
- **Specialized analysis** — add metrics, scoring, or reporting to the toolchain
- **Integration bridges** — connect effector to CI systems, registries, or dashboards

Build a **skill** (with `effector.toml`) when you need:
- A typed AI agent capability
- Cross-runtime portability
- Standard composition and auditing

## Extension vs Skill

| Aspect | Skill | Extension |
|--------|-------|-----------|
| Format | `effector.toml` + `SKILL.md` | JavaScript module |
| Purpose | AI agent capability | Toolchain plugin |
| Distribution | npm / local | npm / local |
| Typed interface | Yes (input/output/context) | N/A |
| Runs at | Agent runtime | Build / CI time |

## Project Structure

A typical extension:

```
my-compile-target/
├── src/
│   ├── index.js           # Entry point, exports compile function
│   ├── emitter.js          # Target-specific code generation
│   └── tests/
│       └── compile.test.js # Tests
├── effector.toml           # Extension's own manifest
├── package.json
└── README.md
```

## Example: Custom Compile Target

The most common extension type adds a new compile target. Here's how to build one that emits AutoGPT action definitions:

### 1. Define the manifest

```toml
[effector]
name = "compile-autogpt"
version = "1.0.0"
description = "Compile effector manifests to AutoGPT action format"
type = "extension"

[effector.interface]
input = "ToolDefinition"
output = "Configuration"

[effector.permissions]
network = false
subprocess = false
filesystem = ["read"]
env-read = []
```

### 2. Implement the compiler

```javascript
// src/index.js
import { parse } from '@effectorhq/core/toml-parser';
import { validate } from '@effectorhq/core/schema-validator';

/**
 * Compile an effector manifest to AutoGPT action format.
 * @param {object} definition - Parsed effector manifest
 * @param {object} options - Compile options
 * @returns {object} AutoGPT action definition
 */
export function compile(definition, options = {}) {
  const { name, version, description } = definition.effector;
  const iface = definition.effector?.interface || {};
  const perms = definition.effector?.permissions || {};

  return {
    name: name,
    version: version,
    description: description,
    parameters: mapInterfaceToParams(iface),
    permissions: {
      internet_access: perms.network ?? false,
      file_access: (perms.filesystem || []).length > 0,
    },
    output_type: iface.output || 'TextContent',
  };
}

function mapInterfaceToParams(iface) {
  const params = {};
  if (iface.input) {
    params.input = { type: iface.input, required: true };
  }
  if (iface.context) {
    for (const ctx of iface.context) {
      params[ctx.toLowerCase()] = { type: ctx, required: false };
    }
  }
  return params;
}
```

### 3. Register with the CLI

Extensions integrate via the `--target` flag in `effector compile`:

```bash
# Use your custom compile target
effector compile ./my-tool -t ./my-compile-target

# Or if published to npm
effector compile ./my-tool -t compile-autogpt
```

## Example: Custom Validation Rule

Add organization-specific validation beyond the standard schema:

```javascript
// src/rules/require-context.js

/**
 * Rule: All skills must declare at least one context type.
 * Enforces that tools are explicit about their dependencies.
 */
export const rule = {
  id: 'require-context',
  severity: 'error',
  description: 'All skills must declare at least one context type',

  check(definition) {
    const context = definition.effector?.interface?.context;
    if (!context || context.length === 0) {
      return {
        passed: false,
        message: 'Missing [effector.interface] context — declare what context your tool needs',
        fix: 'Add context = ["Repository"] or similar to [effector.interface]',
      };
    }
    return { passed: true };
  },
};
```

Use it with `@effectorhq/audit`:

```bash
effector check ./my-tool
```

## Built-in Compile Targets

The standard `@effectorhq/core compile` command supports these targets out of the box:

| Target | Flag | Output |
|--------|------|--------|
| MCP | `-t mcp` | MCP tool schema (JSON) |
| OpenAI Agents | `-t openai-agents` | OpenAI function definition |
| LangChain | `-t langchain` | LangChain tool config |
| JSON IR | `-t json` | Raw intermediate representation |

Your extension can add to this list by following the same `compile(definition, options)` function signature.

## Testing Extensions

Use Node.js built-in test runner (zero dependencies):

```javascript
// tests/compile.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { compile } from '../src/index.js';

describe('AutoGPT compiler', () => {
  it('should compile a basic skill', () => {
    const definition = {
      effector: {
        name: 'code-review',
        version: '1.0.0',
        description: 'Reviews code',
        interface: {
          input: 'CodeDiff',
          output: 'ReviewReport',
          context: ['Repository'],
        },
        permissions: {
          network: false,
          filesystem: ['read'],
        },
      },
    };

    const result = compile(definition);

    assert.strictEqual(result.name, 'code-review');
    assert.strictEqual(result.output_type, 'ReviewReport');
    assert.strictEqual(result.permissions.internet_access, false);
    assert.strictEqual(result.permissions.file_access, true);
  });

  it('should handle missing interface gracefully', () => {
    const definition = {
      effector: {
        name: 'minimal',
        version: '1.0.0',
        description: 'Minimal tool',
      },
    };

    const result = compile(definition);
    assert.deepStrictEqual(result.parameters, {});
    assert.strictEqual(result.output_type, 'TextContent');
  });
});
```

Run tests:

```bash
node --test tests/*.test.js
```

## Distribution

Publish extensions to npm like any other package:

```bash
npm publish
```

Users install and use:

```bash
npm install compile-autogpt
effector compile ./my-tool -t compile-autogpt
```

## Best Practices

1. **Follow zero-dependency policy** — use only Node.js built-ins where possible
2. **Accept the standard definition format** — your `compile()` function should accept the parsed `effector.toml` object
3. **Return structured output** — emit clean JSON or config that the target runtime expects
4. **Include tests** — test with various manifest shapes (minimal, full, edge cases)
5. **Document your target format** — explain what the output looks like and how to use it
6. **Handle missing fields gracefully** — not all manifests have all sections
7. **Add your own `effector.toml`** — even extensions should have a manifest for discoverability

## Next Steps

- [Architecture](/guides/architecture.html) — understand the effector toolchain pipeline
- [CLI Reference](/cli-reference.html) — all compile flags and options
- [Type System](/type-system.html) — the 42 standard types your extension can reference
- [Security & Auditing](/guides/security.html) — custom audit rules
