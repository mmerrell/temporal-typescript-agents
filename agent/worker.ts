/**
 * worker.ts
 *
 * Registers all workflows and activities. Run this before running any starter.
 *
 *   npx ts-node worker.ts
 *
 * The worker connects to Temporal at TEMPORAL_ADDRESS (default 127.0.0.1:7233).
 */

import { Worker, NativeConnection } from "@temporalio/worker";
import * as activities from "./activities";

async function main() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233";

  const connection = await NativeConnection.connect({ address: temporalAddress });

  const worker = await Worker.create({
    connection,
    taskQueue: "agent-task-queue",
    workflowsPath: require.resolve("./index"),
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
