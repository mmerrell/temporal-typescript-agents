# Temporal TypeScript Agents — Hands-On Exercises

Four exercises that progressively build a durable AI agent, starting from a raw agentic loop and ending with human-in-the-loop support.

Each exercise has an `exercise/` directory (stubs with TODOs) and a `solution/` directory (complete working code). Work in `exercise/`. Check your work against `solution/` if you get stuck.

## Prerequisites

- Node.js 22+
- Temporal dev server running: `temporal server start-dev`
- Anthropic API key: `export ANTHROPIC_API_KEY=sk-ant-...`

## Exercise progression

| # | Directory | What you build | Key concept |
|---|-----------|----------------|-------------|
| 1 | `1_temporalize/` | Wrap the raw loop in a Temporal workflow | `proxyActivities`, `callLLM` as an activity |
| 2 | `2_tool_activities/` | Extract tool calls as activities | Visibility and retryability per tool call |
| 3 | `3_clean_dispatch/` | Replace if/else with a tool registry map | Extensibility — adding a tool is one line |
| 4 | `4_hitl/` | Add human-in-the-loop support | `defineSignal`, `defineQuery`, `condition` |

Each exercise builds on the previous one. Exercise 2's starting point is Exercise 1's solution. Exercise 3's starting point is Exercise 2's solution. And so on.

## Running an exercise

Each exercise is self-contained with its own `package.json`.

```bash
cd 1_temporalize
npm install

# Terminal 1 — start the worker
npm run worker

# Terminal 2 — run the starter
npm run starter
```

To run the solution instead:

```bash
npm run worker:solution
npm run starter:solution
```

## Exercise details

### Exercise 1: Temporalize the loop

**Starting point:** `demo1-raw.ts` — a complete working raw agentic loop.

**Your job:** Make `callLLM` a Temporal activity and wrap the loop in a workflow function.

Open `exercise/workflow.ts`. The inline tool implementations are provided and complete — don't touch them. Your only job is to:
1. Create a `proxyActivities` proxy for `callLLM`
2. Write the `weatherAgentWorkflow` function that uses the proxy

Open `exercise/activities.ts` and implement `callLLM`.

**What changes in the Temporal UI:** After Exercise 1, you'll see one `ActivityTaskScheduled` event per LLM call. Tool calls are invisible — they run inside the workflow with no Temporal tracking.

### Exercise 2: Tool activities

**Starting point:** Exercise 1 solution — `callLLM` is an activity, tools still run inline.

**Your job:** Implement `getWeatherAlerts`, `getCoordinates`, and `getDistanceKm` as activities, then wire them into the workflow via `proxyActivities`.

Open `exercise/activities.ts` and implement the three tool activities.
Open `exercise/workflow.ts` and add the tool activity proxies + update the dispatch.

**What changes in the Temporal UI:** Now every tool call appears as its own activity in the event history — scheduled, started, completed, with its own timeout and retry tracking.

### Exercise 3: Clean dispatch

**Starting point:** Exercise 2 solution — all four activities wired up with if/else dispatch.

**Your job:** Replace the if/else block with a `toolHandlers` registry map.

Open `exercise/workflow.ts`. The only change is in the dispatch block. The Temporal behavior is identical — same activities, same event history. What changes is the structure.

**The insight:** Adding a new tool in the if/else version means adding a new branch. Adding a new tool in the registry version means adding one entry to the map. This sets up Exercise 4: adding `ask_user` is just one more entry.

### Exercise 4: Human in the loop

**Starting point:** Exercise 3 solution — clean dispatch, all activities wired.

**Your job:** Add signal/query/condition HITL support and an `ask_user` tool handler.

Open `exercise/workflow.ts` and follow the five steps in the TODO comment:
1. Import `defineSignal`, `defineQuery`, `setHandler`, `condition`
2. Declare `pendingQuestion` and `userInput` state variables
3. Register the signal handler
4. Register the query handler
5. Add the `ask_user` entry to `toolHandlers`

**What changes:** When Claude calls `ask_user`, the workflow suspends. Open the Temporal Web UI — the workflow shows as **Running** but no activity is executing. That's durable suspension: no threads, no polling, zero resource consumption. The workflow will sit here across any number of worker restarts until you send the signal.

Run the starter with `-it` flag to enable stdin interaction:

```bash
npx ts-node exercise/starter.ts "What are the active weather alerts in my area?"
```

## What to look for in the Temporal Web UI

As you progress through the exercises, open the Web UI at `http://localhost:8080` and compare the event histories:

- **Exercise 1**: `callLLM` appears as an activity. Tool calls are invisible.
- **Exercise 2**: Every tool call appears as its own activity. You can see exactly what data was passed and returned.
- **Exercise 3**: Event history identical to Exercise 2. The change was structural only.
- **Exercise 4**: While waiting for input, the workflow shows as Running with no active activities. After you answer, `SignalReceived` appears in the history.
