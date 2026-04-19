---
slug: exercise3
id: gk2j8djyldij
type: challenge
title: 'Exercise 3: Clean Tool Dispatch'
teaser: Replace the if/else dispatch chain with a tool registry map — adding a new
  tool becomes one line, and the loop stays unchanged.
notes:
- type: text
  contents: |-
    Exercise 2's workflow has a growing if/else block. Every new tool means a new branch, a new variable, and changes to the loop.

    In this exercise you'll replace it with a registry map: tool name → handler function. The loop shrinks to a single lookup. Adding a new tool is one entry in the map.

    The Temporal behavior is completely unchanged — same activities, same event history. The change is structural.

    Pay attention to how this sets up Exercise 4: adding `ask_user` for human-in-the-loop will be exactly one more entry in the map.
tabs:
- id: mb13zj8xx0in
  title: Terminal 1 - Worker
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/3_clean_dispatch
- id: hhznqqfppxgo
  title: Terminal 2 - Starter
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/3_clean_dispatch
- id: ylt4mmmegde5
  title: VS Code
  type: service
  hostname: workshop-host
  path: ?folder=/workspace/workshop/exercises/3_clean_dispatch&openFile=/workspace/workshop/exercises/3_clean_dispatch/exercise/workflow.ts
  port: 8443
- id: z6obxqtehgab
  title: Temporal Web UI
  type: service
  hostname: workshop-host
  path: /
  port: 8080
- id: 4lhiyqu29qwn
  title: Network Control Panel
  type: service
  hostname: workshop-host
  path: /
  port: 5000
difficulty: basic
timelimit: 1800
enhanced_loading: null
---

## Exercise 3: Clean tool dispatch

Open `exercise/workflow.ts` in VS Code. The activity proxies and loop are already complete — your only job is the dispatch block.

### What to implement

Replace the `if/else` block with a `toolHandlers` registry map:

**Step 1** — define the type:
```typescript
type ToolHandler = (input: Record<string, unknown>) => Promise<string>;
```

**Step 2** — create the map:
```typescript
const toolHandlers: Record<string, ToolHandler> = {
  get_weather_alerts: async (input) => getWeatherAlerts(input.state as string),
  get_coordinates: async (input) => {
    const coords = await getCoordinates(input.location as string);
    return JSON.stringify(coords);
  },
  get_distance_km: async (input) => {
    const dist = await getDistanceKm(...);
    return JSON.stringify(dist);
  },
};
```

**Step 3** — replace the if/else with a single lookup:
```typescript
const handler = toolHandlers[toolName];
const result = handler
  ? await handler(toolInput as Record<string, unknown>)
  : `Unknown tool: ${toolName}`;
```

### Run it

In **Terminal 1**:
```bash
npm run worker
```

In **Terminal 2**:
```bash
npm run starter "What are the weather alerts in Texas, and how far is Dallas from Houston?"
```

### Compare event histories

Open the **Temporal Web UI** and look at the event history for this workflow and one from Exercise 2. They should be structurally identical — same activity types, same sequence. The registry pattern changed the code; it didn't change what Temporal records.

### Think ahead to Exercise 4

Look at your `toolHandlers` map. Adding `ask_user` — the HITL handler — is exactly one more entry. That's what you'll do in Exercise 4.

Click **Check** when at least one `weatherAgentCleanWorkflow` has completed.
