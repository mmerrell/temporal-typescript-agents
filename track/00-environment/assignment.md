---
slug: environment
id:
type: challenge
title: "Welcome: Check Your Environment"
teaser: Verify your API key, confirm services are running, and get oriented.
notes:
- type: text
  contents: |-
    Welcome to the Temporal TypeScript AI Agents workshop.

    In this track you'll watch a raw agentic loop evolve into a durable, observable, fault-tolerant system — four demos, each building on the last.

    This first challenge gets you oriented and confirms everything is running before you dive in.
tabs:
- title: Terminal
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/agent
- title: Temporal Web UI
  type: service
  hostname: workshop-host
  path: /
  port: 8080
- title: Network Control Panel
  type: service
  hostname: workshop-host
  path: /
  port: 5000
difficulty: basic
timelimit: 600
enhanced_loading: null
---

## Welcome to the Temporal TypeScript AI Agents workshop

Let's confirm everything is ready before starting the demos.

### Set your API key

Instruqt injects your Anthropic API key automatically. Verify it's available:

```bash
echo $ANTHROPIC_API_KEY
```

You should see a value starting with `sk-ant-`. If it's empty, let your instructor know.

### Check Node.js

```bash
node --version
```

You should see `v22.x.x`.

### Check the Temporal server

```bash
temporal operator cluster health --address 127.0.0.1:7233
```

You should see `SERVING`.

### Check the worker dependencies

```bash
ls /workspace/workshop/agent/node_modules/@temporalio
```

You should see `activity`, `client`, `worker`, `workflow`.

### Check the Network Control Panel

Click the **Network Control Panel** tab above. You should see three toggles — Anthropic (Claude), NWS Weather Alerts, and Nominatim Geocoding — all green. Leave them on for now.

### Open the Temporal Web UI

Click the **Temporal Web UI** tab. You should see the Temporal UI with no workflows yet. That's expected — nothing has run yet.

Click **Check** when everything looks good.
