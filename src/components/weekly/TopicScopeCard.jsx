import React, { useMemo } from 'react';
import ErrorSection from './ErrorSection';
import CustomSection from './CustomSection';
import ReinforceSection from './ReinforceSection';

const TopicScopeCard = ({
  errorNotebook,
  tacticalData,
  selectedMotifs,
  onSelectionChange,
  onImportError,
  onNavigateToErrorLibrary,
  isAcademicMode
}) => {
  const allEncounters = tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];

  const errorMotifIds = useMemo(() => {
    const ids = new Set();
    errorNotebook?.filter(e => !e.resolved).forEach(err => {
      if (err.targetId) ids.add(err.targetId);
    });
    return ids;
  }, [errorNotebook]);

  const reinforcementMotifs = useMemo(() => {
    const excludedIds = new Set([
      ...Array.from(errorMotifIds),
      ...(selectedMotifs?.map(s => s.motifId) || [])
    ]);
    
    return allEncounters
      .filter(e => e.elo_score >= 1001 && !excludedIds.has(e.target_id))
      .sort((a, b) => a.elo_score - b.elo_score)
      .slice(0, 2);
  }, [allEncounters, errorMotifIds, selectedMotifs]);

  const allSelectedMotifs = useMemo(() => {
    const motifSet = new Set();
    
    errorMotifIds.forEach(id => motifSet.add(id));
    selectedMotifs?.forEach(s => motifSet.add(s.motifId));
    reinforcementMotifs.forEach(m => motifSet.add(m.target_id));
    
    return Array.from(motifSet);
  }, [errorMotifIds, selectedMotifs, reinforcementMotifs]);

  return (
    <div className={`rounded-xl p-4 ${
      isAcademicMode ? 'bg-white border border-slate-200' : 'bg-zinc-800/50 border border-zinc-700'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📋</span>
        <h2 className="font-bold text-sm">出题范围</h2>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
          isAcademicMode ? 'bg-slate-100 text-slate-600' : 'bg-zinc-700 text-zinc-400'
        }`}>
          共 {allSelectedMotifs.length} 个母题
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ErrorSection
          errorNotebook={errorNotebook}
          tacticalData={tacticalData}
          isAcademicMode={isAcademicMode}
          onImportError={onImportError}
          onNavigateToErrorLibrary={onNavigateToErrorLibrary}
        />

        <CustomSection
          tacticalData={tacticalData}
          errorMotifs={Array.from(errorMotifIds)}
          selectedMotifs={selectedMotifs}
          onSelectionChange={onSelectionChange}
          isAcademicMode={isAcademicMode}
        />

        <ReinforceSection
          tacticalData={tacticalData}
          errorMotifs={Array.from(errorMotifIds)}
          selectedMotifs={selectedMotifs}
          isAcademicMode={isAcademicMode}
        />
      </div>
    </div>
  );
};

export default TopicScopeCard;
