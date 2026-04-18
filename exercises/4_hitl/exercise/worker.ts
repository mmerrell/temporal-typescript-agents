/**
 * worker.ts — pre-wired, no changes needed.
 */

import { Worker, NativeConnection } from "@temporalio/worker";
import * as activities from "./activities";

async function main() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233",
  });
  const worker = await Worker.create({
    connection,
    taskQueue: "agent-task-queue",
    workflowsPath: require.resolve("./workflow"),
    activities,
  });
  console.log("Worker started on task queue: agent-task-queue");
  await worker.run();
}

main().catch((err) => { console.error(err); process.exit(1); });
