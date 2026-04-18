/**
 * workflow.ts — SOLUTION
 *
 * Clean dispatch workflow with full HITL support.
 * The ask_user handler is the only addition from Exercise 3.
 */

import {
  proxyActivities,
  condition,
  defineSignal,
  defineQuery,
  setHandler,
} from "@temporalio/workflow";
import type * as acts from "./activities";

const { getWeatherAlerts, getCoordinates, getDistanceKm } =
  proxyActivities<typeof acts>({
    startToCloseTimeout: "30 seconds",
  });

const { callLLM } = proxyActivities<typeof acts>({
  startToCloseTimeout: "60 seconds",
});

export const provideUserInputSignal = defineSignal<[string]>("provide_user_input");
export const getPendingQuestionQuery = defineQuery<string | null>("get_pending_question");

export async function weatherAgentHITLWorkflow(query: string): Promise<string> {
  let pendingQuestion: string | null = null;
  let userInput: string | null = null;

  setHandler(provideUserInputSignal, (input: string) => {
    userInput = input;
    pendingQuestion = null;
  });

  setHandler(getPendingQuestionQuery, () => pendingQuestion);

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

    // The entire HITL mechanism is here — one entry in the map.
    // condition() durably suspends the workflow until the signal arrives.
    ask_user: async (input) => {
      pendingQuestion = input.question as string;
      userInput = null;
      await condition(() => userInput !== null);
      const answer = userInput!;
      userInput = null;
      return answer;
    },
  };

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
