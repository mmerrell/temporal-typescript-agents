/**
 * tools.ts — Claude tool definitions including ask_user.
 * Shared between exercise and solution. Do not modify.
 */

import Anthropic from "@anthropic-ai/sdk";

export const TOOLS_HITL: Anthropic.Tool[] = [
  {
    name: "get_weather_alerts",
    description:
      "Get active weather alerts for a US state from the National Weather Service. " +
      "Use the two-letter state code, e.g. CA, TX, NY.",
    input_schema: {
      type: "object",
      properties: {
        state: { type: "string", description: "Two-letter US state code (e.g. CA, TX, NY)" },
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
        location: { type: "string", description: "Location name, address, or city" },
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
      "Ask the user a clarifying question when you need information to complete the task. " +
      "Use this tool whenever you need to ask the user anything — do NOT ask questions in plain text.",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The question to ask the user" },
      },
      required: ["question"],
    },
  },
];
