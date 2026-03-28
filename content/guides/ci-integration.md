---
title: CI/CD Integration
subtitle: Automate validation, type checking, and auditing in your pipeline.
---

# CI/CD Integration

Every manifest change should be validated before it merges. Effector provides multiple ways to integrate with your CI pipeline.

## GitHub Actions (Recommended)

The simplest path — use the official GitHub Action:

```yaml
name: Effector Validate
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - uses: effectorHQ/effector-action@v1
        with:
          path: '.'
          fail-on-warnings: 'true'
```

The action runs:
1. Schema validation (`effector.toml` structure)
2. Type checking (all types resolve against the 40-type catalog)
3. Permission verification (optional, with `audit: 'true'`)

Errors appear as **inline PR annotations** — directly on the lines that need fixing.

## Manual CI Setup

If you prefer explicit control, install and run the CLI directly:

```yaml
name: Effector CI
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install effector
        run: npm install -g @effectorhq/core

      - name: Validate manifest
        run: effector check .

      - name: Check types
        run: effector check .

      - name: Audit permissions
        run: npx @effectorhq/audit check --strict .

      - name: Compile MCP output
        run: effector compile . -t mcp
```

## GitLab CI

```yaml
effector-validate:
  image: node:22
  stage: test
  script:
    - npm install -g @effectorhq/core
    - effector check .
    - effector check .
  rules:
    - changes:
        - effector.toml
        - SKILL.md
```

## Pre-commit Hook

Validate locally before pushing:

```bash
# .git/hooks/pre-commit
#!/bin/sh
effector check . || exit 1
```

Or with [Husky](https://github.com/typicode/husky):

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "effector check ."
    }
  }
}
```

## JSON Output for CI Parsing

All CLI tools support `--format json` for machine-readable output:

```bash
effector check . --format json
```

```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "types": {
    "input": "CodeSnippet",
    "output": "ReviewReport",
    "context": ["Repository"]
  }
}
```

Parse this in CI to build custom checks, dashboards, or notifications.

## Multi-Tool Monorepo

For monorepos with multiple tools, validate each one:

```yaml
- name: Validate all tools
  run: |
    for dir in tools/*/; do
      echo "Validating $dir"
      effector check "$dir" || exit 1
    done
```

## Badge Generation

Add a validation badge to your README:

```bash
effector check .
```

This outputs a shields.io URL you can add to your README:

```markdown
![effector validated](https://img.shields.io/badge/effector-validated-brightgreen)
```

## Next Steps

- [Installation](/installation.html) — get the CLI set up
- [Security & Auditing](/guides/security.html) — add permission auditing to CI
- [Examples](/guides/examples.html) — see validation in action
