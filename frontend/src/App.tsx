import React, { useState, useEffect, useCallback } from 'react';
import Avatar from './components/Avatar';
import { fetchAvatarStatus, logHabits, fetchOrganTrend, updateCustomization } from './api';
import type { AvatarState, DailyHabits, OrganScores, OrganTrend } from './api';
import {
  Activity, Settings, X, Heart, Wind, Zap, Brain, Droplets,
  ChevronRight, ClipboardList,
  Plus, Check,
  TrendingUp, TrendingDown, Minus, Lightbulb, BookOpen, AlertCircle, ChevronDown
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Local form state type (nullable until submitted)
// All other types (AvatarState, OrganScores, OrganTrend) imported from api.ts
// ─────────────────────────────────────────────────────────────

interface DailyLog {
  sleepHours: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  activityType: 'walked' | 'run' | 'lifted' | 'cycled' | 'stretched' | 'swam' | 'yoga' | 'sports' | 'mostly sat';
  activityIntensity: 'easy' | 'moderate' | 'hard';
  activityDuration: '<10' | '10-20' | '20-30' | '30-60' | '60+';
  dietQuality: 'rough' | 'mixed' | 'good' | 'nourishing';
  hydration: 'low' | 'adequate' | 'high';
  stressLevel: 1 | 2 | 3 | 4 | 5;
  recovery: 'none' | 'small' | 'good' | 'full';
}

// ─────────────────────────────────────────────────────────────
// Organ meta
// ─────────────────────────────────────────────────────────────

const ORGAN_META: Record<string, {
  icon: React.ReactNode; color: string; gradient: string; insight: string;
}> = {
  heart: {
    icon: <Heart size={20} />, color: 'text-red-400', gradient: 'from-red-950 to-red-900',
    insight: 'Your heart pumps ~5 L of blood per minute. Cardio exercise strengthens the myocardium, improving stroke volume and lowering resting heart rate over time.'
  },
  lungs: {
    icon: <Wind size={20} />, color: 'text-sky-400', gradient: 'from-sky-950 to-sky-900',
    insight: 'Deep diaphragmatic breathing expands alveolar surface area, boosting VO₂ max. Even 10 min of breathwork daily measurably improves respiratory muscle endurance.'
  },
  liver: {
    icon: <Zap size={20} />, color: 'text-amber-400', gradient: 'from-amber-950 to-amber-900',
    insight: 'The liver performs over 500 functions — from gluconeogenesis to bile synthesis. Cruciferous vegetables and intermittent fasting support hepatic autophagy.'
  },
  brain: {
    icon: <Brain size={20} />, color: 'text-purple-400', gradient: 'from-purple-950 to-purple-900',
    insight: 'BDNF spikes during aerobic exercise and deep sleep, fostering neuroplasticity and protecting against cognitive decline.'
  },
  kidneys: {
    icon: <Droplets size={20} />, color: 'text-blue-400', gradient: 'from-blue-950 to-blue-900',
    insight: 'Kidneys filter ~180 L of blood daily. Adequate hydration (30–35 ml/kg) and limiting excess sodium keeps your GFR optimised.'
  },
};

// fetchOrganAdvice delegates to api.ts → GET /insights/organ-trend/:organ
const fetchOrganAdvice = (organ: string): Promise<OrganTrend> => fetchOrganTrend(organ);

// ─────────────────────────────────────────────────────────────
// Mini sparkline (7-day score history)
// ─────────────────────────────────────────────────────────────

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const W = 220, H = 44, pad = 4;
  const min = Math.min(...data) - 3;
  const max = Math.max(...data) + 3;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / (max - min)) * (H - pad * 2),
  ]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fill = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    + ` L${(W - pad).toFixed(1)},${H} L${pad},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3.5 : 2}
          fill={i === pts.length - 1 ? color : 'transparent'}
          stroke={color} strokeWidth="1.5" />
      ))}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Organ Panel (slide-in from right)
// ─────────────────────────────────────────────────────────────

const TREND_COLORS = { improving: '#34d399', stable: '#60a5fa', declining: '#f87171' } as const;
const TREND_ICONS = {
  improving: <TrendingUp size={14} />,
  stable: <Minus size={14} />,
  declining: <TrendingDown size={14} />,
} as const;
const PRIORITY_COLORS = { high: 'border-red-500/40 bg-red-500/10', medium: 'border-amber-500/40 bg-amber-500/10', low: 'border-white/10 bg-white/5' } as const;
const PRIORITY_LABEL = { high: 'High priority', medium: 'Suggested', low: 'Nice to have' } as const;

const SkeletonLine: React.FC<{ w?: string }> = ({ w = 'w-full' }) => (
  <div className={`h-3 rounded-full bg-white/8 animate-pulse ${w}`} />
);

const OrganPanel: React.FC<{ organ: string; score: number; onClose: () => void }> = ({ organ, score, onClose }) => {
  const meta = ORGAN_META[organ.toLowerCase()];
  const status = score >= 85 ? 'Optimal' : score >= 60 ? 'Moderate' : 'Needs attention';
  const statusColor = score >= 85 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const barColor = score >= 85 ? 'from-emerald-400 to-emerald-300' : score >= 60 ? 'from-amber-400 to-amber-300' : 'from-red-500 to-red-400';

  const [advice, setAdvice] = useState<OrganTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true); setError(false); setAdvice(null);
    fetchOrganAdvice(organ)
      .then(data => { setAdvice(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [organ]);

  const trendColor = advice ? TREND_COLORS[advice.trend_direction] : '#60a5fa';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm pointer-events-auto panel-slide-in">
      <div className={`h-full bg-gradient-to-b ${meta?.gradient ?? 'from-slate-950 to-slate-900'}
          border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white/10 ${meta?.color ?? 'text-white'}`}>{meta?.icon}</div>
            <div>
              <h2 className="text-xl font-bold text-white capitalize">{organ}</h2>
              <p className={`text-xs font-semibold ${statusColor}`}>{status}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── Score ring + bar ── */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={`${score * 2.513} 251.3`}
                  className={meta?.color ?? 'text-white'}
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{score}</span>
                <span className="text-[9px] text-white/35 uppercase tracking-widest">/ 100</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                  style={{ width: `${score}%`, transition: 'width 1.2s ease' }} />
              </div>
              <p className="text-[11px] text-white/40">Vitality score out of 100</p>
              {/* Trend badge */}
              {loading ? (
                <div className="h-5 rounded-full bg-white/8 animate-pulse w-28" />
              ) : advice && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: `${trendColor}1a`, color: trendColor }}>
                  {TREND_ICONS[advice.trend_direction]}
                  {advice.trend_direction.charAt(0).toUpperCase() + advice.trend_direction.slice(1)}
                </div>
              )}
            </div>
          </div>

          {/* ── 7-day Trend ── */}
          <section className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <TrendingUp size={11} /> 7-Day Trend
            </p>
            {loading ? (
              <div className="space-y-2">
                <div className="h-11 bg-white/5 rounded-lg animate-pulse" />
                <SkeletonLine w="w-3/4" />
              </div>
            ) : error ? (
              <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={12} /> Could not load trend data.</p>
            ) : advice && (
              <>
                <Sparkline data={advice.weekly_scores} color={trendColor} />
                <div className="flex justify-between text-[10px] text-white/25 mt-1 px-0.5">
                  <span>7 days ago</span><span>Today</span>
                </div>
                <p className="text-xs text-white/60 mt-2.5 leading-relaxed">{advice.trend_summary}</p>
              </>
            )}
          </section>

          {/* ── AI Personalised Tip ──────────────────────────────────
               ↳ Populated by: GET /api/organ-advice/:organ → .personalised_tip
               ↳ Generated by backend AI analysing the user's habit logs
          ─────────────────────────────────────────────────────── */}
          <section className={`p-4 border rounded-2xl ${loading ? 'border-white/10 bg-white/5' : advice ? PRIORITY_COLORS[advice.tip_priority] : 'border-white/10 bg-white/5'}`}>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Lightbulb size={11} className="text-yellow-400" />
              Personalised Advice
              {advice && !loading && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-white/40 text-[9px] normal-case tracking-normal font-medium">
                  {PRIORITY_LABEL[advice.tip_priority]}
                </span>
              )}
            </p>
            {loading ? (
              <div className="space-y-2">
                <SkeletonLine /><SkeletonLine w="w-5/6" /><SkeletonLine w="w-2/3" />
              </div>
            ) : error ? (
              <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertCircle size={12} /> Could not load advice.</p>
            ) : advice && (
              <p className="text-sm text-white/80 leading-relaxed">{advice.personalised_tip}</p>
            )}
          </section>

          {/* ── Research Insight (static, always shown) ── */}
          <section className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BookOpen size={11} /> Research Insight
            </p>
            <p className="text-xs text-white/55 leading-relaxed">{meta?.insight}</p>
          </section>

        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Daily Log Panel (slide-in from left)
// ─────────────────────────────────────────────────────────────

const ACTIVITY_OPTIONS: DailyLog['activityType'][] = ['walked', 'run', 'lifted', 'cycled', 'stretched', 'swam', 'yoga', 'sports', 'mostly sat'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const durationToMinutes: Record<DailyLog['activityDuration'], number> = {
  '<10': 8,
  '10-20': 15,
  '20-30': 25,
  '30-60': 45,
  '60+': 70,
};

const mapDailyLogToHabits = (log: DailyLog): DailyHabits => {
  const hydrationMap: Record<DailyLog['hydration'], number> = { low: 1200, adequate: 2200, high: 3000 };
  const activityBoost: Record<DailyLog['activityIntensity'], number> = { easy: 0, moderate: 15, hard: 30 };
  const stepsByDuration: Record<DailyLog['activityDuration'], number> = { '<10': 1800, '10-20': 3200, '20-30': 5200, '30-60': 7600, '60+': 9800 };
  const dietBase: Record<DailyLog['dietQuality'], number> = { rough: 3, mixed: 5, good: 7, nourishing: 9 };
  const recoveryLift: Record<DailyLog['recovery'], number> = { none: -0.3, small: 0.2, good: 0.6, full: 1.0 };

  const activitySelected = log.activityType !== 'mostly sat';
  const exerciseMins = activitySelected ? durationToMinutes[log.activityDuration] + activityBoost[log.activityIntensity] : 0;
  const steps = activitySelected ? stepsByDuration[log.activityDuration] : 1400;
  const waterMl = hydrationMap[log.hydration] + (log.activityIntensity === 'hard' ? 250 : 0);
  const mood = clamp(Math.round(3 + (log.sleepQuality - 3) * 0.4 + recoveryLift[log.recovery] - (log.stressLevel - 3) * 0.5), 1, 5);

  return {
    sleep_hours: log.sleepHours,
    water_ml: waterMl,
    steps,
    nutrition_score: dietBase[log.dietQuality],
    exercise_mins: clamp(exerciseMins, 0, 180),
    mood,
  };
};

const SelectField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  className: string;
  children: React.ReactNode;
}> = ({ value, onChange, className, children }) => (
  <div className="relative">
    <select className={`${className} appearance-none pr-10 cursor-pointer`} value={value} onChange={e => onChange(e.target.value)}>
      {children}
    </select>
    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/45" />
  </div>
);

const DailyLogPanel: React.FC<{
  onClose: () => void;
  onSubmit: (log: DailyLog) => void;
}> = ({ onClose, onSubmit }) => {
  const [log, setLog] = useState<DailyLog>({
    sleepHours: 7,
    sleepQuality: 3,
    activityType: 'walked',
    activityIntensity: 'moderate',
    activityDuration: '20-30',
    dietQuality: 'good',
    hydration: 'adequate',
    stressLevel: 3,
    recovery: 'small',
  });
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const steps = [
    { title: 'Sleep', subtitle: 'Most predictive daily signal' },
    { title: 'Activity', subtitle: 'Type, intensity, and duration' },
    { title: 'Nutrition', subtitle: 'Quality and hydration only' },
    { title: 'Stress', subtitle: 'Stress + recovery' },
  ];

  const update = <K extends keyof DailyLog>(key: K, value: DailyLog[K]) => setLog(prev => ({ ...prev, [key]: value }));
  const isLastStep = step === steps.length - 1;
  const fieldClass = 'w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLastStep) {
      setStep(s => Math.min(s + 1, steps.length - 1));
      return;
    }
    onSubmit(log);
    setSubmitted(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 pointer-events-auto">
      <div className="absolute left-0 right-0 bottom-0 sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6 w-full sm:w-[min(560px,92vw)] h-[84vh] sm:h-[80vh] bg-slate-950 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden log-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-cyan-400">
              <ClipboardList size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Daily Log</h2>
              <p className="text-xs text-white/45">Step {step + 1} of {steps.length}: {steps[step].title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Check size={32} className="text-emerald-400" />
            </div>
            <p className="text-lg font-bold text-white">Logged!</p>
            <p className="text-sm text-white/55">Your avatar is updating...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="px-5 pt-4">
              <div className="grid grid-cols-4 gap-2">
                {steps.map((item, index) => (
                  <div key={item.title} className={`h-1.5 rounded-full ${index <= step ? 'bg-cyan-400' : 'bg-white/15'}`} />
                ))}
              </div>
              <p className="mt-3 text-xs text-white/55">{steps[step].subtitle}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {step === 0 && (
                <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <div>
                    <label className="text-xs text-white/60">Hours slept</label>
                    <input className={fieldClass} type="number" min={3} max={12} step={0.5} value={log.sleepHours} onChange={e => update('sleepHours', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs text-white/60">Sleep quality (1-5)</label>
                    <input className={fieldClass} type="number" min={1} max={5} value={log.sleepQuality} onChange={e => update('sleepQuality', parseInt(e.target.value) as DailyLog['sleepQuality'])} />
                  </div>
                </section>
              )}

              {step === 1 && (
                <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <div>
                    <label className="text-xs text-white/60">Main activity</label>
                    <SelectField className={fieldClass} value={log.activityType} onChange={value => update('activityType', value as DailyLog['activityType'])}>
                      {ACTIVITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </SelectField>
                  </div>
                  <div>
                    <label className="text-xs text-white/60">Intensity</label>
                    <SelectField className={fieldClass} value={log.activityIntensity} onChange={value => update('activityIntensity', value as DailyLog['activityIntensity'])}>
                      <option value="easy">Easy</option>
                      <option value="moderate">Moderate</option>
                      <option value="hard">Hard</option>
                    </SelectField>
                  </div>
                  <div>
                    <label className="text-xs text-white/60">Duration</label>
                    <SelectField className={fieldClass} value={log.activityDuration} onChange={value => update('activityDuration', value as DailyLog['activityDuration'])}>
                      <option value="<10">&lt;10 min</option>
                      <option value="10-20">10-20 min</option>
                      <option value="20-30">20-30 min</option>
                      <option value="30-60">30-60 min</option>
                      <option value="60+">60+ min</option>
                    </SelectField>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <div>
                    <label className="text-xs text-white/60">Food quality</label>
                    <SelectField className={fieldClass} value={log.dietQuality} onChange={value => update('dietQuality', value as DailyLog['dietQuality'])}>
                      <option value="rough">Rough day</option>
                      <option value="mixed">Mixed bag</option>
                      <option value="good">Pretty good</option>
                      <option value="nourishing">Nourishing</option>
                    </SelectField>
                  </div>
                  <div>
                    <label className="text-xs text-white/60">Hydration</label>
                    <SelectField className={fieldClass} value={log.hydration} onChange={value => update('hydration', value as DailyLog['hydration'])}>
                      <option value="low">Low</option>
                      <option value="adequate">Adequate</option>
                      <option value="high">High</option>
                    </SelectField>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-4">
                  <div>
                    <label className="text-xs text-white/60">Stress level (1-5)</label>
                    <input className={fieldClass} type="number" min={1} max={5} value={log.stressLevel} onChange={e => update('stressLevel', parseInt(e.target.value) as DailyLog['stressLevel'])} />
                  </div>
                  <div>
                    <label className="text-xs text-white/60">Recovery</label>
                    <SelectField className={fieldClass} value={log.recovery} onChange={value => update('recovery', value as DailyLog['recovery'])}>
                      <option value="none">None</option>
                      <option value="small">Small moments</option>
                      <option value="good">Good chunks</option>
                      <option value="full">Full day off</option>
                    </SelectField>
                  </div>
                </section>
              )}
            </div>

            <div className="p-5 border-t border-white/10 bg-slate-950">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(s => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="flex-1 rounded-xl border border-white/15 py-3 text-sm font-semibold text-white/80 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3 text-sm font-bold text-slate-950 transition-colors"
                >
                  {isLastStep ? 'Save Log' : 'Next'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Organ score HUD bar
// ─────────────────────────────────────────────────────────────

const OrganHUD: React.FC<{
  scores: OrganScores;
  onSelect: (organ: string, score: number) => void;
}> = ({ scores, onSelect }) => (
  <div className="flex gap-2 pointer-events-auto">
    {Object.entries(scores).map(([organ, score]) => {
      const meta = ORGAN_META[organ];
      const bar = score >= 85 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-500';
      return (
        <button key={organ} onClick={() => onSelect(organ, score)}
          className="group flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl
            bg-slate-900/70 hover:bg-slate-800/90 border border-white/10 hover:border-white/25
            transition-all duration-200 min-w-[56px] backdrop-blur-md">
          <span className={`${meta.color} group-hover:scale-110 transition-transform`}>{meta.icon}</span>
          <span className="text-[11px] font-bold text-white/60 capitalize">{organ}</span>
          <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${score}%` }} />
          </div>
        </button>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Avatar Customiser Panel
// ─────────────────────────────────────────────────────────────

const EYE_COLORS = ['#3a2a10', '#1c4587', '#274e13', '#666666', '#4a4a4a'];
const SKIN_COLORS = ['#FDDBB4', '#D8956B', '#C68642', '#8D5524', '#4A2912'];

const AvatarCustomiserPanel: React.FC<{
  state: AvatarState;
  onClose: () => void;
  onUpdate: (data: Partial<AvatarState>) => void;
}> = ({ state, onClose, onUpdate }) => {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm pointer-events-auto panel-slide-in">
      <div className="h-full bg-slate-950/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-cyan-400">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Customise Avatar</h2>
              <p className="text-xs text-white/40">Adjust your virtual self</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Skin Tone */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 block">Skin Tone</label>
            <div className="flex gap-2">
              {SKIN_COLORS.map(c => (
                <button key={c} onClick={() => onUpdate({ skin_tone: c })}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${state.skin_tone === c ? 'border-cyan-400 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Eye Color */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 block">Eye Color</label>
            <div className="flex gap-2">
              {EYE_COLORS.map(c => (
                <button key={c} onClick={() => onUpdate({ eye_color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${state.eye_color === c ? 'border-cyan-400 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Body Build */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
              <span>Body Build</span>
              <span className="text-white/30 lowercase">{Math.round(state.body_build * 100)}%</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={state.body_build}
              onChange={e => onUpdate({ body_build: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-400 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-white/25 mt-1">
              <span>Lean</span><span>Muscular</span>
            </div>
          </div>

          {/* Body Height */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
              <span>Height</span>
              <span className="text-white/30 lowercase">{Math.round(state.body_height * 100)}%</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={state.body_height}
              onChange={e => onUpdate({ body_height: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-400 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-white/25 mt-1">
              <span>Short</span><span>Tall</span>
            </div>
          </div>

          <div className="h-px bg-white/10 my-2" />

          {/* GLB Upload Fallback */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 block">Custom .glb Model URL</label>
            <input 
                type="text" 
                placeholder="https://...model.glb" 
                defaultValue={state.avatar_url || ''}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-500 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const url = e.currentTarget.value.trim();
                    onUpdate({ avatar_url: url ? url : undefined });
                  }
                }}
            />
            <p className="text-[10px] text-white/30 mt-1.5">Press Enter to apply. Clear to revert to procedural body.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────

// Placeholder thought – will be replaced by backend AI in prod
const PLACEHOLDER_THOUGHT = "Looking good today! Your sleep trend is improving. Keep it up — your future self is watching 🌟";

function App() {
  const [avatarState, setAvatarState] = useState<AvatarState | null>(null);
  const [selectedOrgan, setSelectedOrgan] = useState<{ name: string; score: number } | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [thoughtBubble] = useState(PLACEHOLDER_THOUGHT);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  const handleCustomizerUpdate = useCallback((data: Partial<AvatarState>) => {
    setAvatarState(prev => prev ? { ...prev, ...data } : null);
    updateCustomization(data as any).catch(console.error);
  }, []);

  useEffect(() => {
    fetchAvatarStatus().then(res => setAvatarState(res.avatar_state));
  }, []);

  const handleOrganClick = useCallback((organ: string) => {
    if (!avatarState) return;
    const score = avatarState.organ_scores[organ as keyof OrganScores];
    if (score !== undefined) { setSelectedOrgan({ name: organ, score }); setShowLog(false); }
  }, [avatarState]);

  const handleLogSubmit = useCallback((log: DailyLog) => {
    const habitsPayload = mapDailyLogToHabits(log);
    logHabits(habitsPayload).then(res => {
      setAvatarState(res.avatar_state);
    }).catch(err => console.error(err));
  }, []);

  if (!avatarState) {
    return (
      <div className="min-h-screen bg-[#08090f] text-white flex items-center justify-center">
        <div className="text-slate-500 text-sm animate-pulse">Initialising avatar…</div>
      </div>
    );
  }

  const vitality = Math.round(Math.max(0, 100 - Math.max(0, avatarState.biological_age - 18) * 1.5));

  return (
    <div className="fixed inset-0 bg-[#08090f] overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── 3-D Avatar full screen ── */}
      <Avatar
        biologicalAge={avatarState.biological_age}
        skinTone={avatarState.skin_tone}
        bodyBuild={avatarState.body_build}
        bodyHeight={avatarState.body_height}
        eyeColor={avatarState.eye_color}
        avatarUrl={avatarState.avatar_url}
        thoughtBubble={thoughtBubble}
        onOrganClick={handleOrganClick}
      />

      {/* ── UI overlay ── */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">

        {/* ── Header ── */}
        <header className="flex items-center justify-between px-5 pt-5 pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              <Activity size={18} className="text-cyan-400" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">FutureSelf</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Stats pill */}
            <div className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 text-xs">
              <span className="text-white/40">Bio Age</span>
              <span className="font-bold text-cyan-400">{avatarState.biological_age}</span>
              <span className="w-px h-3 bg-white/15" />
              <span className="text-white/40">Vitality</span>
              <span className="font-bold text-emerald-400">{vitality}%</span>
            </div>
            {/* Log button */}
            <button onClick={() => { setShowLog(s => !s); setSelectedOrgan(null); }}
              title="Log Today's Activities"
              className={`p-2.5 rounded-xl border backdrop-blur-md transition-colors ${showLog
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
                }`}>
              <ClipboardList size={17} />
            </button>
            {/* Customise Avatar */}
            <button onClick={() => setShowCustomizer(true)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10
              text-slate-400 hover:text-white transition-colors backdrop-blur-md" title="Customise Avatar">
              <Settings size={17} />
            </button>
          </div>
        </header>

        {/* Spacer fills remaining space */}
        <div className="flex-1" />

        {/* Interact hint */}
        {!hintDismissed && !selectedOrgan && (
          <div className="self-center mb-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-black/25 border border-white/8 text-white/30 text-[11px] pointer-events-auto cursor-pointer"
            onClick={() => setHintDismissed(true)}>
            <ChevronRight size={11} />
            Click an organ · Drag to rotate · Scroll to zoom
          </div>
        )}

        {/* ── Bottom HUD ── */}
        <footer className="flex justify-center pb-24 sm:pb-5 px-4 pointer-events-none">
          <OrganHUD
            scores={avatarState.organ_scores}
            onSelect={(name, score) => { setSelectedOrgan({ name, score }); setShowLog(false); }}
          />
        </footer>
      </div>

      {/* ── Panels (mutually exclusive) ── */}
      {selectedOrgan && !showLog && (
        <OrganPanel organ={selectedOrgan.name} score={selectedOrgan.score} onClose={() => setSelectedOrgan(null)} />
      )}
      {showLog && (
        <DailyLogPanel onClose={() => setShowLog(false)} onSubmit={handleLogSubmit} />
      )}

      {/* ── Customiser Panel ── */}
      {showCustomizer && (
        <AvatarCustomiserPanel
          state={avatarState}
          onClose={() => setShowCustomizer(false)}
          onUpdate={handleCustomizerUpdate}
        />
      )}

      {/* ── Log trigger FAB (always accessible, bottom-center) ── */}
      {!showLog && !selectedOrgan && (
        <button onClick={() => setShowLog(true)}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto
            w-[calc(100%-2rem)] max-w-sm sm:w-auto
            flex items-center justify-center gap-2
            px-5 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md rounded-2xl
            border border-cyan-400/40 text-cyan-200 text-sm font-semibold transition-all
            shadow-[0_0_22px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]">
          <Plus size={15} />
          Log Today
        </button>
      )}

      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes panelSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes logSlideIn    { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .panel-slide-in { animation: panelSlideIn 0.28s cubic-bezier(0.22,1,0.36,1); }
        .log-slide-in   { animation: logSlideIn   0.28s cubic-bezier(0.22,1,0.36,1); }
        input[type=range]::-webkit-slider-thumb { width:14px; height:14px; cursor:pointer; }
      `}</style>
    </div>
  );
}

export default App;


