---
title: Permissions Model
subtitle: Declared, auditable permissions for AI agent capabilities.
---

# Permissions Model

effector requires every capability to explicitly declare what system resources it accesses. No implicit permissions. No hidden side effects.

## Why Permissions?

AI agent tools can do dangerous things — make network requests, spawn processes, read files, access secrets. Without declared permissions, you're trusting every tool blindly.

effector's permission model makes trust **explicit and auditable**:

```toml
[effector.permissions]
network = true
subprocess = false
filesystem = ["read"]
env-read = ["GITHUB_TOKEN"]
```

This manifest says: "I need network access and to read `GITHUB_TOKEN`, but I will never spawn a subprocess or write to the filesystem."

## Permission Fields

### network

```toml
network = true   # Can make HTTP/HTTPS requests
network = false  # No network access
```

Capabilities that call APIs, fetch URLs, or make any outbound request must declare `network = true`.

### subprocess

```toml
subprocess = true   # Can spawn child processes (exec, spawn, etc.)
subprocess = false  # No process spawning
```

Capabilities that run shell commands, execute binaries, or use `child_process` must declare `subprocess = true`.

### filesystem

```toml
filesystem = []            # No filesystem access
filesystem = ["read"]      # Read-only
filesystem = ["read", "write"]  # Read and write
```

Capabilities that use `fs.readFile`, `fs.writeFile`, or any filesystem API must declare the appropriate level.

### env-read

```toml
env-read = ["GITHUB_TOKEN", "SLACK_TOKEN"]  # Specific env vars
env-read = []  # No env access
```

Capabilities that read `process.env.X` must list exactly which variables they access. This prevents accidental credential leakage.

## Permission Auditing

The `@effectorhq/audit` tool verifies that declared permissions match actual code behavior:

```bash
npx @effectorhq/audit scan .
```

It detects:

- **Permission mismatch** — code uses `fetch()` but `network = false`
- **Undeclared env vars** — code reads `process.env.SECRET` but it's not in `env-read`
- **Subprocess leaks** — code uses `exec()` but `subprocess = false`
- **Filesystem overreach** — code writes files but only `["read"]` is declared

## Trust Model

effector supports three trust states for capabilities:

| State | Meaning |
|-------|---------|
| **unsigned** | No audit has been performed |
| **audited** | Permissions have been verified by `@effectorhq/audit` |
| **signed** | Audited and cryptographically signed by a trusted party |

Trust state is tracked in the capability's metadata and visualized in the [graph tool](/types/index.html).

## Composition and Permissions

When composing capabilities, permissions are **unioned**. If Capability A needs `network = true` and Capability B needs `subprocess = true`, the composed pipeline needs both.

The composition checker flags when a pipeline's aggregate permissions exceed a threshold or when conflicting trust levels exist.

## Best Practices

1. **Minimize permissions** — only declare what you actually need
2. **Be specific with env-read** — list exact variable names, not wildcards
3. **Prefer read-only filesystem** — use `["read"]` instead of `["read", "write"]` when possible
4. **Run audits in CI** — add `@effectorhq/audit` to your test pipeline
5. **Review permission changes in PRs** — any change to `[effector.permissions]` should be reviewed carefully

## Example: Minimal vs Full Permissions

### Minimal (text-only skill)

```toml
[effector.permissions]
network = false
subprocess = false
filesystem = []
env-read = []
```

### Full (deployment skill)

```toml
[effector.permissions]
network = true
subprocess = true
filesystem = ["read", "write"]
env-read = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "DEPLOY_ENV"]
```

## Next Steps

- [Security & Auditing](/guides/security.html) — how the audit pipeline works
- [Type System](/type-system.html) — how types and permissions interact
- [CLI Reference](/cli-reference.html) — audit commands and flags
