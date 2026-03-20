import { useState, useMemo } from 'react';
import { LayoutGrid, RotateCcw } from 'lucide-react';
import useTrainingCenterData from '../../hooks/useTrainingCenterData';
import MiniStatsBar from './MiniStatsBar';
import ProgressTree from './ProgressTree';

const TrainingCenter = ({ 
  tacticalData, 
  errorNotebook, 
  isAcademicMode, 
  onNavigate,
  onStartTraining,
  onStartRemediation
}) => {
  const { stats, progressTree } = 
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

      <div className="mt-4">
        <ProgressTree 
          progressTree={progressTree}
          isAcademicMode={isAcademicMode}
          onVariantClick={handleTrain}
        />
      </div>
    </div>
  );
};

export default TrainingCenter;
