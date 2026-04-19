---
slug: exercise2
id: t6x0omxa2j8s
type: challenge
title: 'Exercise 2: Tool Activities'
teaser: Extract the tool calls out of the workflow and into proper Temporal activities
  — making every step visible, retryable, and timeout-protected.
notes:
- type: text
  contents: |-
    In Exercise 1, tool calls ran inline inside the workflow. Temporal couldn't see them — they didn't appear in the event history, they didn't get retried on failure, and they had no timeout protection.

    In this exercise you'll fix that. Move `getWeatherAlerts`, `getCoordinates`, and `getDistanceKm` into activities, then proxy them in the workflow.

    When you're done, compare the event history to Exercise 1. Every tool call now has its own `ActivityTaskScheduled` event — scheduled, started, completed, with retry tracking.
tabs:
- id: jn4m4uqdj3of
  title: Terminal 1 - Worker
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/2_tool_activities
- id: xhqpwpnwpjyp
  title: Terminal 2 - Starter
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/2_tool_activities
- id: gadsrtxejmwd
  title: VS Code
  type: service
  hostname: workshop-host
  path: ?folder=/workspace/workshop/exercises/2_tool_activities&openFile=/workspace/workshop/exercises/2_tool_activities/exercise/activities.ts
  port: 8443
- id: q7e1f5rlpste
  title: Temporal Web UI
  type: service
  hostname: workshop-host
  path: /
  port: 8080
- id: 2w0grbty6j7k
  title: Network Control Panel
  type: service
  hostname: workshop-host
  path: /
  port: 5000
difficulty: basic
timelimit: 2400
enhanced_loading: null
---

## Exercise 2: Tool activities

Open `exercise/activities.ts` in VS Code. `callLLM` is already complete — it's the Exercise 1 solution. Your job is to implement the three tool activities below it.

For each one:
- Use `Context.current().log.info(...)` to log what you're doing
- Make the HTTP call using `nodeFetch` with `nativeFetchOpts()` so the proxy can intercept it
- Throw an `Error` with a descriptive message if the response is not ok or no results found

Then open `exercise/workflow.ts` and:
1. Add `getWeatherAlerts`, `getCoordinates`, `getDistanceKm` to a `proxyActivities` call with `startToCloseTimeout: "30 seconds"`
2. Replace the three `throw new Error("not wired up yet")` lines with calls to the proxied activities

### Run it

In **Terminal 1**:

```bash
npm run worker
```

In **Terminal 2**:

```bash
npm run starter "What are the weather alerts in California, and how far is LA from San Francisco?"
```

### Retry demo

While the workflow is running, toggle **NWS Weather Alerts** off in the **Network Control Panel**. Watch the `getWeatherAlerts` activity fail and show a retry in the Temporal Web UI. Toggle it back on — the next retry succeeds and the workflow continues.

This only works because `getWeatherAlerts` is now an activity. In Exercise 1, the same failure would have crashed the workflow silently.

Click **Check** when at least one `weatherAgentWorkflow` has completed with all tool activities visible in the event history.
