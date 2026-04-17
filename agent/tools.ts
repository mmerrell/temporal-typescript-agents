/**
 * tools.ts
 *
 * Claude tool definitions. Kept alongside the implementations so schema
 * and logic stay in sync.
 *
 * TOOLS       — used by demos 1, 2, 3
 * TOOLS_HITL  — used by demo 4 (adds ask_user)
 */

import Anthropic from "@anthropic-ai/sdk";

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_weather_alerts",
    description:
      "Get active weather alerts for a US state from the National Weather Service. " +
      "Use the two-letter state code, e.g. CA, TX, NY.",
    input_schema: {
      type: "object",
      properties: {
        state: {
          type: "string",
          description: "Two-letter US state code (e.g. CA, TX, NY)",
        },
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
        location: {
          type: "string",
          description: "Location name, address, or city",
        },
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
        lat1: { type: "number", description: "Latitude of point 1" },
        lon1: { type: "number", description: "Longitude of point 1" },
        lat2: { type: "number", description: "Latitude of point 2" },
        lon2: { type: "number", description: "Longitude of point 2" },
      },
      required: ["lat1", "lon1", "lat2", "lon2"],
    },
  },
];

export const ASK_USER_TOOL: Anthropic.Tool = {
  name: "ask_user",
  description:
    "Ask the user a clarifying question when the request is ambiguous " +
    "or you need more information to complete the task. " +
    "Use this when you genuinely need input — not as a default.",
  input_schema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question to ask the user",
      },
    },
    required: ["question"],
  },
};

export const TOOLS_HITL: Anthropic.Tool[] = [...TOOLS, ASK_USER_TOOL];
