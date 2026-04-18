/**
 * workflow.ts
 *
 * TODO: Convert the raw agentic loop into a Temporal workflow.
 *
 * The inline tool implementations below are already complete — don't touch them.
 * Your job is to write the workflow function that wraps the agentic loop.
 *
 * Steps:
 *   1. Import proxyActivities from "@temporalio/workflow"
 *   2. Import type * as acts from "./activities"
 *   3. Create TWO activity proxies:
 *      - callLLM with startToCloseTimeout: "60 seconds"
 *      - (tool activities come in Exercise 2 — keep tool calls inline for now)
 *   4. Export an async function weatherAgentWorkflow(query: string): Promise<string>
 *      that runs the agentic loop using callLLM as an activity, and calls
 *      the inline tool functions directly for tool execution.
 *
 * The loop structure is identical to demo1-raw.ts — the only difference is
 * that callLLM is now called via proxyActivities instead of directly.
 */

import { proxyActivities } from "@temporalio/workflow";
import type * as acts from "./activities";
import Anthropic from "@anthropic-ai/sdk";
import nodeFetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { TOOLS } from "../tools";

// ── Inline tool implementations ───────────────────────────────────────────────
// These run inside the workflow directly. Exercise 2 moves them to activities.

const proxyUrl = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

function nativeFetchOpts() {
  return proxyAgent ? { agent: proxyAgent } : {};
}

async function getWeatherAlerts(state: string): Promise<string> {
  const url = `https://api.weather.gov/alerts/active?area=${state.toUpperCase()}`;
  const resp = await nodeFetch(url, {
    ...nativeFetchOpts(),
    headers: { "User-Agent": "temporal-typescript-agents" },
  } as Parameters<typeof nodeFetch>[1]);
  if (!resp.ok) throw new Error(`NWS error: ${resp.status}`);
  const data = (await resp.json()) as {
    features: Array<{ properties: { event?: string; headline?: string } }>;
  };
  const alerts = data.features ?? [];
  if (alerts.length === 0) return `No active weather alerts for ${state}.`;
  return alerts
    .slice(0, 5)
    .map((a) => `- ${a.properties.event ?? "Alert"}: ${a.properties.headline ?? ""}`)
    .join("\n");
}

async function getCoordinates(location: string): Promise<{ lat: number; lon: number }> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", location);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  const resp = await nodeFetch(url.toString(), {
    ...nativeFetchOpts(),
    headers: { "User-Agent": "temporal-typescript-agents" },
  } as Parameters<typeof nodeFetch>[1]);
  if (!resp.ok) throw new Error(`Nominatim error: ${resp.status}`);
  const results = (await resp.json()) as Array<{ lat: string; lon: string }>;
  if (results.length === 0) throw new Error(`Not found: ${location}`);
  return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
}

function getDistanceKm(
  lat1: number, lon1: number, lat2: number, lon2: number
): { distanceKm: number; distanceMiles: number } {
  const R = 6371.0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(a));
  return {
    distanceKm: Math.round(d * 100) / 100,
    distanceMiles: Math.round(d * 0.621371 * 100) / 100,
  };
}

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "get_weather_alerts") return getWeatherAlerts(input.state as string);
  if (name === "get_coordinates") return JSON.stringify(await getCoordinates(input.location as string));
  if (name === "get_distance_km") return JSON.stringify(getDistanceKm(input.lat1 as number, input.lon1 as number, input.lat2 as number, input.lon2 as number));
  return `Unknown tool: ${name}`;
}

// ── TODO: Create activity proxy for callLLM ───────────────────────────────────
//
// const { callLLM } = proxyActivities<typeof acts>({
//   startToCloseTimeout: "...",
// });

// ── TODO: Export weatherAgentWorkflow ─────────────────────────────────────────
//
// export async function weatherAgentWorkflow(query: string): Promise<string> {
//   const messages = [{ role: "user", content: query }];
//
//   while (true) {
//     // Call callLLM as an activity (not directly)
//     // Handle end_turn and tool_use stop reasons
//     // For tool_use, call runTool inline (not as activities yet)
//   }
// }
