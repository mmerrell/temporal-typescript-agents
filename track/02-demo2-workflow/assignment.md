---
slug: demo2-workflow
id: 4kity9z7ecxg
type: challenge
title: 'Demo 2: The Agentic Loop as a Temporal Workflow'
teaser: The same loop, now running inside Temporal. Restart the worker mid-run — the
  workflow resumes exactly where it left off.
notes:
- type: text
  contents: |-
    Same query. Same tools. Same Claude model.

    The difference: every LLM call and every tool execution is now a Temporal activity. The loop runs inside a workflow function. Temporal records every step to the event history.

    Kill the worker mid-run. Restart it. The workflow picks up from the last completed activity — not from the beginning.

    That's durability. You get it for free by wrapping the loop in a workflow.
tabs:
- id: lyx7txplh0jv
  title: Terminal 1 - Worker
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/agent
- id: vlv0yed95bzb
  title: Terminal 2 - Starter
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/agent
- id: pvffswir8yop
  title: VS Code
  type: service
  hostname: workshop-host
  path: ?folder=/workspace/workshop/agent&openFile=/workspace/workshop/agent/demo2-workflow.ts
  port: 8443
- id: etfqdaeycz4l
  title: Temporal Web UI
  type: service
  hostname: workshop-host
  path: /
  port: 8080
- id: zxhmvilhoiur
  title: Network Control Panel
  type: service
  hostname: workshop-host
  path: /
  port: 5000
difficulty: basic
timelimit: 1800
enhanced_loading: null
---

## Demo 2: The agentic loop as a Temporal workflow

Open `demo2-workflow.ts` in VS Code alongside `demo1-raw.ts`. Compare them. The loop structure is identical — `while (true)`, check `stop_reason`, dispatch tools. What's different:

- Activities are called via `proxyActivities` instead of direct function calls
- `callLLM` is an activity with retries disabled (a new LLM response breaks replay)
- Each tool call is a separate activity — retryable, timeout-protected, recorded

### Start the worker

In **Terminal 1**:

```bash
npx ts-node worker.ts
```

Leave it running.

### Run the workflow

In **Terminal 2**:

```bash
npx ts-node starter2.ts "What are the weather alerts in California, and how far is Los Angeles from San Francisco?"
```

### Watch it in the Temporal Web UI

Open the **Temporal Web UI** tab. Find the running workflow. Click into it and watch the event history fill in: `WorkflowExecutionStarted` → `ActivityTaskScheduled` (callLLM) → `ActivityTaskCompleted` → `ActivityTaskScheduled` (getWeatherAlerts) → ...

Each activity is a row in the history. This is the full audit trail Temporal is recording.

### Restart the worker mid-run

Start a longer query so you have more time:

```bash
npx ts-node starter2.ts "What are the weather alerts in California, Texas, Florida, and New York?"
```

While it's running, go to **Terminal 1** and stop the worker with `Ctrl+C`. Watch the workflow in the UI — it stays **Running** (not Failed). Restart the worker:

```bash
npx ts-node worker.ts
```

The workflow resumes from the last completed activity. Nothing is replayed that already finished.

### Toggle an API off mid-run

Start another workflow in Terminal 2. While it's running, go to the **Network Control Panel** and toggle **NWS Weather Alerts** off. Watch the activity fail in the Temporal UI — it shows as a retry. Toggle the API back on. The next retry succeeds and the workflow continues.

Click **Check** when at least one workflow has completed successfully.
