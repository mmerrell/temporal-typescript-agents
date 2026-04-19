/**
 * workflow.ts
 *
 * TODO: Convert the raw agentic loop into a Temporal workflow.
 *
 * All four activities are already implemented in activities.ts — you don't
 * need to touch that file. Your job is entirely here in workflow.ts.
 *
 * Steps:
 *   1. Import proxyActivities from "@temporalio/workflow"
 *   2. Import type * as acts from "./activities"
 *   3. Create a proxy for callLLM with startToCloseTimeout: "60 seconds"
 *   4. Create a proxy for getWeatherAlerts, getCoordinates, getDistanceKm
 *      with startToCloseTimeout: "30 seconds"
 *   5. Export async function weatherAgentWorkflow(query: string): Promise<string>
 *      that runs the agentic loop — calling activities via the proxies,
 *      never calling them directly
 *
 * The loop structure is identical to demo1-raw.ts. The only difference is
 * that every function call goes through proxyActivities instead of running
 * inline. This is what makes the workflow durable — Temporal records each
 * activity call in the event history and can replay from any point.
 */

import { proxyActivities } from "@temporalio/workflow";
import type * as acts from "./activities";

// TODO: Create proxy for callLLM
// const { callLLM } = proxyActivities<typeof acts>({ startToCloseTimeout: "60 seconds" });

// TODO: Create proxy for tool activities
// const { getWeatherAlerts, getCoordinates, getDistanceKm } = proxyActivities<typeof acts>({
//   startToCloseTimeout: "30 seconds",
// });

// TODO: Export weatherAgentWorkflow
// export async function weatherAgentWorkflow(query: string): Promise<string> {
//   const messages = [{ role: "user", content: query }];
//   while (true) {
//     const { content, stopReason } = await callLLM(messages as Parameters<typeof acts.callLLM>[0]);
//     messages.push({ role: "assistant", content });
//     if (stopReason === "end_turn") {
//       for (const block of content) {
//         if (block.type === "text") return block.text;
//       }
//       return "No response.";
//     }
//     if (stopReason === "tool_use") {
//       const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];
//       for (const block of content) {
//         if (block.type !== "tool_use") continue;
//         const { id: toolUseId, name: toolName, input: toolInput } = block;
//         const inp = toolInput as Record<string, unknown>;
//         let result: string;
//         if (toolName === "get_weather_alerts") {
//           result = await getWeatherAlerts(inp.state as string);
//         } else if (toolName === "get_coordinates") {
//           result = JSON.stringify(await getCoordinates(inp.location as string));
//         } else if (toolName === "get_distance_km") {
//           result = JSON.stringify(await getDistanceKm(inp.lat1 as number, inp.lon1 as number, inp.lat2 as number, inp.lon2 as number));
//         } else {
//           result = `Unknown tool: ${toolName}`;
//         }
//         toolResults.push({ type: "tool_result", tool_use_id: toolUseId, content: result });
//       }
//       messages.push({ role: "user", content: toolResults });
//     }
//   }
// }
