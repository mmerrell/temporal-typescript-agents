/**
 * workflow.ts
 *
 * TODO: Add human-in-the-loop support to the clean dispatch workflow.
 *
 * The activity proxies, toolHandlers map, and loop are already complete.
 * Your job is to add the three Temporal HITL primitives and the ask_user handler.
 *
 * Step 1 — Signals and queries
 *   Import defineSignal, defineQuery, setHandler, and condition from "@temporalio/workflow".
 *   Then define:
 *     export const provideUserInputSignal = defineSignal<[string]>("provide_user_input");
 *     export const getPendingQuestionQuery = defineQuery<string | null>("get_pending_question");
 *
 * Step 2 — Workflow state
 *   Inside weatherAgentHITLWorkflow, declare two mutable variables:
 *     let pendingQuestion: string | null = null;
 *     let userInput: string | null = null;
 *
 * Step 3 — Register the signal handler
 *   Call setHandler(provideUserInputSignal, (input: string) => {
 *     userInput = input;
 *     pendingQuestion = null;
 *   });
 *
 * Step 4 — Register the query handler
 *   Call setHandler(getPendingQuestionQuery, () => pendingQuestion);
 *
 * Step 5 — Add ask_user to the toolHandlers map
 *   ask_user: async (input) => {
 *     pendingQuestion = input.question as string;
 *     userInput = null;
 *     await condition(() => userInput !== null);  // durably suspend here
 *     const answer = userInput!;
 *     userInput = null;
 *     return answer;
 *   },
 *
 * When you're done, open the Temporal Web UI while the workflow is suspended
 * waiting for input. Notice: the workflow shows as Running but no activity
 * is executing. That's durable suspension — no threads, no polling, zero
 * resource consumption. The workflow will sit here across any number of
 * worker restarts until you send the signal.
 */

import { proxyActivities } from "@temporalio/workflow";
import type * as acts from "./activities";

// TODO: also import defineSignal, defineQuery, setHandler, condition

const { getWeatherAlerts, getCoordinates, getDistanceKm } =
  proxyActivities<typeof acts>({
    startToCloseTimeout: "30 seconds",
  });

const { callLLM } = proxyActivities<typeof acts>({
  startToCloseTimeout: "60 seconds",
});

// TODO: export provideUserInputSignal = defineSignal<[string]>(...)
// TODO: export getPendingQuestionQuery = defineQuery<string | null>(...)

export async function weatherAgentHITLWorkflow(query: string): Promise<string> {
  // TODO: declare pendingQuestion and userInput state variables
  // TODO: register signal handler
  // TODO: register query handler

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

    // TODO: add ask_user handler here
    // ask_user: async (input) => { ... }
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
