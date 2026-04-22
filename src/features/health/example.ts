import {
  buildExplanationPrompt,
  buildLocalExplanation,
  createInitialOrganStates,
  getTopNegativeContributors,
  getTopPositiveContributors,
  applyActivityEvents,
} from "./index";
import type { OrganKey, ParsedActivityPayload } from "./index";

const parsed: ParsedActivityPayload = {
  activities: [
    { type: "processed_food", amount: 1, unit: "meal", confidence: 0.92 },
    { type: "smoking", amount: 2, unit: "cigarette", confidence: 0.97 },
    { type: "sleep", amount: 5, unit: "hour", confidence: 0.95 },
    { type: "cardio", amount: 20, unit: "minute", confidence: 0.9 },
  ],
};

const initial = createInitialOrganStates();

const result = applyActivityEvents(initial, parsed.activities, { smoking: 4 });

for (const organ of Object.keys(result.organStates) as OrganKey[]) {
  const state = result.organStates[organ];
  const topNegative = getTopNegativeContributors(organ, result.contributions);
  const topPositive = getTopPositiveContributors(organ, result.contributions);

  const localExplanation = buildLocalExplanation({
    organ,
    state,
    topNegative,
    topPositive,
  });

  const llmPrompt = buildExplanationPrompt(
    organ,
    state.score,
    topNegative,
    topPositive,
  );

  console.log({
    organ,
    state,
    localExplanation,
    llmPrompt,
  });
}
