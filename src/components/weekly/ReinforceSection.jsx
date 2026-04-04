import React, { useMemo } from 'react';

const ReinforceSection = ({
  tacticalData,
  errorMotifs,
  selectedMotifs,
  isAcademicMode,
  selectedReinforceIds = [],
  onReinforceSelect
}) => {
  const allEncounters = tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];

  const activeMotifs = useMemo(() => {
    return allEncounters
      .filter(e => e.elo_score >= 1001)
      .sort((a, b) => a.elo_score - b.elo_score);
  }, [allEncounters]);

  const reinforcementMotifs = useMemo(() => {
    const excludedIds = new Set([
      ...errorMotifs,
      ...(selectedMotifs?.map(s => s.motifId) || [])
    ]);
    
    return activeMotifs
      .filter(m => !excludedIds.has(m.target_id))
      .slice(0, 4);
  }, [activeMotifs, errorMotifs, selectedMotifs]);

  return (
    <div className={`rounded-lg p-3 h-full flex flex-col ${
      isAcademicMode ? 'bg-orange-50 border border-orange-200' : 'bg-orange-900/10 border border-orange-800/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">🟠</span>
          <h3 className="font-bold text-xs">强化区</h3>
          {selectedReinforceIds.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
              isAcademicMode ? 'bg-orange-100 text-orange-600' : 'bg-orange-900/30 text-orange-400'
            }`}>
              已选 {selectedReinforceIds.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {reinforcementMotifs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {reinforcementMotifs.map(m => {
              const level = m.elo_score > 2500 ? 'L4' : m.elo_score > 1800 ? 'L3' : m.elo_score > 1000 ? 'L2' : 'L1';
              const isSelected = selectedReinforceIds.includes(m.target_id);
              
              return (
                <div
                  key={m.target_id}
                  onClick={() => onReinforceSelect && onReinforceSelect(m.target_id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-all ${
                    isSelected
                      ? (isAcademicMode 
                          ? 'bg-orange-200 border-2 border-orange-400 ring-2 ring-orange-200' 
                          : 'bg-orange-900/30 border-2 border-orange-500 ring-2 ring-orange-500/30')
                      : (isAcademicMode 
                          ? 'bg-white border border-orange-200 hover:border-orange-400' 
                          : 'bg-zinc-800 border border-orange-800/50 hover:border-orange-600')
                  }`}
                  title={`${m.target_name} - Elo: ${m.elo_score}${isSelected ? ' (已选择)' : ' (点击选择)'}`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                    isSelected
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : (isAcademicMode ? 'border-slate-300 bg-white' : 'border-zinc-600 bg-zinc-700')
                  }`}>
                    {isSelected && '✓'}
                  </span>
                  <span className="font-medium">{m.target_name}</span>
                  <span className={`px-1 rounded text-xs font-bold ${
                    level === 'L4' 
                      ? (isAcademicMode ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400')
                      : level === 'L3'
                        ? (isAcademicMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/30 text-purple-400')
                        : (isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400')
                  }`}>
                    {level}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-2 text-xs ${
            isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
          }`}>
            {activeMotifs.length === 0 
              ? '暂无激活'
              : '已覆盖'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReinforceSection;
