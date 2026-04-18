/**
 * starter.ts — pre-wired, no changes needed.
 * Run with: npx ts-node exercise/starter.ts
 */

import { Client, Connection } from "@temporalio/client";
import { weatherAgentWorkflow } from "./workflow";

async function main() {
  const query =
    process.argv.length > 2
      ? process.argv.slice(2).join(" ")
      : "What are the active weather alerts in California?";

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233",
  });

  const client = new Client({ connection });

  const workflowId = `weather-agent-ex1-${Date.now()}`;
  console.log(`Starting workflow: ${workflowId}`);
  console.log(`Query: ${query}\n`);

  const handle = await client.workflow.start(weatherAgentWorkflow, {
    taskQueue: "agent-task-queue",
    workflowId,
    args: [query],
  });

  console.log(`Workflow running. Watch it at http://localhost:8080`);
  const result = await handle.result();
  console.log(`\n=== Result ===\n${result}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
