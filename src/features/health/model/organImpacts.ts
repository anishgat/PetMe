import type { ActivityImpactMap, ActivityType } from "./types";

export const ACTIVITY_IMPACTS: Record<ActivityType, ActivityImpactMap> = {
  smoking: {
    lungs: { acute: 2.5, chronic: 3.5, recovery: -0.5 },
    heart: { acute: 1.2, chronic: 1.8, recovery: -0.2 },
    brain: { acute: 0.4, chronic: 0.8, recovery: -0.1 },
    kidneys: { acute: 0.3, chronic: 0.6, recovery: -0.1 },
  },

  sleep: {
    brain: { acute: -1.5, chronic: -0.7, recovery: 2.2 },
    heart: { acute: -0.4, chronic: -0.3, recovery: 0.8 },
    stomach: { acute: -0.2, chronic: -0.1, recovery: 0.3 },
    intestines: { acute: -0.2, chronic: -0.2, recovery: 0.4 },
    kidneys: { acute: -0.2, chronic: -0.1, recovery: 0.3 },
  },

  cardio: {
    heart: { acute: -0.8, chronic: -0.5, recovery: 1.8 },
    lungs: { acute: -0.5, chronic: -0.3, recovery: 1.2 },
    brain: { acute: -0.4, chronic: -0.2, recovery: 1.0 },
    bones: { acute: -0.2, chronic: -0.2, recovery: 0.6 },
  },

  strength: {
    heart: { acute: -0.2, chronic: -0.2, recovery: 0.8 },
    bones: { acute: -0.3, chronic: -0.3, recovery: 1.8 },
    brain: { acute: -0.2, chronic: -0.1, recovery: 0.5 },
  },

  walking: {
    heart: { acute: -0.3, chronic: -0.2, recovery: 0.9 },
    lungs: { acute: -0.1, chronic: -0.1, recovery: 0.5 },
    brain: { acute: -0.2, chronic: -0.1, recovery: 0.6 },
    bones: { acute: -0.1, chronic: -0.1, recovery: 0.4 },
  },

  mobility: {
    bones: { acute: -0.2, chronic: -0.1, recovery: 0.7 },
    brain: { acute: -0.1, chronic: -0.1, recovery: 0.3 },
  },

  stress: {
    brain: { acute: 1.8, chronic: 1.2, recovery: -0.6 },
    heart: { acute: 1.0, chronic: 0.8, recovery: -0.3 },
    stomach: { acute: 1.2, chronic: 0.8, recovery: -0.4 },
    intestines: { acute: 0.9, chronic: 0.8, recovery: -0.4 },
  },

  alcohol: {
    liver: { acute: 1.8, chronic: 2.2, recovery: -0.5 },
    brain: { acute: 0.8, chronic: 0.7, recovery: -0.2 },
    heart: { acute: 0.4, chronic: 0.5, recovery: -0.1 },
    stomach: { acute: 0.7, chronic: 0.6, recovery: -0.2 },
    intestines: { acute: 0.4, chronic: 0.5, recovery: -0.2 },
    kidneys: { acute: 0.5, chronic: 0.7, recovery: -0.2 },
  },

  processed_food: {
    heart: { acute: 1.0, chronic: 1.8, recovery: -0.2 },
    stomach: { acute: 1.2, chronic: 1.3, recovery: -0.3 },
    intestines: { acute: 1.1, chronic: 1.7, recovery: -0.4 },
    liver: { acute: 0.8, chronic: 1.2, recovery: -0.2 },
    kidneys: { acute: 0.5, chronic: 0.8, recovery: -0.1 },
  },

  healthy_meal: {
    stomach: { acute: -0.5, chronic: -0.3, recovery: 0.8 },
    intestines: { acute: -0.6, chronic: -0.4, recovery: 1.0 },
    liver: { acute: -0.3, chronic: -0.2, recovery: 0.7 },
    heart: { acute: -0.2, chronic: -0.3, recovery: 0.6 },
    brain: { acute: -0.1, chronic: -0.1, recovery: 0.3 },
    kidneys: { acute: -0.2, chronic: -0.1, recovery: 0.3 },
  },

  balanced_meal: {
    stomach: { acute: -0.3, chronic: -0.2, recovery: 0.5 },
    intestines: { acute: -0.4, chronic: -0.3, recovery: 0.7 },
    liver: { acute: -0.2, chronic: -0.2, recovery: 0.5 },
    heart: { acute: -0.1, chronic: -0.2, recovery: 0.4 },
  },

  high_sugar_meal: {
    stomach: { acute: 0.6, chronic: 0.8, recovery: -0.2 },
    intestines: { acute: 0.7, chronic: 1.1, recovery: -0.2 },
    liver: { acute: 0.6, chronic: 1.1, recovery: -0.2 },
    heart: { acute: 0.4, chronic: 0.8, recovery: -0.1 },
    brain: { acute: 0.3, chronic: 0.4, recovery: -0.1 },
  },

  high_sat_fat_meal: {
    heart: { acute: 0.8, chronic: 1.4, recovery: -0.2 },
    liver: { acute: 0.5, chronic: 1.0, recovery: -0.2 },
    stomach: { acute: 0.5, chronic: 0.7, recovery: -0.1 },
    intestines: { acute: 0.4, chronic: 0.7, recovery: -0.1 },
    kidneys: { acute: 0.3, chronic: 0.5, recovery: -0.1 },
  },

  alcohol_heavy_intake: {
    liver: { acute: 2.8, chronic: 3.2, recovery: -0.7 },
    brain: { acute: 1.2, chronic: 1.0, recovery: -0.3 },
    heart: { acute: 0.8, chronic: 0.9, recovery: -0.2 },
    stomach: { acute: 1.1, chronic: 1.0, recovery: -0.3 },
    intestines: { acute: 0.8, chronic: 0.9, recovery: -0.2 },
    kidneys: { acute: 1.0, chronic: 1.2, recovery: -0.3 },
  },

  protein_rich_meal: {
    bones: { acute: -0.1, chronic: -0.1, recovery: 0.6 },
    stomach: { acute: -0.1, chronic: -0.1, recovery: 0.2 },
    intestines: { acute: -0.1, chronic: -0.1, recovery: 0.3 },
    heart: { acute: -0.1, chronic: -0.1, recovery: 0.2 },
    kidneys: { acute: -0.1, chronic: -0.1, recovery: 0.2 },
  },

  fiber_rich_meal: {
    stomach: { acute: -0.3, chronic: -0.2, recovery: 0.5 },
    intestines: { acute: -0.7, chronic: -0.5, recovery: 1.1 },
    heart: { acute: -0.1, chronic: -0.2, recovery: 0.4 },
    liver: { acute: -0.1, chronic: -0.1, recovery: 0.3 },
  },

  hydration: {
    brain: { acute: -0.3, chronic: -0.1, recovery: 0.5 },
    stomach: { acute: -0.1, chronic: -0.1, recovery: 0.2 },
    intestines: { acute: -0.1, chronic: -0.1, recovery: 0.2 },
    heart: { acute: -0.1, chronic: -0.1, recovery: 0.2 },
    kidneys: { acute: -0.5, chronic: -0.3, recovery: 0.9 },
  },

  sedentary_day: {
    heart: { acute: 0.5, chronic: 0.9, recovery: -0.2 },
    lungs: { acute: 0.2, chronic: 0.4, recovery: -0.1 },
    brain: { acute: 0.3, chronic: 0.5, recovery: -0.1 },
    bones: { acute: 0.3, chronic: 0.6, recovery: -0.2 },
  },

  social_connection: {
    brain: { acute: -0.5, chronic: -0.2, recovery: 0.8 },
    heart: { acute: -0.2, chronic: -0.1, recovery: 0.3 },
  },
};

export const HARMFUL_ACTIVITIES: ActivityType[] = [
  "smoking",
  "stress",
  "alcohol",
  "processed_food",
  "high_sugar_meal",
  "high_sat_fat_meal",
  "alcohol_heavy_intake",
  "sedentary_day",
];

export const BENEFICIAL_ACTIVITIES: ActivityType[] = [
  "sleep",
  "cardio",
  "strength",
  "walking",
  "mobility",
  "healthy_meal",
  "balanced_meal",
  "protein_rich_meal",
  "fiber_rich_meal",
  "hydration",
  "social_connection",
];
