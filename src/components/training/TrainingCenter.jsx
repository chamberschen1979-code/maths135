import { useState, useMemo } from 'react';
import { Zap, LayoutGrid, RotateCcw } from 'lucide-react';
import useTrainingCenterData from '../../hooks/useTrainingCenterData';
import MiniStatsBar from './MiniStatsBar';
import RecommendedNextPanel from './RecommendedNextPanel';
import ProgressTree from './ProgressTree';

const TrainingCenter = ({ 
  tacticalData, 
  errorNotebook, 
  isAcademicMode, 
  onNavigate,
  onStartTraining,
  onStartRemediation
}) => {
  const [activeTab, setActiveTab] = useState('recommended');
  
  const { stats, recommendedNext, progressTree } = 
    useTrainingCenterData(tacticalData, errorNotebook);

  const handleTrain = (rec) => {
    if (onStartTraining) {
      onStartTraining({
        motifId: rec.motifId,
        varId: rec.varId,
        specName: rec.specName,
        varName: rec.varName
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-200'}`}>
          学习进度
        </h2>
        
        <button
          onClick={() => {
            if (onNavigate) onNavigate('holomap');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
            isAcademicMode 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          返回图谱
        </button>
      </div>

      <MiniStatsBar stats={stats} isAcademicMode={isAcademicMode} />

      <div className={`flex border-b ${
        isAcademicMode ? 'border-slate-200' : 'border-zinc-800'
      }`}>
        <button
          onClick={() => setActiveTab('recommended')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'recommended'
              ? (isAcademicMode 
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' 
                  : 'text-amber-400 border-b-2 border-amber-400 bg-amber-900/20')
              : (isAcademicMode 
                  ? 'text-slate-500 hover:text-slate-700' 
                  : 'text-zinc-500 hover:text-zinc-300')
          }`}
        >
          <Zap className="w-4 h-4" />
          今日推荐
          {recommendedNext.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              isAcademicMode ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400'
            }`}>
              {recommendedNext.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? (isAcademicMode 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-blue-400 border-b-2 border-blue-400 bg-blue-900/20')
              : (isAcademicMode 
                  ? 'text-slate-500 hover:text-slate-700' 
                  : 'text-zinc-500 hover:text-zinc-300')
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          全部进度
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'recommended' && (
          <RecommendedNextPanel 
            recommendations={recommendedNext}
            isAcademicMode={isAcademicMode}
            onTrain={handleTrain}
          />
        )}

        {activeTab === 'all' && (
          <ProgressTree 
            progressTree={progressTree}
            isAcademicMode={isAcademicMode}
            onVariantClick={handleTrain}
          />
        )}
      </div>
    </div>
  );
};

export default TrainingCenter;
