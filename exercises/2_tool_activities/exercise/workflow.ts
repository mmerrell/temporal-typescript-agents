/**
 * workflow.ts
 *
 * TODO: Wire up the tool activities you implemented in activities.ts.
 *
 * The workflow structure and callLLM proxy are already complete.
 * Your job is to:
 *
 *   1. Add getWeatherAlerts, getCoordinates, and getDistanceKm to the
 *      proxyActivities call (use a startToCloseTimeout of "30 seconds")
 *   2. Replace the three inline tool function calls in the if/else block
 *      with calls to the proxied activity versions
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
//   startToCloseTimeout: "...",
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

        // TODO: Replace these inline calls with proxied activity calls
        if (toolName === "get_weather_alerts") {
          // replace with: result = await getWeatherAlerts(inp.state as string);
          throw new Error("get_weather_alerts not wired up yet");
        } else if (toolName === "get_coordinates") {
          // replace with: const coords = await getCoordinates(inp.location as string);
          //               result = JSON.stringify(coords);
          throw new Error("get_coordinates not wired up yet");
        } else if (toolName === "get_distance_km") {
          // replace with: const dist = await getDistanceKm(...);
          //               result = JSON.stringify(dist);
          throw new Error("get_distance_km not wired up yet");
        } else {
          result = `Unknown tool: ${toolName}`;
        }

        toolResults.push({ type: "tool_result", tool_use_id: toolUseId, content: result });
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}
