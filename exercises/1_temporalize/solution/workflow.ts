/**
 * workflow.ts — SOLUTION
 *
 * The agentic loop as a Temporal workflow.
 * All activities proxied — no I/O in the workflow file.
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

        if (toolName === "get_weather_alerts") {
          result = await getWeatherAlerts(inp.state as string);
        } else if (toolName === "get_coordinates") {
          result = JSON.stringify(await getCoordinates(inp.location as string));
        } else if (toolName === "get_distance_km") {
          result = JSON.stringify(
            await getDistanceKm(inp.lat1 as number, inp.lon1 as number, inp.lat2 as number, inp.lon2 as number)
          );
        } else {
          result = `Unknown tool: ${toolName}`;
        }

        toolResults.push({ type: "tool_result", tool_use_id: toolUseId, content: result });
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}
