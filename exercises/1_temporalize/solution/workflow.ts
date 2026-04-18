/**
 * workflow.ts — SOLUTION
 *
 * The agentic loop wrapped in a Temporal workflow.
 * callLLM is called as an activity. Tool calls still run inline.
 *
 * Key difference from demo1-raw.ts:
 * - callLLM is called via proxyActivities, not directly
 * - The loop runs inside a @workflow.defn-equivalent exported function
 * - Tool calls still run inline (Exercise 2 moves them to activities)
 */

import { proxyActivities } from "@temporalio/workflow";
import type * as acts from "./activities";
import nodeFetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

const { callLLM } = proxyActivities<typeof acts>({
  startToCloseTimeout: "60 seconds",
});

// ── Inline tool implementations ───────────────────────────────────────────────

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

// ── Workflow ──────────────────────────────────────────────────────────────────

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
        const result = await runTool(toolName, toolInput as Record<string, unknown>);
        toolResults.push({ type: "tool_result", tool_use_id: toolUseId, content: result });
      }

      messages.push({ role: "user", content: toolResults });
    }
  }
}
