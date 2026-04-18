/**
 * demo2-workflow.ts — The agentic loop as a Temporal workflow.
 *
 * Same logic as demo1-raw.ts. The difference: the loop runs inside a
 * Temporal workflow. Every LLM call and tool execution is a Temporal activity.
 *
 * What you get for free:
 * - Kill the worker mid-loop and restart — the workflow resumes from history
 * - A tool call fails — Temporal retries it automatically
 * - Full visibility — every step is recorded in the Temporal UI event history
 *
 * The workflow is deliberately explicit: a while loop you can read top to bottom,
 * with a clear if/else for each tool. Demo 3 shows a cleaner dispatch pattern.
 */

import { proxyActivities } from "@temporalio/workflow";
import type * as acts from "./activities";

// Tool activities — retryable with default retry policy, 30s timeout each.
const { getWeatherAlerts, getCoordinates, getDistanceKm } =
  proxyActivities<typeof acts>({
    startToCloseTimeout: "30 seconds",
  });

// LLM activity — also retryable. A 503 or network error means the activity
// failed before writing anything to history, so retrying is safe. Only a
// *successful* LLM response should never be replayed — and Temporal only
// retries failed activities, not completed ones.
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
