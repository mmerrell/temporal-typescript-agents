/**
 * worker.ts
 *
 * Registers all workflows and activities. Run this before running any starter.
 *
 *   npx ts-node worker.ts
 *
 * The worker connects to Temporal at TEMPORAL_ADDRESS (default 127.0.0.1:7233).
 */

import { Worker } from "@temporalio/worker";
import * as activities from "./activities";
import path from "path";

async function main() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233";

  const worker = await Worker.create({
    connection: { address: temporalAddress },
    taskQueue: "agent-task-queue",
    // The bundler looks for index.ts in this directory as the entry point.
    workflowsPath: path.resolve(__dirname),
    activities,
  });

  console.log(`Worker started on task queue: agent-task-queue`);
  console.log(`Temporal address: ${temporalAddress}`);
  await worker.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
