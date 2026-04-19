---
slug: environment
id:
type: challenge
title: "Welcome: Check Your Environment"
teaser: Set your Anthropic API key, verify services are running, and get oriented.
notes:
- type: text
  contents: |-
    Welcome to the Temporal TypeScript AI Agents hands-on workshop.

    You'll build a durable AI agent from scratch across four exercises — each one adding a layer of production-readiness to a raw agentic loop.

    By the end you'll have a workflow that survives worker restarts, retries failed tool calls automatically, and can pause mid-execution to ask a human a question.

    This first challenge confirms everything is running before you start writing code.
tabs:
- title: Terminal
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises
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

Let's confirm everything is ready before you start writing code.

### Set your Anthropic API key

This workshop calls the Anthropic API directly. You need API credits from [platform.anthropic.com](https://platform.anthropic.com) — Claude.ai and Claude Desktop subscription credits are a separate billing system and won't work here.

Export your key in the terminal. Arrow-up to re-run this in any later exercise:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Verify it's set:

```bash
echo $ANTHROPIC_API_KEY
```

You should see your key starting with `sk-ant-`.

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

### Check exercise dependencies

```bash
ls /workspace/workshop/exercises/1_temporalize/node_modules/@temporalio
```

You should see `activity`, `client`, `worker`, `workflow`.

### Check the Network Control Panel

Click the **Network Control Panel** tab. You should see three toggles — Anthropic (Claude), NWS Weather Alerts, and Nominatim Geocoding — all green.

### Open the Temporal Web UI

Click the **Temporal Web UI** tab. No workflows yet — that's expected.

Click **Check** when everything looks good.
