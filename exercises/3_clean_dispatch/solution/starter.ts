/**
 * starter.ts — SOLUTION (identical to exercise/starter.ts)
 */

import { Client, Connection } from "@temporalio/client";
import { weatherAgentCleanWorkflow } from "./workflow";

async function main() {
  const query =
    process.argv.length > 2
      ? process.argv.slice(2).join(" ")
      : "What are the weather alerts in California, and how far is LA from San Francisco?";

  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233",
  });

  const client = new Client({ connection });

  const workflowId = `weather-agent-ex3-${Date.now()}`;
  console.log(`Starting workflow: ${workflowId}`);
  console.log(`Query: ${query}\n`);

  const handle = await client.workflow.start(weatherAgentCleanWorkflow, {
    taskQueue: "agent-task-queue",
    workflowId,
    args: [query],
  });

  console.log(`Workflow running. Watch it at http://localhost:8080`);
  const result = await handle.result();
  console.log(`\n=== Result ===\n${result}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
