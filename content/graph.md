---
title: Graph Explorer
subtitle: Interactive dependency graph visualization for capability registries.
---

# Graph Explorer

The effector Graph Explorer visualizes capability registries as interactive D3 force-directed graphs. See how capabilities connect through their types, explore the type spectrum, and analyze composition patterns.

## When to use Graph Explorer

- You need registry-level visibility (not single manifest editing)
- You want to inspect composition density, trust, and type coverage
- You need diff views between two registry snapshots

If you are editing one manifest, use [Playground](/playground.html) or [Studio](/studio.html).

## Views

### Explorer
D3 force-directed graph showing capabilities as nodes and type connections as edges. Click nodes to inspect, drag to rearrange, search to filter.

### Spectrum
Interactive polar chart of all 42 types. Click any type to see which capabilities use it as input, output, or context.

### Dashboard
Statistics overview: type coverage, composition density, trust distribution, permission breakdown across the registry.

### Pipeline
YAML-based pipeline editor. Define multi-step workflows and see them rendered as directed graphs.

### Diff
Compare two registry states over time. See what capabilities were added, removed, or modified.

## Run Locally

```bash
cd effector-graph
node src/cli.js serve ./path/to/registry
# → http://localhost:3000
```

## CLI

```bash
# Generate SVG graph
node src/cli.js render ./registry -f svg -o graph.svg

# Generate JSON graph data
node src/cli.js render ./registry -f json -o graph.json

# Generate interactive HTML
node src/cli.js render ./registry -f html -o graph.html

# Start web server with all views
node src/cli.js serve ./registry
```

## Web Components

Embed graphs in any web page:

```html
<script src="effector-graph-components.js"></script>
<effector-graph src="graph.json"></effector-graph>
<effector-spectrum src="graph.json"></effector-spectrum>
```

## Source

- **Repository**: [effectorHQ/effector-graph](https://github.com/effectorHQ/effector-graph)
- **Architecture**: D3.js loaded from CDN, Node.js CLI + web server, zero npm dependencies
- **Tests**: 12 passing
