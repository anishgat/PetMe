from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import math

app = FastAPI(title="Future-Self Health Avatar API")

# ─────────────────────────────────────────────────────────────
# CORS — allow the Vite dev server
# ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────────────

class DailyHabits(BaseModel):
    """Richer daily log sent by the frontend form."""
    sleep_hours:      float           = Field(default=7.0,  ge=0, le=24)
    water_ml:         int             = Field(default=2000, ge=0)
    steps:            int             = Field(default=5000, ge=0)
    nutrition_score:  int             = Field(default=5,    ge=1, le=10)
    exercise_mins:    int             = Field(default=30,   ge=0)
    mood:             int             = Field(default=3,    ge=1, le=5)

class OrganScores(BaseModel):
    heart:   int
    lungs:   int
    liver:   int
    brain:   int
    kidneys: int

class AvatarState(BaseModel):
    biological_age: int
    organ_scores:   OrganScores
    skin_tone:      str   # 'light' | 'medium' | 'olive' | 'brown' | 'dark'
    avatar_url:     Optional[str] = None
    body_build:     float = Field(default=0.5, ge=0.0, le=1.0)
    body_height:    float = Field(default=0.5, ge=0.0, le=1.0)
    eye_color:      str   = Field(default="#3a2a10")

class OrganTrend(BaseModel):
    """Shape returned by GET /insights/organ-trend/{organ}.
       Frontend reads: trend_direction, trend_summary, weekly_scores, personalised_tip, tip_priority"""
    trend_direction: str          # 'improving' | 'stable' | 'declining'
    trend_summary:   str
    weekly_scores:   List[int]    # last 7 scores for sparkline
    personalised_tip: str         # AI-generated action advice
    tip_priority:    str          # 'high' | 'medium' | 'low'

class ThoughtBubble(BaseModel):
    message: str

# ─────────────────────────────────────────────────────────────
# In-memory state (replace with DB in production)
# ─────────────────────────────────────────────────────────────

_avatar_state = AvatarState(
    biological_age=25,
    organ_scores=OrganScores(heart=80, lungs=90, liver=85, brain=87, kidneys=92),
    skin_tone="medium",
    avatar_url=None,
    body_build=0.5,
    body_height=0.5,
    eye_color="#3a2a10",
)

# Simple sliding window of score history per organ (last 7 days, seeded)
_score_history: Dict[str, List[int]] = {
    "heart":   [74, 75, 76, 77, 78, 79, 80],
    "lungs":   [89, 90, 90, 91, 90, 89, 90],
    "liver":   [84, 85, 85, 86, 85, 85, 85],
    "brain":   [83, 84, 84, 85, 86, 86, 87],
    "kidneys": [88, 89, 90, 91, 91, 92, 92],
}

# ─────────────────────────────────────────────────────────────
# Business logic helpers
# ─────────────────────────────────────────────────────────────

def _score_organs(h: DailyHabits) -> OrganScores:
    """
    Placeholder scoring function.
    TODO: replace with a proper trend-aware ML model / rule engine.
    Each organ reacts differently to the logged habits.
    """
    sleep_factor = min(h.sleep_hours / 8.0, 1.0)           # 0-1
    move_factor  = min(h.exercise_mins / 60.0, 1.0)         # 0-1
    nutri_factor = h.nutrition_score / 10.0                  # 0-1
    water_factor = min(h.water_ml / 2500, 1.0)              # 0-1
    steps_factor = min(h.steps / 10000, 1.0)                # 0-1

    prev = _avatar_state.organ_scores

    def blend(prev_v: int, target: float, weight: float = 0.25) -> int:
        """Smooth transition toward target score to avoid jumpy values."""
        return max(0, min(100, round(prev_v + (target * 100 - prev_v) * weight)))

    heart_target   = 0.4 * move_factor  + 0.3 * steps_factor + 0.3 * nutri_factor
    lungs_target   = 0.5 * move_factor  + 0.3 * sleep_factor + 0.2 * water_factor
    liver_target   = 0.5 * nutri_factor + 0.3 * water_factor + 0.2 * sleep_factor
    brain_target   = 0.5 * sleep_factor + 0.3 * nutri_factor + 0.2 * (h.mood / 5.0)
    kidneys_target = 0.6 * water_factor + 0.2 * move_factor  + 0.2 * nutri_factor

    return OrganScores(
        heart=blend(prev.heart, heart_target),
        lungs=blend(prev.lungs, lungs_target),
        liver=blend(prev.liver, liver_target),
        brain=blend(prev.brain, brain_target),
        kidneys=blend(prev.kidneys, kidneys_target),
    )

def _score_bio_age(h: DailyHabits, prev_age: int) -> int:
    """Biological age drifts based on habit quality."""
    quality = (h.sleep_hours / 8 + h.nutrition_score / 10 + min(h.exercise_mins, 60) / 60) / 3
    if quality > 0.75:
        return max(18, prev_age - 1)
    elif quality < 0.4:
        return prev_age + 1
    return prev_age

def _thought_bubble(h: DailyHabits) -> str:
    """
    Placeholder thought bubble.
    TODO: replace with an LLM call that receives habit trends and returns a personalised message.
    """
    if h.mood >= 4 and h.exercise_mins >= 30:
        return "Feeling unstoppable today! Your body is loving the consistency — keep it up 🔥"
    if h.sleep_hours < 6:
        return "A bit tired, but you still showed up. Rest tonight so tomorrow's future self shines 🌙"
    if h.water_ml < 1500:
        return "Hydration is the quiet superpower. Drink a big glass right now — I'll wait 💧"
    if h.steps >= 8000:
        return f"{h.steps:,} steps today! Your cardiovascular system is cheering 🏃"
    return "Steady progress. Every good choice compounds — your future self is grateful 🌱"

def _organ_trend(organ: str, current_score: int) -> OrganTrend:
    """
    Placeholder per-organ trend analysis.
    TODO: replace with backend logic that reads the user's full history from DB.
    """
    history = _score_history.get(organ, [current_score] * 7)
    history[-1] = current_score          # ensure last point matches live score

    delta = history[-1] - history[0]
    if delta > 2:
        direction = "improving"
    elif delta < -2:
        direction = "declining"
    else:
        direction = "stable"

    # Placeholder tips — replace with LLM call
    tips: Dict[str, str] = {
        "heart":   "You hit your step goal 4 of the last 7 days. Add one 20-min brisk walk to push your resting heart rate under 65 bpm.",
        "lungs":   "Sleep data suggests shallow breathing on low-sleep nights. Try 5 min of box breathing (4-4-4-4) before bed.",
        "liver":   "You skipped logging water 3 days this week. Aim for 2.5 L daily — dehydration is the #1 untracked liver stressor.",
        "brain":   "Averaging good sleep — great. Add 10 min of aerobic exercise before deep-focus work to spike BDNF.",
        "kidneys": "Sodium intake spikes on weekends (inferred from nutrition dips). Swap one high-sodium meal with whole foods.",
    }
    summaries: Dict[str, str] = {
        "heart":   f"Heart score {'risen' if direction == 'improving' else 'held steady'} over 7 days — cardio is {'paying off' if direction == 'improving' else 'maintaining baseline'}.",
        "lungs":   "Lung score is stable — strong baseline, room to push higher with breathwork.",
        "liver":   "Liver score consistent with nutrition quality logged this week.",
        "brain":   "Brain score tracks closely with your sleep consistency.",
        "kidneys": "Hydration logs show solid kidney support this week.",
    }
    priorities: Dict[str, str] = {
        "heart": "medium", "lungs": "low", "liver": "medium", "brain": "low", "kidneys": "low"
    }

    return OrganTrend(
        trend_direction=direction,
        trend_summary=summaries.get(organ, "Score is stable."),
        weekly_scores=history,
        personalised_tip=tips.get(organ, "Keep up the good habits!"),
        tip_priority=priorities.get(organ, "low"),
    )

# ─────────────────────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────────────────────

avatar_router   = APIRouter(prefix="/avatar",   tags=["avatar"])
scoring_router  = APIRouter(prefix="/scoring",  tags=["scoring"])
insights_router = APIRouter(prefix="/insights", tags=["insights"])

# ── Avatar ──────────────────────────────────────────────────

@avatar_router.get("/status", response_model=dict)
async def get_avatar_status():
    """
    Frontend calls this on load.
    Returns full avatar state: biological_age, organ_scores, skin_tone, thought_bubble.
    """
    return {
        "avatar_state":  _avatar_state.model_dump(),
        "thought_bubble": "Ready to conquer the day! How are we investing in ourselves? 🌟",
    }

class UpdateUrlRequest(BaseModel):
    avatar_url: str

@avatar_router.post("/update-customization", response_model=dict)
async def update_customization(req: AvatarState):
    global _avatar_state
    _avatar_state.skin_tone = req.skin_tone
    _avatar_state.body_build = req.body_build
    _avatar_state.body_height = req.body_height
    _avatar_state.eye_color = req.eye_color
    if req.avatar_url is not None:
        _avatar_state.avatar_url = req.avatar_url
    
    return {
        "status": "success",
        "avatar_state": _avatar_state.model_dump()
    }

# ── Scoring / Habit Log ─────────────────────────────────────

@scoring_router.post("/log-habits", response_model=dict)
async def log_habits(habits: DailyHabits):
    """
    Frontend POSTs this after the user submits the daily log form.
    Recalculates organ scores, biological age, and generates a thought bubble.
    Returns updated avatar_state + thought_bubble so frontend can update in one round-trip.
    """
    global _avatar_state

    new_scores  = _score_organs(habits)
    new_bio_age = _score_bio_age(habits, _avatar_state.biological_age)
    bubble      = _thought_bubble(habits)

    # Update history sliding window
    for organ in _score_history:
        current = getattr(new_scores, organ)
        _score_history[organ].append(current)
        _score_history[organ] = _score_history[organ][-7:]  # keep last 7

    _avatar_state = AvatarState(
        biological_age=new_bio_age,
        organ_scores=new_scores,
        skin_tone=_avatar_state.skin_tone,
        avatar_url=_avatar_state.avatar_url,
    )

    return {
        "status":        "success",
        "avatar_state":  _avatar_state.model_dump(),
        "thought_bubble": bubble,
    }

# ── Insights ────────────────────────────────────────────────

@insights_router.get("/organ-trend/{organ_name}", response_model=OrganTrend)
async def get_organ_trend(organ_name: str):
    """
    Frontend fetches this when an organ panel is opened.
    Returns 7-day trend, personalised tip, and priority.
    TODO: Plug LLM into _organ_trend() and read real history from DB.
    """
    organ = organ_name.lower()
    current = getattr(_avatar_state.organ_scores, organ, 80)
    return _organ_trend(organ, current)

@insights_router.get("/organ-insight/{organ_name}", response_model=dict)
async def get_organ_insight(organ_name: str):
    """Static research insight for an organ (can stay as-is or use RAG later)."""
    insights = {
        "heart":   "Your heart pumps ~5 L/min. Cardio strengthens the myocardium, improving stroke volume and lowering resting HR.",
        "lungs":   "Deep breathing expands alveolar surface area, boosting VO₂ max. 10 min of breathwork daily improves respiratory endurance.",
        "liver":   "The liver performs 500+ functions. Cruciferous vegetables and intermittent fasting support hepatic autophagy.",
        "brain":   "BDNF spikes during aerobic exercise and deep sleep, fostering neuroplasticity and protecting against cognitive decline.",
        "kidneys": "Kidneys filter ~180 L daily. Hydration (30–35 ml/kg) and limiting sodium keeps GFR optimised.",
    }
    return {"organ": organ_name, "insight": insights.get(organ_name.lower(), "Keep making healthy choices.")}

# ─────────────────────────────────────────────────────────────
# Register
# ─────────────────────────────────────────────────────────────

app.include_router(avatar_router)
app.include_router(scoring_router)
app.include_router(insights_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
