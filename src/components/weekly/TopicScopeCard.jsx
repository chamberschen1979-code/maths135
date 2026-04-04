import React, { useMemo, useState, useEffect } from 'react';
import ErrorSection from './ErrorSection';
import CustomSection from './CustomSection';

const TopicScopeCard = ({
  errorNotebook,
  tacticalData,
  selectedMotifs,
  onSelectionChange,
  isAcademicMode,
  onAllSelectedChange
}) => {
  const [selectedErrorIds, setSelectedErrorIds] = useState([]);

  const allEncounters = tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];

  const errorMotifIds = useMemo(() => {
    const ids = new Set();
    errorNotebook?.filter(e => !e.resolved).forEach(err => {
      if (err.targetId) ids.add(err.targetId);
    });
    return ids;
  }, [errorNotebook]);

  const allSelectedMotifs = useMemo(() => {
    const motifSet = new Set();
    
    selectedErrorIds.forEach(id => motifSet.add(id));
    selectedMotifs?.forEach(s => motifSet.add(s.motifId));
    
    return Array.from(motifSet);
  }, [selectedErrorIds, selectedMotifs]);

  useEffect(() => {
    if (onAllSelectedChange) {
      onAllSelectedChange(allSelectedMotifs);
    }
  }, [allSelectedMotifs, onAllSelectedChange]);

  const handleErrorSelect = (motifId) => {
    setSelectedErrorIds(prev => 
      prev.includes(motifId) 
        ? prev.filter(id => id !== motifId)
        : [...prev, motifId]
    );
  };

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

      <div className="grid grid-cols-2 gap-3">
        <ErrorSection
          errorNotebook={errorNotebook}
          tacticalData={tacticalData}
          isAcademicMode={isAcademicMode}
          selectedErrorIds={selectedErrorIds}
          onErrorSelect={handleErrorSelect}
        />

        <CustomSection
          tacticalData={tacticalData}
          errorMotifs={Array.from(errorMotifIds)}
          selectedMotifs={selectedMotifs}
          onSelectionChange={onSelectionChange}
          isAcademicMode={isAcademicMode}
        />
      </div>
    </div>
  );
};

export default TopicScopeCard;
