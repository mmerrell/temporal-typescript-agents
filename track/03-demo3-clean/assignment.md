---
slug: demo3-clean
id:
type: challenge
title: "Demo 3: Clean Tool Dispatch"
teaser: Same workflow, no if/else chain. A tool registry map makes adding new tools a one-liner — and sets up Demo 4 perfectly.
notes:
- type: text
  contents: |-
    Demo 2's workflow has a growing if/else block. Every new tool means a new branch.

    Demo 3 replaces it with a registry map: tool name → handler function. The loop shrinks to a single lookup. Adding a new tool is one entry in the map.

    Temporal behavior is completely unchanged — same activities, same event history, same durability. The only difference is the structure of the dispatch code.

    Pay attention to how this sets up Demo 4: adding human-in-the-loop will be just one more entry in the registry.
tabs:
- title: Terminal 1 - Worker
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/agent
- title: Terminal 2 - Starter
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/agent
- title: VS Code
  type: service
  hostname: workshop-host
  path: ?folder=/workspace/workshop/agent&openFile=/workspace/workshop/agent/demo3-clean.ts
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
timelimit: 1200
enhanced_loading: null
---

## Demo 3: Clean tool dispatch

Open `demo3-clean.ts` in VS Code and open `demo2-workflow.ts` side by side (**View → Editor Layout → Two Columns**).

Find the `toolHandlers` map in `demo3-clean.ts`:

```typescript
const toolHandlers: Record<string, ToolHandler> = {
  get_weather_alerts: async (input) => getWeatherAlerts(input.state as string),
  get_coordinates:   async (input) => { ... },
  get_distance_km:   async (input) => { ... },
};
```

Then find the equivalent block in `demo2-workflow.ts` — the `if/else` chain. Count the branches. Now look at the dispatch loop in Demo 3:

```typescript
const handler = toolHandlers[toolName];
const result = handler
  ? await handler(toolInput as Record<string, unknown>)
  : `Unknown tool: ${toolName}`;
```

That's the entire dispatch. Adding any new tool means adding one entry to the map and zero changes to the loop.

### Run it

In **Terminal 1** (if the worker isn't already running):

```bash
npx ts-node worker.ts
```

In **Terminal 2**:

```bash
npx ts-node starter3.ts "What are the weather alerts in Florida, and how far is Miami from Orlando?"
```

### Check the event history

Open the **Temporal Web UI** and find the `weatherAgentCleanWorkflow` run. The event history is structurally identical to Demo 2 — same activity types, same sequence. The registry pattern changed the code; it didn't change what Temporal records.

### Think ahead to Demo 4

Look at the `toolHandlers` map. Where would you add a handler that pauses the workflow and waits for human input? It would go right here — one more key, one more handler. That's exactly what Demo 4 does.

Click **Check** when at least one `weatherAgentCleanWorkflow` has completed.
