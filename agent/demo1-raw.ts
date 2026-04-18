/**
 * demo1-raw.ts — The raw agentic loop. No Temporal.
 *
 * A plain while loop that calls Claude, executes tools,
 * and feeds results back until Claude has a final answer.
 *
 * Run with:
 *   npx ts-node demo1-raw.ts "What are the weather alerts in California?"
 *   npx ts-node demo1-raw.ts "What are the weather alerts in Texas, and how far is Dallas from Houston?"
 *
 * Try disrupting it mid-run by pressing Ctrl+C.
 * Everything is lost. This is the problem Demo 2 solves.
 */

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

function nativeFetchOpts() {
  return proxyAgent ? { agent: proxyAgent } : {};
}

const proxiedFetch: Anthropic.Fetch = (url, init) =>
  nodeFetch(
    url as string,
    { ...init, ...nativeFetchOpts() } as Parameters<typeof nodeFetch>[1]
  );

// ── Tool implementations ───────────────────────────────────────────────────────

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

// ── Main loop ─────────────────────────────────────────────────────────────────

async function main(query: string): Promise<void> {
  console.log(`\nQuery: ${query}\n`);
  const client = new Anthropic({
    fetch: proxiedFetch,
    maxRetries: 0,
  });
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: query }];
  let iteration = 0;

  while (true) {
    iteration++;
    console.log(`[Iteration ${iteration}] Calling Claude...`);

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
      tools: TOOLS,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "end_turn") {
      for (const block of response.content) {
        if (block.type === "text") {
          console.log(`\n=== Result ===\n${block.text}`);
          return;
        }
      }
      return;
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          console.log(`  -> Calling tool: ${block.name}(${JSON.stringify(block.input)})`);
          const result = await runTool(block.name, block.input as Record<string, unknown>);
          console.log(`  <- Result: ${result.slice(0, 100)}...`);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      messages.push({ role: "user", content: toolResults });
    }
  }
}

const query =
  process.argv.length > 2
    ? process.argv.slice(2).join(" ")
    : "What are the active weather alerts in California?";

main(query).catch((err) => {
  console.error(err);
  process.exit(1);
});
