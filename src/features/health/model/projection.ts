import { applyActivityEvents } from "./scoring";
import type {
  ActivityEvent,
  ActivityType,
  OrganKey,
  OrganStates,
  StreakState,
} from "./types";

const AGE_TARGET = 70;
const LOOKBACK_ENTRY_COUNT = 14;
const MIN_LOG_ENTRIES = 7;
const DAYS_PER_YEAR = 365;

const ALL_ORGANS: OrganKey[] = [
  "heart",
  "lungs",
  "brain",
  "liver",
  "stomach",
  "intestines",
  "kidneys",
  "bones",
];

type ProjectionCopy = {
  scenarioTitle: string;
  scenarioBody: string;
  abilityBullets: string[];
};

type ProjectionBandKey =
  | "strong_runway"
  | "capable_but_watchful"
  | "narrowing_comfort"
  | "meaningful_limitation_risk";

export type ProjectionPoint = {
  age: number;
  score: number;
};

export type ProjectionLever = {
  activityType: ActivityType;
  direction: "support" | "drag";
  impactAt70: number;
  label: string;
};

export type OrganFutureProjection = {
  available: boolean;
  projectedScore: number;
  band: string;
  points: ProjectionPoint[];
  scenarioTitle: string;
  scenarioBody: string;
  abilityBullets: string[];
  topSupports: ProjectionLever[];
  topDrags: ProjectionLever[];
  basisLabel: string;
};

export type ProjectionCycle = ActivityEvent[][];

export type ProjectionSimulationResult = {
  pointsByOrgan: Record<OrganKey, ProjectionPoint[]>;
  projectedScores: Record<OrganKey, number>;
  finalStates: OrganStates;
};

export type ProjectionLeverRanking = Record<
  OrganKey,
  { supports: ProjectionLever[]; drags: ProjectionLever[] }
>;

type ProjectionCycleSource = {
  events: ActivityEvent[];
};

type SimulateToAge70Input = {
  currentAge: number;
  organStates: OrganStates;
  streaks: StreakState;
  cycle: ProjectionCycle;
};

type RankProjectionLeversInput = SimulateToAge70Input;

const ACTIVITY_LABELS: Partial<Record<ActivityType, string>> = {
  sleep: "steady sleep",
  cardio: "cardio",
  strength: "strength work",
  walking: "walking",
  mobility: "mobility work",
  stress: "stress load",
  smoking: "smoking",
  alcohol: "alcohol",
  alcohol_heavy_intake: "heavy drinking",
  processed_food: "processed food",
  healthy_meal: "whole-food meals",
  balanced_meal: "balanced meals",
  high_sugar_meal: "sugar-heavy meals",
  high_sat_fat_meal: "heavy saturated-fat meals",
  protein_rich_meal: "protein-focused meals",
  fiber_rich_meal: "fiber-rich meals",
  hydration: "hydration",
  sedentary_day: "sedentary days",
  social_connection: "social connection",
};

const PROJECTION_COPY: Record<OrganKey, Record<ProjectionBandKey, ProjectionCopy>> = {
  heart: {
    strong_runway: {
      scenarioTitle: "Stamina that still feels available",
      scenarioBody:
        "At 70, your heart projection points toward a life where longer walks, stairs, and everyday errands still feel approachable instead of draining.",
      abilityBullets: [
        "Take brisk walks without needing long recovery breaks afterward.",
        "Handle stairs, groceries, and day trips with more breathing room.",
        "Bounce back from active weekends with steadier energy.",
      ],
    },
    capable_but_watchful: {
      scenarioTitle: "Capable, but effort starts to matter",
      scenarioBody:
        "At 70, your heart outlook still supports a fairly active life, but big spikes in effort may feel noticeably harder to absorb.",
      abilityBullets: [
        "Keep up with ordinary outings if you pace yourself.",
        "Notice longer recovery after intense or crowded days.",
        "Do best with movement that stays regular instead of sporadic.",
      ],
    },
    narrowing_comfort: {
      scenarioTitle: "Endurance begins to narrow",
      scenarioBody:
        "At 70, this pattern points to a smaller energy envelope, where chores and longer outings require more planning and more rest afterward.",
      abilityBullets: [
        "Feel daily errands stack up faster than they used to.",
        "Need recovery time after hills, stairs, or rushed schedules.",
        "Find consistency more protective than occasional bursts of effort.",
      ],
    },
    meaningful_limitation_risk: {
      scenarioTitle: "Everyday effort may feel expensive",
      scenarioBody:
        "At 70, this heart trajectory points toward a life where physical effort could shrink what feels easy or spontaneous during the day.",
      abilityBullets: [
        "Need to ration energy across chores, walking, and social plans.",
        "Find back-to-back active days harder to recover from.",
        "Benefit most from reducing strain now rather than later.",
      ],
    },
  },
  lungs: {
    strong_runway: {
      scenarioTitle: "Breathing room stays with you",
      scenarioBody:
        "At 70, your lung projection suggests everyday movement still feels open enough for walks, travel, and conversations without constant breath-management.",
      abilityBullets: [
        "Walk and talk with less need to stop and reset.",
        "Handle mild hills or longer routes with more confidence.",
        "Recover your breath more smoothly after effort.",
      ],
    },
    capable_but_watchful: {
      scenarioTitle: "Mostly steady air, with less margin",
      scenarioBody:
        "At 70, this path still supports an independent routine, but rushed pacing or heavier exertion may feel less forgiving.",
      abilityBullets: [
        "Keep up with routine movement when the pace is manageable.",
        "Notice harder breathing sooner during intense activity.",
        "Benefit from protecting consistency over all-or-nothing effort.",
      ],
    },
    narrowing_comfort: {
      scenarioTitle: "Your breathing buffer gets smaller",
      scenarioBody:
        "At 70, this trajectory points to less freedom around pace, distance, and recovery when the day asks more from you.",
      abilityBullets: [
        "Need to slow down sooner during long walks or stairs.",
        "Feel travel and busy days take more out of you.",
        "Use rest stops more deliberately to stay comfortable.",
      ],
    },
    meaningful_limitation_risk: {
      scenarioTitle: "Breathing may shape the day",
      scenarioBody:
        "At 70, this lung outlook points toward a routine where energy and breath could become a bigger deciding factor in what feels doable.",
      abilityBullets: [
        "Plan around effort instead of moving on impulse.",
        "Experience longer resets after exertion or smoky environments.",
        "Gain the most by reducing drag habits early.",
      ],
    },
  },
  brain: {
    strong_runway: {
      scenarioTitle: "Clearer focus remains available",
      scenarioBody:
        "At 70, your brain projection points toward steadier focus, emotional recovery, and enough cognitive reserve to stay present in daily life.",
      abilityBullets: [
        "Stay mentally present during conversations, errands, and planning.",
        "Recover from stressful days without feeling stuck in mental fog.",
        "Keep routines and decision-making feeling more manageable.",
      ],
    },
    capable_but_watchful: {
      scenarioTitle: "Mentally steady, but easier to overload",
      scenarioBody:
        "At 70, this path suggests good day-to-day function, though poor sleep or repeated stress may hit your focus faster than you want.",
      abilityBullets: [
        "Handle familiar routines well when life stays structured.",
        "Notice concentration drops sooner on overloaded days.",
        "Rely more on sleep and recovery to stay sharp.",
      ],
    },
    narrowing_comfort: {
      scenarioTitle: "Mental bandwidth begins to thin",
      scenarioBody:
        "At 70, this projection points toward a life where stress, bad sleep, or overstimulation may cost more clarity and patience.",
      abilityBullets: [
        "Need more quiet recovery after crowded or demanding days.",
        "Feel task-switching and decision fatigue earlier.",
        "Benefit from protecting routines that calm your baseline.",
      ],
    },
    meaningful_limitation_risk: {
      scenarioTitle: "Mental recovery may become fragile",
      scenarioBody:
        "At 70, this brain trajectory points toward less cognitive cushion, where stress and fatigue could quickly shape mood, focus, and follow-through.",
      abilityBullets: [
        "Find packed schedules mentally expensive to maintain.",
        "Need longer recovery after poor sleep or heavy stress.",
        "See the biggest long-term gain from stabilizing recovery now.",
      ],
    },
  },
  liver: {
    strong_runway: {
      scenarioTitle: "Your system handles fuel more smoothly",
      scenarioBody:
        "At 70, this liver outlook points toward steadier energy after meals and less day-to-day friction around food, recovery, and routine.",
      abilityBullets: [
        "Feel less dragged down by ordinary meals or celebrations.",
        "Recover more smoothly after occasional indulgent days.",
        "Keep energy more even across the week.",
      ],
    },
    capable_but_watchful: {
      scenarioTitle: "Mostly resilient, but less forgiving",
      scenarioBody:
        "At 70, this path still looks workable, though repeated sugar-heavy or alcohol-heavy stretches may hit your energy and comfort more noticeably.",
      abilityBullets: [
        "Handle a normal routine well when meals stay steady.",
        "Notice a bigger dip after heavier eating or drinking streaks.",
        "Do best with consistency rather than recovery binges.",
      ],
    },
    narrowing_comfort: {
      scenarioTitle: "Food and recovery start to carry more weight",
      scenarioBody:
        "At 70, this liver projection points toward less flexibility around diet and alcohol, with heavier days costing more of the next day too.",
      abilityBullets: [
        "Feel slower or heavier after rich meals and late nights.",
        "Need more careful routines to keep energy stable.",
        "See recovery take longer after repeated strain.",
      ],
    },
    meaningful_limitation_risk: {
      scenarioTitle: "Your tolerance window gets tight",
      scenarioBody:
        "At 70, this outlook suggests a smaller buffer for food and alcohol strain, where recovery and day-to-day steadiness could feel harder to protect.",
      abilityBullets: [
        "Need to plan around heavier meals instead of absorbing them easily.",
        "Feel repeated strain echo into the next day more often.",
        "Gain long-term relief from reducing sugar and alcohol drag now.",
      ],
    },
  },
  stomach: {
    strong_runway: {
      scenarioTitle: "Meals stay comfortable and predictable",
      scenarioBody:
        "At 70, your stomach projection points toward a future where eating still feels routine instead of something that regularly disrupts the day.",
      abilityBullets: [
        "Enjoy meals without expecting regular discomfort afterward.",
        "Handle social eating with less hesitation.",
        "Recover quickly when a meal is heavier than usual.",
      ],
    },
    capable_but_watchful: {
      scenarioTitle: "Comfort holds, but timing matters more",
      scenarioBody:
        "At 70, this path suggests decent digestive comfort overall, though irregular meals or repeated stress may make your stomach less forgiving.",
      abilityBullets: [
        "Do well when meals stay paced and predictable.",
        "Notice more sensitivity after rushed or heavy eating.",
        "Feel better when stress and sleep stay steadier.",
      ],
    },
    narrowing_comfort: {
      scenarioTitle: "Digestive comfort gets easier to disturb",
      scenarioBody:
        "At 70, this stomach outlook points toward more careful eating habits being needed to keep the day feeling comfortable.",
      abilityBullets: [
        "Need to think more about meal timing and meal size.",
        "Notice stress or rich food show up faster in your body.",
        "Value calm, regular eating patterns more than before.",
      ],
    },
    meaningful_limitation_risk: {
      scenarioTitle: "Food choices may shape your day more often",
      scenarioBody:
        "At 70, this pattern points toward a future where digestive discomfort could become a recurring tax on meals, plans, and energy.",
      abilityBullets: [
        "Avoid certain foods or timing because the cost feels high.",
        "Need longer resets after heavier meals or stressful days.",
        "Benefit most from lowering repeated strain while there is time.",
      ],
    },
  },
  intestines: {
    strong_runway: {
      scenarioTitle: "Your gut stays more cooperative",
      scenarioBody:
        "At 70, this intestinal projection points toward steadier digestion, more predictable energy after meals, and fewer routine disruptions.",
      abilityBullets: [
        "Feel less ruled by bloating or post-meal swings.",
        "Travel or eat out with more confidence.",
        "Keep everyday comfort more stable across the week.",
      ],
    },
    capable_but_watchful: {
      scenarioTitle: "Mostly steady, but routine matters",
      scenarioBody:
        "At 70, this path still looks manageable, though inconsistent meals or low-fiber stretches may noticeably chip away at comfort.",
      abilityBullets: [
        "Do well when meals stay regular and supportive.",
        "Notice off-pattern eating hit faster than it once did.",
        "Need more intention to keep digestion feeling easy.",
      ],
    },
    narrowing_comfort: {
      scenarioTitle: "Digestive ease starts to shrink",
      scenarioBody:
        "At 70, this outlook points toward needing more structure around food and movement to protect comfort and consistency.",
      abilityBullets: [
        "Feel bloating or irregularity disturb the day more often.",
        "Rely more on fiber, water, and movement to stay comfortable.",
        "Notice heavier meals linger longer in the body.",
      ],
    },
    meaningful_limitation_risk: {
      scenarioTitle: "Gut discomfort may become a louder signal",
      scenarioBody:
        "At 70, this trajectory suggests digestive friction could increasingly shape what feels worth eating or doing during the day.",
      abilityBullets: [
        "Spend more energy avoiding foods that throw you off.",
        "Feel routine disruptions more sharply after low-support stretches.",
        "See a strong payoff from rebuilding a steadier baseline now.",
      ],
    },
  },
  kidneys: {
    strong_runway: {
      scenarioTitle: "Hydration and recovery stay steadier",
      scenarioBody:
        "At 70, your kidney projection points toward a future where hydration, recovery, and day-to-day balance still feel relatively manageable.",
      abilityBullets: [
        "Handle normal activity and warmer days with better resilience.",
        "Recover from busy days with less drag from dehydration.",
        "Keep routine movement feeling more sustainable.",
      ],
    },
    capable_but_watchful: {
      scenarioTitle: "Stable enough, with less room for sloppy habits",
      scenarioBody:
        "At 70, this path supports everyday function, but dehydration, heavy food, or poor recovery may cost more comfort than they do now.",
      abilityBullets: [
        "Stay on track when hydration and sleep stay consistent.",
        "Notice rougher days sooner after low-support habits stack up.",
        "Benefit from steady daily inputs more than big corrections.",
      ],
    },
    narrowing_comfort: {
      scenarioTitle: "Your buffer for imbalance gets smaller",
      scenarioBody:
        "At 70, this outlook points toward a life where hydration and recovery need more consistent attention to keep days feeling smooth.",
      abilityBullets: [
        "Feel off-balance faster when hydration slips.",
        "Need a steadier routine to keep energy and comfort stable.",
        "Notice recovery takes longer after strain-heavy stretches.",
      ],
    },
    meaningful_limitation_risk: {
      scenarioTitle: "Small recovery slips may hit harder",
      scenarioBody:
        "At 70, this kidney projection points toward less room for neglect, with low-support habits more likely to spill into how the whole day feels.",
      abilityBullets: [
        "Experience hydration misses as bigger interruptions to comfort.",
        "Need more routine structure to keep balance steady.",
        "Gain outsized long-term value from protecting recovery now.",
      ],
    },
  },
  bones: {
    strong_runway: {
      scenarioTitle: "Movement still feels available",
      scenarioBody:
        "At 70, your bone and structure outlook points toward a life where getting up, carrying things, and staying active still feels more natural than effortful.",
      abilityBullets: [
        "Move through stairs, standing, and carrying with more confidence.",
        "Keep up hobbies and errands with less fear of overdoing it.",
        "Recover from active days with a steadier physical base.",
      ],
    },
    capable_but_watchful: {
      scenarioTitle: "Functional, but strength matters more",
      scenarioBody:
        "At 70, this path still supports independence, though long sedentary stretches or low strength work may slowly narrow how easy movement feels.",
      abilityBullets: [
        "Handle routine movement well when you stay active.",
        "Notice stiffness and load tolerance worsen faster when you stop moving.",
        "Need regular strength and posture habits to keep freedom.",
      ],
    },
    narrowing_comfort: {
      scenarioTitle: "Ease of movement starts to narrow",
      scenarioBody:
        "At 70, this projection points toward more stiffness, less tolerance for load, and a smaller margin around falls, lifting, and long days on your feet.",
      abilityBullets: [
        "Need more warm-up time before the body feels ready.",
        "Feel standing, lifting, or longer walks cost more afterward.",
        "Rely on consistency to preserve physical confidence.",
      ],
    },
    meaningful_limitation_risk: {
      scenarioTitle: "Physical freedom may feel easier to lose",
      scenarioBody:
        "At 70, this bone outlook points toward everyday movement asking for more caution, more recovery, and more planning than you would want.",
      abilityBullets: [
        "Think harder about lifting, carrying, and uneven terrain.",
        "Feel inactive stretches echo into stiffness and confidence loss.",
        "Get the clearest future payoff from rebuilding strength now.",
      ],
    },
  },
};

function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function cloneEvents(events: ActivityEvent[]): ActivityEvent[] {
  return events.map((event) => ({ ...event }));
}

function getProjectionBandKey(score: number): ProjectionBandKey {
  if (score >= 85) return "strong_runway";
  if (score >= 70) return "capable_but_watchful";
  if (score >= 55) return "narrowing_comfort";
  return "meaningful_limitation_risk";
}

export function formatProjectionBand(score: number): string {
  const band = getProjectionBandKey(score);

  switch (band) {
    case "strong_runway":
      return "Strong runway";
    case "capable_but_watchful":
      return "Capable but watchful";
    case "narrowing_comfort":
      return "Narrowing comfort";
    default:
      return "Meaningful limitation risk";
  }
}

export function getProjectionCopy(
  organ: OrganKey,
  score: number,
): ProjectionCopy {
  return PROJECTION_COPY[organ][getProjectionBandKey(score)];
}

export function isProjectionAgeValid(age?: number): age is number {
  return age != null && Number.isFinite(age) && age >= 13 && age < AGE_TARGET;
}

export function getProjectionMinLogEntries() {
  return MIN_LOG_ENTRIES;
}

export function buildProjectionCycle(
  logEntries: ProjectionCycleSource[],
): ProjectionCycle {
  return logEntries
    .slice(0, LOOKBACK_ENTRY_COUNT)
    .reverse()
    .map((entry) => cloneEvents(entry.events));
}

function createPointsByOrgan(
  currentAge: number,
  organStates: OrganStates,
): Record<OrganKey, ProjectionPoint[]> {
  return ALL_ORGANS.reduce(
    (accumulator, organ) => {
      accumulator[organ] = [
        {
          age: currentAge,
          score: round(organStates[organ].score),
        },
      ];

      return accumulator;
    },
    {} as Record<OrganKey, ProjectionPoint[]>,
  );
}

export function simulateToAge70({
  currentAge,
  organStates,
  streaks,
  cycle,
}: SimulateToAge70Input): ProjectionSimulationResult {
  const pointsByOrgan = createPointsByOrgan(currentAge, organStates);
  const yearsRemaining = AGE_TARGET - currentAge;

  if (yearsRemaining <= 0 || cycle.length === 0) {
    return {
      pointsByOrgan,
      projectedScores: ALL_ORGANS.reduce(
        (accumulator, organ) => {
          accumulator[organ] = round(organStates[organ].score);
          return accumulator;
        },
        {} as Record<OrganKey, number>,
      ),
      finalStates: organStates,
    };
  }

  let nextStates = organStates;
  let nextStreaks = streaks;

  for (let day = 1; day <= yearsRemaining * DAYS_PER_YEAR; day += 1) {
    const events = cycle[(day - 1) % cycle.length] ?? [];
    const result = applyActivityEvents(nextStates, events, nextStreaks);

    nextStates = result.organStates;
    nextStreaks = result.streaks;

    if (day % DAYS_PER_YEAR === 0) {
      const age = currentAge + day / DAYS_PER_YEAR;
      for (const organ of ALL_ORGANS) {
        pointsByOrgan[organ].push({
          age,
          score: round(nextStates[organ].score),
        });
      }
    }
  }

  return {
    pointsByOrgan,
    projectedScores: ALL_ORGANS.reduce(
      (accumulator, organ) => {
        accumulator[organ] = round(nextStates[organ].score);
        return accumulator;
      },
      {} as Record<OrganKey, number>,
    ),
    finalStates: nextStates,
  };
}

function getActivityLabel(activityType: ActivityType) {
  return ACTIVITY_LABELS[activityType] ?? activityType.replace(/_/g, " ");
}

function removeActivityTypeFromCycle(
  cycle: ProjectionCycle,
  activityType: ActivityType,
) {
  return cycle.map((events) =>
    events
      .filter((event) => event.type !== activityType)
      .map((event) => ({ ...event })),
  );
}

export function rankProjectionLevers({
  currentAge,
  organStates,
  streaks,
  cycle,
}: RankProjectionLeversInput): ProjectionLeverRanking {
  const baseline = simulateToAge70({
    currentAge,
    organStates,
    streaks,
    cycle,
  });

  const activityTypes = Array.from(
    new Set(
      cycle.flatMap((events) => events.map((event) => event.type)),
    ),
  );

  const rankings = ALL_ORGANS.reduce(
    (accumulator, organ) => {
      accumulator[organ] = {
        supports: [],
        drags: [],
      };

      return accumulator;
    },
    {} as ProjectionLeverRanking,
  );

  for (const activityType of activityTypes) {
    const comparison = simulateToAge70({
      currentAge,
      organStates,
      streaks,
      cycle: removeActivityTypeFromCycle(cycle, activityType),
    });

    for (const organ of ALL_ORGANS) {
      const delta =
        comparison.projectedScores[organ] - baseline.projectedScores[organ];

      if (Math.abs(delta) < 0.05) {
        continue;
      }

      const lever: ProjectionLever = {
        activityType,
        direction: delta > 0 ? "drag" : "support",
        impactAt70: round(Math.abs(delta)),
        label: getActivityLabel(activityType),
      };

      if (lever.direction === "drag") {
        rankings[organ].drags.push(lever);
      } else {
        rankings[organ].supports.push(lever);
      }
    }
  }

  for (const organ of ALL_ORGANS) {
    rankings[organ].drags.sort(
      (left, right) => right.impactAt70 - left.impactAt70,
    );
    rankings[organ].supports.sort(
      (left, right) => right.impactAt70 - left.impactAt70,
    );
  }

  return rankings;
}

export function createUnavailableFutureProjection(): OrganFutureProjection {
  return {
    available: false,
    projectedScore: 0,
    band: "",
    points: [],
    scenarioTitle: "",
    scenarioBody: "",
    abilityBullets: [],
    topSupports: [],
    topDrags: [],
    basisLabel: "",
  };
}

export function buildProjectionBasisLabel(cycle: ProjectionCycle) {
  return `Based on your last ${cycle.length} check-in${
    cycle.length === 1 ? "" : "s"
  }.`;
}
