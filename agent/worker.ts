/**
 * worker.ts
 *
 * Registers all workflows and activities. Run this before running any starter.
 *
 *   npx ts-node worker.ts
 *
 * The worker connects to Temporal at TEMPORAL_ADDRESS (default 127.0.0.1:7233).
 */

import { Worker, bundleWorkflowCode } from "@temporalio/worker";
import * as activities from "./activities";
import path from "path";

async function main() {
  const temporalAddress = process.env.TEMPORAL_ADDRESS ?? "127.0.0.1:7233";
  const agentDir = path.resolve(__dirname);

  // Bundle workflow code explicitly so webpack resolves node_modules from
  // the agent/ directory rather than the repo root.
  const workflowBundle = await bundleWorkflowCode({
    workflowsPath: agentDir,
    // Explicitly tell the bundler where node_modules lives.
    // Without this, webpack walks up from the repo root and misses agent/node_modules.
    webpackConfigHook: (config) => {
      config.resolve = config.resolve ?? {};
      config.resolve.modules = [
        path.join(agentDir, "node_modules"),
        "node_modules",
      ];
      return config;
    },
  });

  const worker = await Worker.create({
    connection: { address: temporalAddress },
    taskQueue: "agent-task-queue",
    workflowBundle,
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
