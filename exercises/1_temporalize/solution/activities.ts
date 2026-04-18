/**
 * activities.ts — SOLUTION
 *
 * callLLM as a Temporal activity. Calls Claude with the given messages
 * and tool definitions, returns { content, stopReason }.
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
