/**
 * workflow.ts
 *
 * TODO: Replace the if/else tool dispatch with a toolHandlers registry map.
 *
 * The workflow structure, activity proxies, and loop are already complete.
 * Your only job is to refactor the dispatch block.
 *
 * Steps:
 *   1. Define a type: type ToolHandler = (input: Record<string, unknown>) => Promise<string>
 *   2. Create a toolHandlers map: Record<string, ToolHandler>
 *      with one entry per tool — each entry calls the corresponding activity
 *      and returns a string result
 *   3. Replace the if/else block with:
 *        const handler = toolHandlers[toolName];
 *        const result = handler
 *          ? await handler(toolInput as Record<string, unknown>)
 *          : `Unknown tool: ${toolName}`;
 *
 * When you're done, the Temporal behavior is identical to Exercise 2 —
 * same activities, same event history. Open both workflow files side by side
 * and compare. The loop structure hasn't changed. Only the dispatch has.
 *
 * Think about what adding a new tool would look like in each version.
 */

import { proxyActivities } from "@temporalio/workflow";
import type * as acts from "./activities";

const { getWeatherAlerts, getCoordinates, getDistanceKm } =
  proxyActivities<typeof acts>({
    startToCloseTimeout: "30 seconds",
  });

const { callLLM } = proxyActivities<typeof acts>({
  startToCloseTimeout: "60 seconds",
});

export async function weatherAgentCleanWorkflow(query: string): Promise<string> {
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

        // TODO: Replace this if/else block with a toolHandlers map lookup
        if (toolName === "get_weather_alerts") {
          result = await getWeatherAlerts(inp.state as string);
        } else if (toolName === "get_coordinates") {
          const coords = await getCoordinates(inp.location as string);
          result = JSON.stringify(coords);
        } else if (toolName === "get_distance_km") {
          const dist = await getDistanceKm(
            inp.lat1 as number,
            inp.lon1 as number,
            inp.lat2 as number,
            inp.lon2 as number
          );
          result = JSON.stringify(dist);
        } else {
          result = `Unknown tool: ${toolName}`;
        }

        toolResults.push({ type: "tool_result", tool_use_id: toolUseId, content: result });
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}
