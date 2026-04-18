/**
 * activities.ts
 *
 * All Temporal activities. Each activity is a unit of I/O: an LLM call
 * or an external API call.
 *
 * Activities have no knowledge of the agentic loop — that's intentional.
 * The workflow owns the loop; activities own the side effects.
 *
 * The Anthropic SDK uses node-fetch with its own KeepAliveAgent which
 * overrides any agent passed via fetchOptions. We pass a custom fetch
 * function instead, injecting https-proxy-agent directly.
 *
 * Native fetch (undici) also does not support the agent option in RequestInit,
 * so all outbound HTTP calls use node-fetch explicitly to ensure the proxy
 * agent is respected for workshop traffic toggling.
 *
 * The Anthropic SDK's internal retries are disabled (maxRetries: 0) so that
 * Temporal owns all retry logic.
 */

import { Context } from "@temporalio/activity";
import Anthropic from "@anthropic-ai/sdk";
import nodeFetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { TOOLS } from "./tools";

const SYSTEM_PROMPT =
  "You are a helpful assistant that answers questions about weather alerts " +
  "and distances between locations. Use your tools to look up real data. " +
  "When you have enough information to fully answer, provide a clear plain-text response.";

const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

// Shared node-fetch options — injects the proxy agent when available.
// Native fetch (undici) ignores the agent option, so we use node-fetch
// for all outbound HTTP calls.
function nativeFetchOpts() {
  return proxyAgent ? { agent: proxyAgent } : {};
}

// Custom fetch for the Anthropic SDK — bypasses the SDK's own KeepAliveAgent.
const proxiedFetch: Anthropic.Fetch = (url, init) =>
  nodeFetch(
    url as string,
    { ...init, ...nativeFetchOpts() } as Parameters<typeof nodeFetch>[1]
  );

// ── LLM activity ──────────────────────────────────────────────────────────────

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

// ── Tool activities ───────────────────────────────────────────────────────────

export async function getWeatherAlerts(state: string): Promise<string> {
  Context.current().log.info(`Fetching weather alerts for: ${state}`);

  const url = `https://api.weather.gov/alerts/active?area=${state.toUpperCase()}`;
  const resp = await nodeFetch(url, {
    ...nativeFetchOpts(),
    headers: { "User-Agent": "temporal-typescript-agents" },
  } as Parameters<typeof nodeFetch>[1]);

  if (!resp.ok) {
    throw new Error(`NWS API error: ${resp.status} ${resp.statusText}`);
  }
  const data = (await resp.json()) as {
    features: Array<{ properties: { event?: string; headline?: string } }>;
  };
  const alerts = data.features ?? [];
  if (alerts.length === 0) {
    return `No active weather alerts for ${state}.`;
  }
  return alerts
    .slice(0, 5)
    .map(
      (a) =>
        `- ${a.properties.event ?? "Alert"}: ${a.properties.headline ?? "No details"}`
    )
    .join("\n");
}

export async function getCoordinates(
  location: string
): Promise<{ lat: number; lon: number; displayName: string }> {
  Context.current().log.info(`Getting coordinates for: ${location}`);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", location);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const resp = await nodeFetch(url.toString(), {
    ...nativeFetchOpts(),
    headers: { "User-Agent": "temporal-typescript-agents" },
  } as Parameters<typeof nodeFetch>[1]);

  if (!resp.ok) {
    throw new Error(`Nominatim error: ${resp.status} ${resp.statusText}`);
  }
  const results = (await resp.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;
  if (results.length === 0) {
    throw new Error(`Could not find coordinates for: ${location}`);
  }
  return {
    lat: parseFloat(results[0].lat),
    lon: parseFloat(results[0].lon),
    displayName: results[0].display_name,
  };
}

export async function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<{ distanceKm: number; distanceMiles: number }> {
  Context.current().log.info(`Calculating distance (${lat1},${lon1}) -> (${lat2},${lon2})`);

  const R = 6371.0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const distance = 2 * R * Math.asin(Math.sqrt(a));
  return {
    distanceKm: Math.round(distance * 100) / 100,
    distanceMiles: Math.round(distance * 0.621371 * 100) / 100,
  };
}
