import React, { useState, useEffect } from 'react';
import { Heart, Wind, Activity, Brain, Droplets, X } from 'lucide-react';

export interface OrganScores {
  heart: number;
  lungs: number;
  liver: number;
  brain: number;
  kidneys: number;
}

interface DashboardProps {
  organScores: OrganScores;
  onOrganClick: (organ: string, score: number) => void;
}

export interface OrganModalProps {
  organ: string;
  score: number;
  onClose: () => void;
}

const icons: Record<string, React.ReactNode> = {
  heart: <Heart size={20} className="text-red-500" />,
  lungs: <Wind size={20} className="text-sky-500" />,
  liver: <Activity size={20} className="text-amber-500" />,
  brain: <Brain size={20} className="text-purple-500" />,
  kidneys: <Droplets size={20} className="text-blue-500" />
};

export const OrganModal: React.FC<OrganModalProps> = ({ organ, score, onClose }) => {
  const [insight, setInsight] = useState<{insight: string, status: string} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Mock fetch delay
    setTimeout(() => {
      const mockInsights: Record<string, string> = {
        heart: "Your heart uses oxygen to power your brain. Deep breathing or cardio increases this efficiency. Keep fueling the engine!",
        lungs: "Deep, controlled breaths build respiratory reserve. Every minute of movement expands capacity.",
        liver: "Your body's master filtration system. Clean fuel and hydration keep it running like a top.",
        brain: "Sleep is when your brain cleans its own engine. Every hour counts as an investment in tomorrow's clarity.",
        kidneys: "Consistent hydration maintains the delicate balance. Water is the key to this system."
      };
      
      setInsight({
        insight: mockInsights[organ.toLowerCase()] || "System operating nominally.",
        status: score > 80 ? "Operating at peak efficiency." : "Needs a bit more fuel to reach optimal levels."
      });
      setLoading(false);
    }, 600);
  }, [organ, score]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/50 shadow-inner">
            {icons[organ.toLowerCase()] || icons.heart}
          </div>
          <div>
            <h3 className="text-2xl font-bold capitalize text-white">{organ}</h3>
            <p className="text-sm font-medium text-cyan-400">Current Vitality: {score}%</p>
          </div>
        </div>

        {loading || !insight ? (
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-slate-800 rounded-full w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded-full w-full"></div>
            <div className="h-4 bg-slate-800 rounded-full w-5/6"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-inner">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Status</p>
              <p className="text-cyan-50 font-medium">{insight.status}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 shadow-inner">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Research-Backed Insight</p>
              <p className="text-slate-300 leading-relaxed">{insight.insight}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ organScores, onOrganClick }) => {

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-slate-700/50">
      <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
        <span className="w-2 h-6 bg-blue-500 rounded-full inline-block"></span>
        Organ Matrix
      </h2>
      
      <div className="space-y-4">
        {Object.entries(organScores).map(([organ, score]) => (
          <div 
            key={organ}
            onClick={() => onOrganClick(organ, score)}
            className="group cursor-pointer p-4 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 transition-colors border border-slate-700/30 hover:border-slate-600"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900/80 rounded-xl shadow-inner border border-slate-700/50">
                  {icons[organ]}
                </div>
                <span className="font-semibold text-slate-200 capitalize tracking-wide">{organ}</span>
              </div>
              <span className="font-bold text-slate-100 bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700/30">
                {score}%
              </span>
            </div>
            
            {/* Health Bar */}
            <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${getHealthColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
