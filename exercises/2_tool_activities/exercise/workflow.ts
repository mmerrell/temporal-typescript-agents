/**
 * workflow.ts
 *
 * TODO: Wire up the tool activities you implemented in activities.ts.
 *
 * The workflow structure and callLLM proxy are already complete.
 * Your job is to:
 *
 *   1. Add getWeatherAlerts, getCoordinates, and getDistanceKm to a
 *      proxyActivities call with startToCloseTimeout: "30 seconds"
 *   2. Replace the three direct function call placeholders in the if/else
 *      block with calls to the proxied activity versions
 *
 * Once done, run the worker and starter. Open the Temporal Web UI and
 * compare the event history to Exercise 1 — you should now see separate
 * ActivityTaskScheduled events for each tool call, not just for callLLM.
 */

import { proxyActivities } from "@temporalio/workflow";
import type * as acts from "./activities";

// callLLM proxy — complete, do not modify
const { callLLM } = proxyActivities<typeof acts>({
  startToCloseTimeout: "60 seconds",
});

// TODO: Add tool activity proxies here
// const { getWeatherAlerts, getCoordinates, getDistanceKm } = proxyActivities<typeof acts>({
//   startToCloseTimeout: "30 seconds",
// });

export async function weatherAgentWorkflow(query: string): Promise<string> {
  const messages: Array<{ role: string; content: unknown }> = [
    { role: "user", content: query },
  ];

  while (true) {
    const { content, stopReason } = await callLLM(
      messages as Parameters<typeof acts.callLLM>[0]
    );

    messages.push({ role: "assistant", content });

    if (stopReason === "end_turn") {
      for (const block of content) {
        if (block.type === "text") return block.text;
      }
      return "No response.";
    }

    if (stopReason === "tool_use") {
      const toolResults: Array<{
        type: "tool_result";
        tool_use_id: string;
        content: string;
      }> = [];

      for (const block of content) {
        if (block.type !== "tool_use") continue;

        const { id: toolUseId, name: toolName, input: toolInput } = block;
        const inp = toolInput as Record<string, unknown>;
        let result: string;

        // TODO: Replace these with calls to the proxied activities
        // Hint: getWeatherAlerts, getCoordinates, getDistanceKm are defined
        // in activities.ts — proxy them above and call them here.
        if (toolName === "get_weather_alerts") {
          result = `TODO: call getWeatherAlerts(${inp.state})`;
        } else if (toolName === "get_coordinates") {
          result = `TODO: call getCoordinates(${inp.location})`;
        } else if (toolName === "get_distance_km") {
          result = `TODO: call getDistanceKm(...)`;
        } else {
          result = `Unknown tool: ${toolName}`;
        }

        toolResults.push({ type: "tool_result", tool_use_id: toolUseId, content: result });
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}
