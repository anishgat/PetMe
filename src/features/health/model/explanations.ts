import type {
  ActivityContribution,
  ExplanationInput,
  OrganKey,
} from "./types";

function prettifyActivityType(activityType: string): string {
  return activityType.replace(/_/g, " ");
}

function organLabel(organ: OrganKey): string {
  switch (organ) {
    case "stomach":
      return "stomach";
    case "intestines":
      return "intestines";
    case "kidneys":
      return "kidneys";
    default:
      return organ;
  }
}

export function buildLocalExplanation(input: ExplanationInput): string {
  const { organ, state, topNegative, topPositive } = input;
  const organName = organLabel(organ);

  const negativeText =
    topNegative.length > 0
      ? `Main stressors: ${topNegative
          .map((c) => prettifyActivityType(c.activityType))
          .join(", ")}.`
      : "No major negative drivers detected today.";

  const positiveText =
    topPositive.length > 0
      ? `Main supports: ${topPositive
          .map((c) => prettifyActivityType(c.activityType))
          .join(", ")}.`
      : "No strong positive supports detected today.";

  let stateText = "";
  if (state.score >= 85) {
    stateText = `${organName} is currently in a strong range.`;
  } else if (state.score >= 65) {
    stateText = `${organName} is stable but showing some strain.`;
  } else if (state.score >= 40) {
    stateText = `${organName} is under noticeable strain.`;
  } else {
    stateText = `${organName} is in a weak range and needs support.`;
  }

  return `${stateText} ${negativeText} ${positiveText}`;
}

export function buildExplanationPrompt(
  organ: OrganKey,
  score: number,
  topNegative: ActivityContribution[],
  topPositive: ActivityContribution[],
): string {
  return `
You are writing a short health insight for a consumer health app.

Rules:
- Be clear, calm, and concise.
- Do not diagnose disease.
- Do not sound alarmist.
- Keep it to 2-3 sentences.
- Mention the organ naturally.
- Mention the biggest negative and positive contributors if they exist.
- End with a simple next-step suggestion.

Organ: ${organ}
Score: ${score}

Top negative contributors:
${JSON.stringify(topNegative, null, 2)}

Top positive contributors:
${JSON.stringify(topPositive, null, 2)}

Return plain text only.
`.trim();
}
