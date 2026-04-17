---
slug: demo4-hitl
id:
type: challenge
title: "Demo 4: Human in the Loop"
teaser: The agent pauses mid-execution to ask a question. While it waits, the workflow is durably suspended — no threads, no polling, zero resources consumed.
notes:
- type: text
  contents: |-
    What happens when the agent doesn't have enough information to proceed?

    In Demo 4, Claude has access to an `ask_user` tool. When it needs clarification, it calls that tool — and the workflow suspends. No thread is spinning. No timer is ticking. The workflow is simply waiting, recorded in the event history, durable across any number of worker restarts.

    Three Temporal primitives make this work:
    - `condition()` — suspends the workflow until a predicate is true
    - `@signal` — delivers the user's answer into the running workflow
    - `@query` — lets the starter poll to detect a pending question

    The ask_user handler in the tool registry is just one function. The rest of the workflow is unchanged.
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
  path: ?folder=/workspace/workshop/agent&openFile=/workspace/workshop/agent/demo4-hitl.ts
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
timelimit: 1800
enhanced_loading: null
---

## Demo 4: Human in the loop

Open `demo4-hitl.ts` in VS Code. Find the `ask_user` entry in the `toolHandlers` map:

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

This is the entire HITL implementation. `condition()` suspends the workflow. A signal from the starter sets `userInput`, which satisfies the condition. The handler returns the answer as the tool result, and the loop continues.

### Start the worker

In **Terminal 1** (if not already running):

```bash
npx ts-node worker.ts
```

### Run the HITL workflow

In **Terminal 2** (note: `-it` flag for interactive stdin):

```bash
npx ts-node starter4.ts "Should I worry about weather near me?"
```

The starter will poll for a pending question. When one appears, it prints:

```
[Agent asks]: Which US state are you in?
Your answer:
```

Type your state (e.g. `CA`) and press Enter.

### Watch it in the Temporal Web UI

While the workflow is waiting for your input, open the **Temporal Web UI**. Find the `weatherAgentHITLWorkflow` run. It shows as **Running** with no active activity executions — the workflow is suspended, not polling. This is durable suspension: no resources are consumed.

After you answer, watch the event history: `SignalReceived` appears, followed by the next `ActivityTaskScheduled` as the workflow picks up where it left off.

### Restart the worker while waiting

Run the workflow again. When it asks a question, go to **Terminal 1** and stop the worker (`Ctrl+C`). Check the Temporal UI — the workflow is still **Running**. Restart the worker:

```bash
npx ts-node worker.ts
```

Now answer the question in Terminal 2. The workflow resumes — the signal is delivered, the condition is satisfied, and execution continues.

Click **Check** when at least one `weatherAgentHITLWorkflow` has completed.
