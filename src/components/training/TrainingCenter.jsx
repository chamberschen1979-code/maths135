import { useState, useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
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
