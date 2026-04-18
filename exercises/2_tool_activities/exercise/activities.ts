/**
 * activities.ts
 *
 * In Exercise 2, you extract the tool calls out of the workflow and into
 * proper Temporal activities alongside callLLM.
 *
 * callLLM is already complete — it's the solution from Exercise 1.
 *
 * TODO: Implement the three tool activities below.
 *
 * For each one:
 *   1. Use Context.current().log.info(...) to log what you're doing
 *   2. Make the HTTP call using nodeFetch with nativeFetchOpts()
 *      so the workshop proxy can intercept it
 *   3. Parse the response and return the right type
 *   4. Throw an Error with a descriptive message if the response is not ok
 *      or if no results are found
 *
 * Why does this matter?
 *   When tool calls run inside the workflow directly, Temporal can't see them —
 *   they don't appear in the event history, they don't get retried on failure,
 *   and they have no timeout protection. Moving them to activities fixes all three.
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

// ── callLLM — complete, do not modify ─────────────────────────────────────────

export async function callLLM(
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[] = TOOLS
): Promise<{ content: Anthropic.ContentBlock[]; stopReason: string }> {
  Context.current().log.info(`Calling Claude with ${messages.length} messages`);

  const client = new Anthropic({
    fetch: proxiedFetch,
    maxRetries: 0,
  });

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages,
    tools,
  });

  return {
    content: response.content,
    stopReason: response.stop_reason ?? "end_turn",
  };
}

// ── TODO: Implement tool activities ──────────────────────────────────────────

/**
 * Fetch active weather alerts for a US state from the National Weather Service.
 * Endpoint: https://api.weather.gov/alerts/active?area=<STATE>
 * Returns up to 5 alert summaries as a newline-joined string.
 * If no alerts, return "No active weather alerts for <state>."
 */
export async function getWeatherAlerts(state: string): Promise<string> {
  // YOUR CODE HERE
  throw new Error("Not implemented");
}

/**
 * Get latitude/longitude for a location using the Nominatim geocoding API.
 * Endpoint: https://nominatim.openstreetmap.org/search
 * Query params: q=<location>, format=json, limit=1
 * User-Agent header required: "temporal-typescript-agents"
 * Returns: { lat, lon, displayName }
 */
export async function getCoordinates(
  location: string
): Promise<{ lat: number; lon: number; displayName: string }> {
  // YOUR CODE HERE
  throw new Error("Not implemented");
}

/**
 * Calculate straight-line (haversine) distance between two lat/lon points.
 * No external API — pure computation.
 * Returns: { distanceKm, distanceMiles }
 */
export async function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<{ distanceKm: number; distanceMiles: number }> {
  // YOUR CODE HERE
  throw new Error("Not implemented");
}
