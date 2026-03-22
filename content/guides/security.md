---
title: Security & Auditing
subtitle: Verify permissions, detect mismatches, and track trust state.
---

# Security & Auditing

Every AI agent tool requests permissions — file system access, network calls, credential reads. Effector makes these permissions **declared, verifiable, and auditable**.

## The Permission Model

Permissions are declared in `effector.toml` under `[effector.permissions]`:

```toml
[effector.permissions]
fs_read = true
fs_write = false
network = true
env_access = ["GITHUB_TOKEN"]
```

This is not optional decoration. It's a **contract** — the tool declares exactly what it needs, and effector-audit verifies the source code matches.

## Running an Audit

```bash
npx @effectorhq/audit check .
```

The auditor scans your source code and compares actual behavior against declared permissions:

```
✓ fs_read: declared and used (readFile found in src/index.js:14)
✗ fs_write: NOT declared but used (writeFile found in src/index.js:28)
✓ network: declared and used (fetch found in src/index.js:42)
⚠ env_access: declares GITHUB_TOKEN but also reads API_KEY (src/index.js:7)
```

## Trust States

Every effector capability has a trust state:

| State | Meaning |
|---|---|
| `unsigned` | Default. Manifest exists but no verification |
| `audited` | Passed effector-audit — permissions match source |
| `signed` | Cryptographically signed by a trusted party |

Trust states are tracked in the manifest and visible to runtimes:

```toml
[effector.trust]
state = "audited"
audited_at = "2025-03-15T10:30:00Z"
auditor = "effector-audit@1.0.0"
```

## Permission-Interface Mismatch Detection

One of effector-audit's most valuable checks: does the **interface** match the **permissions**?

Example: a tool declares `output = "SecurityReport"` but doesn't declare `network` permission. How can it produce a security report without network access to scan anything?

```bash
npx @effectorhq/audit check --strict .
```

```
⚠ interface-permission mismatch:
  output "SecurityReport" typically requires network access
  but [effector.permissions].network = false
```

This catches a class of bugs that no other tool detects — the semantic gap between what a tool *claims* to do and what it's *allowed* to do.

## Audit Rules

### Built-in Rules

| Rule | Description |
|---|---|
| `undeclared-fs-read` | Source uses file read APIs without `fs_read = true` |
| `undeclared-fs-write` | Source uses file write APIs without `fs_write = true` |
| `undeclared-network` | Source uses fetch/http without `network = true` |
| `undeclared-env` | Source reads env vars not listed in `env_access` |
| `overprivileged` | Declares permissions not found in source code |
| `interface-mismatch` | Output type implies capabilities not permitted |

### Severity Levels

- **error**: Permission used but not declared (security risk)
- **warning**: Permission declared but not used (overprivileged)
- **info**: Interface-permission correlation suggestions

## CI Integration

Add audit checks to your CI pipeline:

```yaml
- name: Effector Audit
  run: npx @effectorhq/audit check --strict --format json .
```

The `--format json` flag outputs machine-readable results for CI parsing.

## Auditing Composed Pipelines

When tools compose, permissions aggregate. effector-audit can check the *combined* permission surface of a pipeline:

```bash
npx @effectorhq/audit pipeline ./tool-a ./tool-b ./tool-c
```

This answers: "What's the total permission footprint of this pipeline?" — critical for security reviews.

## Using Programmatically

```javascript
import { audit } from '@effectorhq/audit';

const results = audit({
  manifestPath: './effector.toml',
  sourcePaths: ['./src'],
  strict: true
});

for (const finding of results.findings) {
  console.log(`[${finding.severity}] ${finding.rule}: ${finding.message}`);
}
```

## Best Practices

1. **Principle of least privilege**: Only declare permissions your tool actually needs
2. **Run audit in CI**: Catch permission drift before merge
3. **Use strict mode**: Treat interface-permission mismatches as errors
4. **Review overprivileged warnings**: A tool that declares `fs_write` but never writes is suspicious
5. **Track trust state**: Move from `unsigned` → `audited` → `signed` as confidence grows

## Next Steps

- [Permissions Model](/permissions.html) — deep dive into the permission system
- [CLI Reference](/cli-reference.html) — all audit commands and flags
- [Composition Guide](/guides/composition.html) — verify permissions across pipelines
