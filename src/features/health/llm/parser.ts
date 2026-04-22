import type { ParsedActivityPayload } from "../model/types";
import {
  ACTIVITY_PARSER_PROMPT,
  buildActivityParserUserPrompt,
} from "./prompts";

export interface LLMClient {
  complete(prompt: string): Promise<string>;
}

function extractJsonBlock(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in LLM response.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function safeJsonParse<T>(text: string): T {
  return JSON.parse(extractJsonBlock(text)) as T;
}

function isParsedActivityPayload(value: unknown): value is ParsedActivityPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ParsedActivityPayload;
  return Array.isArray(candidate.activities);
}

export async function parseActivitiesFromText(
  client: LLMClient,
  userText: string,
): Promise<ParsedActivityPayload> {
  const prompt = `${ACTIVITY_PARSER_PROMPT}\n\n${buildActivityParserUserPrompt(userText)}`;
  const raw = await client.complete(prompt);

  let parsed: unknown;
  try {
    parsed = safeJsonParse(raw);
  } catch (error) {
    throw new Error(
      `LLM returned invalid activity JSON: ${error instanceof Error ? error.message : "Unknown parse error"}`,
    );
  }

  if (!isParsedActivityPayload(parsed)) {
    throw new Error("LLM response did not match ParsedActivityPayload shape.");
  }

  return parsed;
}

export async function generateOrganExplanation(
  client: LLMClient,
  prompt: string,
): Promise<string> {
  const raw = await client.complete(prompt);
  return raw.trim();
}
