/**
 * workflow.ts — SOLUTION
 *
 * The if/else dispatch replaced with a toolHandlers registry map.
 * Temporal behavior is identical to Exercise 2 — the change is structural only.
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

type ToolHandler = (input: Record<string, unknown>) => Promise<string>;

const toolHandlers: Record<string, ToolHandler> = {
  get_weather_alerts: async (input) =>
    getWeatherAlerts(input.state as string),

  get_coordinates: async (input) => {
    const coords = await getCoordinates(input.location as string);
    return JSON.stringify(coords);
  },

  get_distance_km: async (input) => {
    const dist = await getDistanceKm(
      input.lat1 as number,
      input.lon1 as number,
      input.lat2 as number,
      input.lon2 as number
    );
    return JSON.stringify(dist);
  },
};

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
        const handler = toolHandlers[toolName];
        const result = handler
          ? await handler(toolInput as Record<string, unknown>)
          : `Unknown tool: ${toolName}`;
        toolResults.push({ type: "tool_result", tool_use_id: toolUseId, content: result });
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}
