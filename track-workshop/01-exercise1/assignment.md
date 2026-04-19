---
slug: exercise1
id: 8golldiwtxu2
type: challenge
title: 'Exercise 1: Temporalize the Loop'
teaser: Take a working raw agentic loop and wrap it in a Temporal workflow — proxying
  all activities so the workflow contains no I/O.
notes:
- type: text
  contents: |-
    The raw agentic loop in `demo1-raw.ts` works — but it's fragile. Kill it mid-run and everything is lost.

    In this exercise you'll make it durable. All four activities are already implemented in `activities.ts` — your job is entirely in `workflow.ts`.

    You need to:
    - Create `proxyActivities` proxies for all four activities
    - Write the `weatherAgentWorkflow` function that runs the loop

    A key rule: **workflow files must never import I/O libraries**. No `node-fetch`, no HTTP clients, no database drivers. All I/O lives in activities. The Temporal bundler enforces this — it will reject your workflow if it detects network imports.
- type: text
  contents: |-
    **Before you start:** make sure your Anthropic API key is set in Terminal 1.

    ```
    export ANTHROPIC_API_KEY=sk-ant-...
    ```

    Arrow-up to re-run this in any later exercise.

    **Note:** Requires API credits from platform.anthropic.com — Claude.ai subscription credits won't work here.
tabs:
- id: z5i36u9f9euy
  title: Terminal 1 - Worker
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/1_temporalize
- id: 42ll7vbjtjgl
  title: Terminal 2 - Starter
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/1_temporalize
- id: gffpwe5fpvsy
  title: VS Code
  type: service
  hostname: workshop-host
  path: ?folder=/workspace/workshop/exercises/1_temporalize&openFile=/workspace/workshop/exercises/1_temporalize/exercise/workflow.ts
  port: 8443
- id: iukk0dz77bac
  title: Temporal Web UI
  type: service
  hostname: workshop-host
  path: /
  port: 8080
- id: o1xs8dkmapl0
  title: Network Control Panel
  type: service
  hostname: workshop-host
  path: /
  port: 5000
difficulty: basic
timelimit: 2400
enhanced_loading: null
---

## Exercise 1: Temporalize the loop

Open `exercise/workflow.ts` in VS Code. All four activities are already complete in `exercise/activities.ts` — **do not touch that file**. Your job is entirely in `workflow.ts`.

### What to implement

**Step 1** — Create a proxy for `callLLM`:
```typescript
import { proxyActivities } from "@temporalio/workflow";
import type * as acts from "./activities";

const { callLLM } = proxyActivities<typeof acts>({
  startToCloseTimeout: "60 seconds",
});
```

**Step 2** — Create a proxy for the tool activities:
```typescript
const { getWeatherAlerts, getCoordinates, getDistanceKm } =
  proxyActivities<typeof acts>({
    startToCloseTimeout: "30 seconds",
  });
```

**Step 3** — Export `weatherAgentWorkflow`:
```typescript
export async function weatherAgentWorkflow(query: string): Promise<string> {
  const messages = [{ role: "user", content: query }];
  while (true) {
    const { content, stopReason } = await callLLM(
      messages as Parameters<typeof acts.callLLM>[0]
    );
    // handle end_turn and tool_use...
  }
}
```

The loop structure is identical to `demo1-raw.ts`. The only difference: every function call goes through `proxyActivities`.

### Run it

Make sure your API key is set, then in **Terminal 1**:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run worker
```

In **Terminal 2**:

```bash
npm run starter "What are the weather alerts in California?"
```

### Watch the Temporal Web UI

Open the **Temporal Web UI** tab. Find your workflow and click into it. You should see separate `ActivityTaskScheduled` events for `callLLM` and each tool call. Every step is now recorded.

### Restart the worker mid-run

Start a longer query in Terminal 2. While it's running, `Ctrl+C` the worker in Terminal 1. The workflow stays **Running** in the UI. Restart the worker — the workflow resumes from the last completed activity.

Click **Check** when at least one `weatherAgentWorkflow` has completed.
