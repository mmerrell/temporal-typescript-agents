/**
 * starter.ts — SOLUTION (identical to exercise/starter.ts)
 */

import { Client, Connection } from "@temporalio/client";
import * as readline from "readline";
import { weatherAgentHITLWorkflow, getPendingQuestionQuery, provideUserInputSignal } from "./workflow";

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n[Agent asks]: ${question}\nYour answer: `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const query =
    process.argv.length > 2
      ? process.argv.slice(2).join(" ")
      : "What are the active weather alerts in my area?";

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233",
  });

  const client = new Client({ connection });

  const workflowId = `weather-agent-ex4-${Date.now()}`;
  console.log(`Starting HITL workflow: ${workflowId}`);
  console.log(`Query: ${query}\n`);
  console.log(`Waiting for the agent to ask a question...`);
  console.log(`Watch the workflow at http://localhost:8080\n`);

  const handle = await client.workflow.start(weatherAgentHITLWorkflow, {
    taskQueue: "agent-task-queue",
    workflowId,
    args: [query],
  });

  let workflowDone = false;
  let workflowResult: string | undefined;
  let workflowError: unknown;

  handle.result()
    .then((r) => { workflowResult = r; workflowDone = true; })
    .catch((e) => { workflowError = e; workflowDone = true; });

  while (!workflowDone) {
    await new Promise((r) => setTimeout(r, 1500));
    if (workflowDone) break;

    let question: string | null = null;
    try {
      question = await handle.query(getPendingQuestionQuery);
    } catch {
      continue;
    }

    if (question) {
      const answer = await promptUser(question);
      try {
        await handle.signal(provideUserInputSignal, answer);
      } catch (e) {
        console.error("Failed to send signal:", e);
      }
    }
  }

  if (workflowError) throw workflowError;
  console.log(`\n=== Result ===\n${workflowResult}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
