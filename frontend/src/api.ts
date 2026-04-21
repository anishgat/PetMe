/**
 * api.ts  — Centralized backend service layer
 *
 * All communication with the FastAPI backend flows through this file.
 * To hook up the real backend, set VITE_API_URL in your .env file:
 *   VITE_API_URL=http://localhost:8000
 *
 * Every function has a PLACEHOLDER fallback so the UI works without
 * the backend running (e.g. during frontend-only development).
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────
// Shared types (mirrored from backend Pydantic models)
// ─────────────────────────────────────────────────────────────

export interface OrganScores {
  heart: number;
  lungs: number;
  liver: number;
  brain: number;
  kidneys: number;
}

export interface AvatarState {
  biological_age: number;
  organ_scores: OrganScores;
  skin_tone: string;   // 'light' | 'medium' | 'olive' | 'brown' | 'dark'
  avatar_url?: string;
  body_build: number;
  body_height: number;
  eye_color: string;
}

export interface DailyHabits {
  sleep_hours: number;
  water_ml: number;
  steps: number;
  nutrition_score: number;
  exercise_mins: number;
  mood: number;
}

/** Shape of GET /insights/organ-trend/:organ */
export interface OrganTrend {
  trend_direction: 'improving' | 'stable' | 'declining';
  trend_summary: string;
  weekly_scores: number[];
  personalised_tip: string;
  tip_priority: 'high' | 'medium' | 'low';
}

// ─────────────────────────────────────────────────────────────
// Placeholder data (used when backend is unavailable)
// ─────────────────────────────────────────────────────────────

const PLACEHOLDER_AVATAR: AvatarState = {
  biological_age: 25,
  organ_scores: { heart: 80, lungs: 90, liver: 85, brain: 87, kidneys: 92 },
  skin_tone: 'medium',
  avatar_url: undefined,
  body_build: 0.5,
  body_height: 0.5,
  eye_color: '#3a2a10',
};

const PLACEHOLDER_THOUGHT = "Ready to conquer the day! How are we investing in ourselves? 🌟";

const PLACEHOLDER_TRENDS: Record<string, OrganTrend> = {
  heart: { trend_direction: 'improving', trend_summary: 'Heart score up 6 pts — cardio is paying off.', weekly_scores: [74, 75, 76, 77, 78, 79, 80], personalised_tip: 'Add one 20-min brisk walk to push resting HR under 65 bpm.', tip_priority: 'medium' },
  lungs: { trend_direction: 'stable', trend_summary: 'Lung score holding steady — strong baseline.', weekly_scores: [89, 90, 90, 91, 90, 89, 90], personalised_tip: 'Try 5 min of box breathing (4-4-4-4) before bed to build respiratory endurance.', tip_priority: 'low' },
  liver: { trend_direction: 'stable', trend_summary: 'Liver score consistent with nutrition this week.', weekly_scores: [84, 85, 85, 86, 85, 85, 85], personalised_tip: 'Aim for 2.5 L water daily — dehydration is the #1 untracked liver stressor.', tip_priority: 'medium' },
  brain: { trend_direction: 'improving', trend_summary: 'Brain score up 4 pts — sleep consistency is key.', weekly_scores: [83, 84, 84, 85, 86, 86, 87], personalised_tip: 'Add 10 min aerobic exercise before deep-focus work to spike BDNF levels.', tip_priority: 'low' },
  kidneys: { trend_direction: 'improving', trend_summary: 'Hydration logs supporting kidney health well.', weekly_scores: [88, 89, 90, 91, 91, 92, 92], personalised_tip: 'Watch sodium spikes on weekends — swap one high-sodium meal with whole foods.', tip_priority: 'low' },
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function get<T>(path: string, placeholder: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json() as T;
  } catch {
    console.warn(`[api] GET ${path} failed — using placeholder`);
    return placeholder;
  }
}

async function post<T>(path: string, body: object, placeholder: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(res.statusText);
    return await res.json() as T;
  } catch {
    console.warn(`[api] POST ${path} failed — using placeholder`);
    return placeholder;
  }
}

// ─────────────────────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────────────────────

/**
 * Fetch initial avatar state and thought bubble on app load.
 * Backend:  GET /avatar/status
 * Returns:  { avatar_state, thought_bubble }
 */
export async function fetchAvatarStatus(): Promise<{ avatar_state: AvatarState; thought_bubble: string }> {
  return get('/avatar/status', {
    avatar_state: PLACEHOLDER_AVATAR,
    thought_bubble: PLACEHOLDER_THOUGHT,
  });
}

/**
 * Submit the user's daily habit log.
 * Backend:  POST /scoring/log-habits
 * Returns:  { status, avatar_state, thought_bubble }
 *
 * The backend recalculates organ scores + bio-age from logged habits,
 * then returns the updated state in a single round-trip.
 */
export async function logHabits(
  habits: DailyHabits
): Promise<{ status: string; avatar_state: AvatarState; thought_bubble: string }> {
  return post('/scoring/log-habits', habits, {
    status: 'offline',
    avatar_state: PLACEHOLDER_AVATAR,
    thought_bubble: PLACEHOLDER_THOUGHT,
  });
}

/**
 * Fetch 7-day trend analysis + personalised AI tip for a given organ.
 * Backend:  GET /insights/organ-trend/:organ
 * Returns:  OrganTrend
 *
 * TODO (backend): plug an LLM into _organ_trend() and read real
 * habit history from the database instead of the in-memory window.
 */
export async function fetchOrganTrend(organ: string): Promise<OrganTrend> {
  return get(`/insights/organ-trend/${organ}`, PLACEHOLDER_TRENDS[organ] ?? PLACEHOLDER_TRENDS.heart);
}

/**
 * Update the user's avatar customization.
 * Backend: POST /avatar/update-customization
 */
export async function updateCustomization(state: AvatarState): Promise<{ status: string; avatar_state: AvatarState }> {
  return post('/avatar/update-customization', state, {
    status: 'offline',
    avatar_state: state
  });
}
