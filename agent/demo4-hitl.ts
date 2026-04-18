/**
 * demo4-hitl.ts — Human in the loop.
 *
 * The agent can pause mid-execution to ask the user a question.
 * While waiting, the workflow is suspended — no threads spinning,
 * no polling, zero resource consumption.
 *
 * Three Temporal primitives make this work:
 *   1. condition()      — durably suspends the workflow
 *   2. defineSignal     — delivers the user's response
 *   3. defineQuery      — lets the starter poll for pending questions
 *
 * The starter polls every 2 seconds, prints the question when one appears,
 * reads input from stdin, and sends it as a signal.
 *
 * Adding ask_user to demo3's clean dispatch took exactly one entry in
 * the toolHandlers map — the HITL suspend/resume logic is right there
 * alongside the other handlers.
 */

import {
  proxyActivities,
  condition,
  defineSignal,
  defineQuery,
  setHandler,
} from "@temporalio/workflow";
import type * as acts from "./activities";
import type Anthropic from "@anthropic-ai/sdk";

const TOOLS_HITL: Anthropic.Tool[] = [
  {
    name: "get_weather_alerts",
    description:
      "Get active weather alerts for a US state from the National Weather Service. " +
      "Use the two-letter state code, e.g. CA, TX, NY.",
    input_schema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter US state code" },
      },
      required: ["state"],
    },
  },
  {
    name: "get_coordinates",
    description: "Get the latitude and longitude for a location name or address.",
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string", description: "Location name or city" },
      },
      required: ["location"],
    },
  },
  {
    name: "get_distance_km",
    description:
      "Calculate the straight-line distance in km between two lat/lon coordinates.",
    input_schema: {
      type: "object",
      properties: {
        lat1: { type: "number" },
        lon1: { type: "number" },
        lat2: { type: "number" },
        lon2: { type: "number" },
      },
      required: ["lat1", "lon1", "lat2", "lon2"],
    },
  },
  {
    name: "ask_user",
    description:
      "Ask the user a clarifying question when the request is ambiguous " +
      "or you need more information to complete the task. " +
      "Use this when you genuinely need input — not as a default.",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question to ask the user" },
      },
      required: ["question"],
    },
  },
];

export const provideUserInputSignal = defineSignal<[string]>("provide_user_input");
export const getPendingQuestionQuery = defineQuery<string | null>("get_pending_question");
export const isInputNeededQuery = defineQuery<boolean>("is_input_needed");

export async function weatherAgentHITLWorkflow(query: string): Promise<string> {
  let pendingQuestion: string | null = null;
  let userInput: string | null = null;

  setHandler(provideUserInputSignal, (input: string) => {
    userInput = input;
    pendingQuestion = null;
  });

  setHandler(getPendingQuestionQuery, () => pendingQuestion);
  setHandler(isInputNeededQuery, () => pendingQuestion !== null);

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
      messages as Parameters<typeof acts.callLLM>[0],
      TOOLS_HITL
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
