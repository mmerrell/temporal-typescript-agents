---
slug: exercise1
id:
type: challenge
title: "Exercise 1: Temporalize the Loop"
teaser: Take a working raw agentic loop and wrap it in a Temporal workflow — making the LLM call a durable activity.
notes:
- type: text
  contents: |-
    The raw agentic loop in `demo1-raw.ts` works — but it's fragile. Kill it mid-run and everything is lost.

    In this exercise you'll make one targeted change: move the LLM call into a Temporal activity, and wrap the loop in a workflow function.

    Tool calls still run inline for now. That's intentional — you'll see why in Exercise 2 when you compare the event histories.
- type: text
  contents: |-
    **Before you start:** make sure your Anthropic API key is set.

    ```
    export ANTHROPIC_API_KEY=sk-ant-...
    ```

    Arrow-up to re-run this in any later exercise.

    **Note:** Requires API credits from platform.anthropic.com — Claude.ai subscription credits won't work here.
tabs:
- title: Terminal 1 - Worker
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/1_temporalize
- title: Terminal 2 - Starter
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/1_temporalize
- title: VS Code
  type: service
  hostname: workshop-host
  path: ?folder=/workspace/workshop/exercises/1_temporalize&openFile=/workspace/workshop/exercises/1_temporalize/exercise/workflow.ts
  port: 8443
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
timelimit: 2400
enhanced_loading: null
---

## Exercise 1: Temporalize the loop

Open `exercise/workflow.ts` in VS Code. The inline tool implementations are already complete — don't touch them. Your job is the workflow wrapper.

Also open `exercise/activities.ts` — you'll need to implement `callLLM` there.

### What to implement

**In `exercise/activities.ts`:**

Implement `callLLM` — the only activity in this exercise. It should:
- Create an `Anthropic` client with `fetch: proxiedFetch` and `maxRetries: 0`
- Call `client.messages.create(...)` with the given messages and tools
- Return `{ content, stopReason }`

The proxy setup is already written for you at the top of the file.

**In `exercise/workflow.ts`:**

1. Create a `proxyActivities` proxy for `callLLM` with `startToCloseTimeout: "60 seconds"`
2. Export `weatherAgentWorkflow(query: string): Promise<string>` that runs the agentic loop using the proxied `callLLM`, calling `runTool` inline for tool execution

### Run it

In **Terminal 1**, start the worker:

```bash
npm run worker
```

In **Terminal 2**, run the starter:

```bash
npm run starter "What are the weather alerts in California?"
```

### What to look for in the Temporal Web UI

Open the **Temporal Web UI** tab and find your workflow. You should see `callLLM` appearing as an `ActivityTaskScheduled` event in the history. Tool calls are invisible — they ran inline, not as activities.

### Restart the worker mid-run

Start a longer query in Terminal 2, then `Ctrl+C` the worker in Terminal 1 while it's running. Check the Temporal UI — the workflow stays **Running**. Restart the worker:

```bash
npm run worker
```

The workflow resumes from the last completed `callLLM` activity.

Click **Check** when at least one `weatherAgentWorkflow` has completed.
