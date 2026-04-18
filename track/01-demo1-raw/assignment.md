---
slug: demo1-raw
id: tsbkqc6n9o5p
type: challenge
title: 'Demo 1: The Raw Agentic Loop'
teaser: A plain TypeScript while loop calling Claude with tools. Kill it mid-run and
  watch everything disappear.
notes:
- type: text
  contents: |-
    The simplest possible agentic loop: call Claude, execute the tools it asks for, feed the results back, repeat until Claude says it's done.

    No Temporal. No durability. No retries. No visibility.

    Kill it mid-run and you lose everything — Claude's reasoning, the tool results, the intermediate state. It starts over from zero.

    This is the problem the rest of the demos solve.
- type: text
  contents: |-
    **Before you start:** make sure your Anthropic API key is set in Terminal 1.

    ```
    export ANTHROPIC_API_KEY=sk-ant-...
    ```

    You can arrow-up to re-run this command in any later demo.

    **Note:** This workshop uses the Anthropic API directly — Claude.ai and Claude Desktop subscription credits are a separate billing system and won't work here. You need API credits from platform.anthropic.com.
tabs:
- id: p0jonglwr2ak
  title: Terminal 1
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/agent
- id: sn8rx2vzfifp
  title: Terminal 2
  type: terminal
  hostname: workshop-host
  workdir: /workspace/workshop/agent
- id: iqinqi0zjxk7
  title: VS Code
  type: service
  hostname: workshop-host
  path: ?folder=/workspace/workshop/agent&openFile=/workspace/workshop/agent/demo1-raw.ts
  port: 8443
- id: zkf7a2stx1xi
  title: Network Control Panel
  type: service
  hostname: workshop-host
  path: /
  port: 5000
difficulty: basic
timelimit: 1200
enhanced_loading: null
---

## Demo 1: The raw agentic loop

Open `demo1-raw.ts` in VS Code. Read through it — it's a plain `while (true)` loop. No imports from `@temporalio`. Just the Anthropic SDK, `fetch`, and a `runTool` dispatcher.

### Run it

In **Terminal 1**:

```bash
npx ts-node demo1-raw.ts "What are the weather alerts in California?"
```

Watch the output. You'll see each Claude iteration and each tool call logged as it happens.

### Kill it mid-run

While it's running, press `Ctrl+C`. Then run it again immediately:

```bash
npx ts-node demo1-raw.ts "What are the weather alerts in Texas, and how far is Dallas from Houston?"
```

Kill it again — this time after it has already called a tool but before it returns an answer. It starts completely over. Every iteration, every tool call, every intermediate result: gone.

### Disrupt the network

In **Terminal 1**, start a longer query:

```bash
npx ts-node demo1-raw.ts "What are the weather alerts in California, Texas, Florida, New York, and Washington?"
```

While it's running, switch to the **Network Control Panel** and toggle **NWS Weather Alerts** off. The demo crashes or hangs — there's no retry logic.

Toggle it back on and notice: the loop has to start over from the beginning.

Click **Check** when you've seen it fail.
