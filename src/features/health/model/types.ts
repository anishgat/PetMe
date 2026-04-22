export type OrganKey =
  | "heart"
  | "lungs"
  | "brain"
  | "liver"
  | "stomach"
  | "intestines"
  | "kidneys"
  | "bones";

export type ActivityType =
  | "smoking"
  | "sleep"
  | "cardio"
  | "strength"
  | "walking"
  | "mobility"
  | "stress"
  | "alcohol"
  | "processed_food"
  | "healthy_meal"
  | "balanced_meal"
  | "high_sugar_meal"
  | "high_sat_fat_meal"
  | "alcohol_heavy_intake"
  | "protein_rich_meal"
  | "fiber_rich_meal"
  | "hydration"
  | "sedentary_day"
  | "social_connection";

export type Unit =
  | "cigarette"
  | "hour"
  | "minute"
  | "steps"
  | "meal"
  | "drink"
  | "level_10"
  | "serving"
  | "count";

export interface OrganState {
  score: number;
  acuteLoad: number;
  chronicLoad: number;
  recoveryReserve: number;
}

export interface OrganImpact {
  acute: number;
  chronic: number;
  recovery: number;
}

export interface ActivityEvent {
  type: ActivityType;
  amount: number;
  unit?: Unit;
  confidence?: number;
  timestamp?: string;
  source?: "manual" | "llm" | "device";
}

export type ActivityImpactMap = Partial<Record<OrganKey, OrganImpact>>;

export interface ActivityContribution {
  activityType: ActivityType;
  organ: OrganKey;
  acuteDelta: number;
  chronicDelta: number;
  recoveryDelta: number;
  netScoreEffectEstimate: number;
}

export type OrganStates = Record<OrganKey, OrganState>;

export type StreakState = Partial<Record<ActivityType, number>>;

export interface DailyUpdateResult {
  organStates: OrganStates;
  contributions: ActivityContribution[];
  streaks: StreakState;
}

export interface ExplanationInput {
  organ: OrganKey;
  state: OrganState;
  topNegative: ActivityContribution[];
  topPositive: ActivityContribution[];
}

export interface ParsedActivityPayload {
  activities: ActivityEvent[];
}
