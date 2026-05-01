import { TrendingUp, AlertTriangle, Zap, CheckCircle } from 'lucide-react';

const MiniStatsBar = ({ stats, isAcademicMode }) => {
  const { totalElo, level, meltdownCount, masteredCount, totalCount } = stats;

  const levelColors = {
    L1: 'bg-slate-500',
    L2: 'bg-blue-500',
    L3: 'bg-purple-500',
    L4: 'bg-amber-500'
  };

  return (
    <div className={`px-4 py-3 rounded-xl mb-4 ${
      isAcademicMode 
        ? 'bg-white border border-slate-200' 
        : 'bg-zinc-900 border border-zinc-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
            levelColors[level] ? levelColors[level] : 'bg-slate-500'
          } text-white`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-bold">{level}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              Elo
            </span>
            <span className={`text-sm font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-200'}`}>
              {totalElo}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
            isAcademicMode ? 'bg-slate-100 text-slate-600' : 'bg-zinc-800 text-zinc-400'
          }">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {masteredCount}/{totalCount} 通关
            </span>
          </div>
      </div>
      </div>
    </div>
  );
};

export default MiniStatsBar;
