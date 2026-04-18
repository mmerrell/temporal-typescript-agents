/**
 * starter4.ts — Start a Demo 4 HITL workflow and handle user input.
 *
 *   npx ts-node starter4.ts "Should I worry about weather near me?"
 *
 * The starter polls every 2 seconds for a pending question from the workflow.
 * When one appears, it prints it and reads your answer from stdin.
 * Your answer is sent as a signal, and the workflow resumes.
 */

import { Client, Connection, WorkflowExecutionAlreadyStartedError } from "@temporalio/client";
import * as readline from "readline";
import {
  weatherAgentHITLWorkflow,
  provideUserInputSignal,
  getPendingQuestionQuery,
} from "./demo4-hitl";

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
      : "Should I worry about weather near me?";

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233",
  });

  const client = new Client({ connection });

  const workflowId = `weather-agent-hitl-${Date.now()}`;
  console.log(`Starting HITL workflow: ${workflowId}`);
  console.log(`Query: ${query}\n`);
  console.log(`Workflow running. Watch it at http://localhost:8080`);
  console.log(`Waiting for the agent to ask a question...\n`);

  const handle = await client.workflow.start(weatherAgentHITLWorkflow, {
    taskQueue: "agent-task-queue",
    workflowId,
    args: [query],
  });

  // Track workflow completion separately from the poll loop.
  // We don't want a rejected promise to short-circuit the poll.
  let workflowDone = false;
  let workflowResult: string | undefined;
  let workflowError: unknown;

  handle.result()
    .then((r) => { workflowResult = r; workflowDone = true; })
    .catch((e) => { workflowError = e; workflowDone = true; });

  // Poll until the workflow finishes. On each tick, check for a pending
  // question and prompt the user if one is found.
  while (!workflowDone) {
    await new Promise((r) => setTimeout(r, 1500));

    if (workflowDone) break;

    let question: string | null = null;
    try {
      question = await handle.query(getPendingQuestionQuery);
    } catch {
      // Query may fail transiently (e.g. workflow not yet started) — keep polling.
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

  if (workflowError) {
    throw workflowError;
  }

  console.log(`\n=== Result ===\n${workflowResult}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
