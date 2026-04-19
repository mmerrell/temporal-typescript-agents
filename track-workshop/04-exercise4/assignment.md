---
slug: exercise4
id:
type: challenge
title: "Exercise 4: Human in the Loop"
teaser: Add signal, query, and condition to durably suspend the workflow and wait for human input — then resume exactly where it left off.
notes:
- type: text
  contents: |-
    What happens when the agent doesn't have enough information to proceed?

    In this exercise you'll add an `ask_user` tool to the registry. When Claude calls it, the workflow suspends — durably. No thread is spinning. No timer is ticking. The workflow simply waits, recorded in the event history, surviving any number of worker restarts.

    Three Temporal primitives make this work:
    - `condition()` — suspends the workflow until a predicate becomes true
    - `defineSignal` — delivers the user's answer into the running workflow
    - `defineQuery` — lets the starter poll for a pending question

    The `ask_user` handler is one entry in the `toolHandlers` map. Everything else stays the same.
- type: text
  contents: |-
    **Reminder:** make sure your Anthropic API key is set in Terminal 1 before starting the worker.

    ```
    export ANTHROPIC_API_KEY=sk-ant-...
    ```
tabs:
- title: Terminal 1 - Worker
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/4_hitl
- title: Terminal 2 - Starter
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/exercises/4_hitl
- title: VS Code
  type: service
  hostname: workshop-host
  path: ?folder=/workspace/workshop/exercises/4_hitl&openFile=/workspace/workshop/exercises/4_hitl/exercise/workflow.ts
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
difficulty: intermediate
timelimit: 2400
enhanced_loading: null
---

## Exercise 4: Human in the loop

Open `exercise/workflow.ts` in VS Code. The activity proxies and `toolHandlers` map are already there — follow the five TODO steps in the file comments to add HITL support.

### The five steps

**Step 1** — Add imports:
```typescript
import { proxyActivities, condition, defineSignal, defineQuery, setHandler } from "@temporalio/workflow";
```

**Step 2** — Define signal and query outside the workflow function:
```typescript
export const provideUserInputSignal = defineSignal<[string]>("provide_user_input");
export const getPendingQuestionQuery = defineQuery<string | null>("get_pending_question");
```

**Step 3** — Declare state variables inside the workflow function:
```typescript
let pendingQuestion: string | null = null;
let userInput: string | null = null;
```

**Step 4** — Register handlers:
```typescript
setHandler(provideUserInputSignal, (input: string) => {
  userInput = input;
  pendingQuestion = null;
});
setHandler(getPendingQuestionQuery, () => pendingQuestion);
```

**Step 5** — Add `ask_user` to `toolHandlers`:
```typescript
ask_user: async (input) => {
  pendingQuestion = input.question as string;
  userInput = null;
  await condition(() => userInput !== null);
  const answer = userInput!;
  userInput = null;
  return answer;
},
```

### Run it

In **Terminal 1**:
```bash
npm run worker
```

In **Terminal 2** (note: the starter handles stdin interactively):
```bash
npx ts-node exercise/starter.ts "What are the active weather alerts in my area?"
```

When the agent asks a question, answer it in Terminal 2.

### Watch the Temporal Web UI

While the workflow is waiting for your answer, open the **Temporal Web UI**. Find the `weatherAgentHITLWorkflow` run. It shows as **Running** — but there are no executing activities. That's durable suspension: the workflow is waiting for a signal, consuming zero resources.

After you answer, watch `SignalReceived` appear in the event history, followed by the next `ActivityTaskScheduled` as the workflow picks up where it left off.

### Restart the worker while waiting

Run the workflow again. When it asks a question, stop the worker in Terminal 1 (`Ctrl+C`). The Temporal UI shows the workflow still **Running** — it survived the worker restart. Restart the worker and answer the question. The workflow resumes.

Click **Check** when at least one `weatherAgentHITLWorkflow` has completed.
