/**
 * activities.ts
 *
 * In Exercise 1, the only activity is callLLM — the LLM call is the
 * non-deterministic side effect that must live outside the workflow.
 *
 * Tool calls (getWeatherAlerts, getCoordinates, getDistanceKm) still run
 * inline inside the workflow for now. Exercise 2 extracts them as activities.
 *
 * TODO: Implement callLLM as a Temporal activity.
 *
 * Steps:
 *   1. Import Context from "@temporalio/activity"
 *   2. Import Anthropic from "@anthropic-ai/sdk"
 *   3. Import TOOLS from "../tools"
 *   4. Import nodeFetch and HttpsProxyAgent, set up proxiedFetch
 *      (copy the proxy setup from demo1-raw.ts — it's already written)
 *   5. Export an async function callLLM(messages, tools) that:
 *      - Creates an Anthropic client with fetch: proxiedFetch, maxRetries: 0
 *      - Calls client.messages.create(...)
 *      - Returns { content, stopReason }
 *
 * The worker and starter are already wired up — once callLLM compiles and
 * the workflow is correct, run the worker and starter to see it execute.
 */

import { Context } from "@temporalio/activity";
import Anthropic from "@anthropic-ai/sdk";
import nodeFetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { TOOLS } from "../tools";

const SYSTEM_PROMPT =
  "You are a helpful assistant that answers questions about weather alerts " +
  "and distances between locations. Use your tools to look up real data. " +
  "When you have enough information to fully answer, provide a clear plain-text response.";

// TODO: Set up the proxy agent (copy from demo1-raw.ts)
const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

function nativeFetchOpts() {
  return proxyAgent ? { agent: proxyAgent } : {};
}

const proxiedFetch: Anthropic.Fetch = (url, init) =>
  nodeFetch(
    url as string,
    { ...init, ...nativeFetchOpts() } as Parameters<typeof nodeFetch>[1]
  );

// TODO: Implement callLLM as a Temporal activity.
// It should call Claude with the given messages and tools, and return
// { content, stopReason }.
//
// Use Context.current().log.info(...) to log the number of messages.
export async function callLLM(
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[] = TOOLS
): Promise<{ content: Anthropic.ContentBlock[]; stopReason: string }> {
  // YOUR CODE HERE
  throw new Error("Not implemented");
}
