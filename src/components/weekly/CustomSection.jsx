import React, { useState, useMemo } from 'react';

const CustomSection = ({
  tacticalData,
  errorMotifs,
  selectedMotifs,
  onSelectionChange,
  isAcademicMode
}) => {
  const [showModal, setShowModal] = useState(false);
  const [expandedMotifs, setExpandedMotifs] = useState(new Set());

  const allEncounters = tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];

  const activeMotifs = useMemo(() => {
    return allEncounters.filter(e => e.elo_score >= 1001);
  }, [allEncounters]);

  const availableMotifs = useMemo(() => {
    const errorMotifIds = new Set(errorMotifs);
    return activeMotifs.filter(m => !errorMotifIds.has(m.target_id));
  }, [activeMotifs, errorMotifs]);

  const toggleExpand = (motifId) => {
    setExpandedMotifs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(motifId)) {
        newSet.delete(motifId);
      } else {
        newSet.add(motifId);
      }
      return newSet;
    });
  };

  const isItemSelected = (motifId, specId = null) => {
    return selectedMotifs?.some(s => s.motifId === motifId && s.specId === specId);
  };

  const handleToggleItem = (motifId, motifName, specId = null, specName = null) => {
    const currentSelection = selectedMotifs || [];
    const exists = currentSelection.some(s => s.motifId === motifId && s.specId === specId);
    
    if (exists) {
      onSelectionChange(currentSelection.filter(s => !(s.motifId === motifId && s.specId === specId)));
    } else {
      onSelectionChange([...currentSelection, { 
        motifId, 
        motifName,
        specId, 
        specName 
      }]);
    }
  };

  const handleRemoveItem = (motifId, specId = null) => {
    onSelectionChange(selectedMotifs?.filter(s => !(s.motifId === motifId && s.specId === specId)) || []);
  };

  const getDisplayLabel = (item) => {
    const motif = activeMotifs.find(m => m.target_id === item.motifId);
    const elo = motif?.elo_score || 1000;
    const level = elo < 1100 ? 'L2' : elo < 1300 ? 'L3' : 'L4';
    if (item.specId && item.specName) {
      return `${motif?.target_name || item.motifId} · ${item.specName} · ${level}`;
    }
    return `${motif?.target_name || item.motifId} · ${level}`;
  };

  return (
    <>
      <div className={`rounded-lg p-3 h-full flex flex-col ${
        isAcademicMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/10 border border-blue-800/30'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🔵</span>
            <h3 className="font-bold text-xs">自选区</h3>
            {selectedMotifs?.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'
              }`}>
                {selectedMotifs.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              isAcademicMode 
                ? 'bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600' 
                : 'bg-zinc-800 border border-zinc-700 hover:border-blue-500 hover:text-blue-400'
            }`}
          >
            选择
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedMotifs?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedMotifs.map((sel, idx) => (
                <div
                  key={`${sel.motifId}-${sel.specId || 'all'}-${idx}`}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isAcademicMode 
                      ? 'bg-white border border-blue-200' 
                      : 'bg-zinc-800 border border-blue-800/50'
                  }`}
                  title={getDisplayLabel(sel)}
                >
                  <span className="font-medium">{getDisplayLabel(sel)}</span>
                  <button
                    onClick={() => handleRemoveItem(sel.motifId, sel.specId)}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                      isAcademicMode ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-zinc-700 text-zinc-500'
                    }`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-2 text-xs ${
              isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
            }`}>
              点击选择
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg max-h-[80vh] rounded-xl flex flex-col ${
            isAcademicMode ? 'bg-white' : 'bg-zinc-800'
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-inherit">
              <h3 className="font-bold">选择母题/专项</h3>
              <button
                onClick={() => setShowModal(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
                }`}
              >
                ×
              </button>
            </div>

            <div className="p-4 border-b border-inherit">
              <p className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                选择激活母题（Elo ≥ 1001）或其专项进行训练
              </p>
              <p className={`text-xs mt-1 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                已选择 {selectedMotifs?.length || 0} 项
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {availableMotifs.length > 0 ? (
                <div className="space-y-2">
                  {availableMotifs.map(m => {
                    const isExpanded = expandedMotifs.has(m.target_id);
                    const hasSpecialties = m.specialties && m.specialties.length > 0;
                    const motifSelected = isItemSelected(m.target_id, null);
                    
                    return (
                      <div key={m.target_id} className={`rounded-lg border ${
                        isAcademicMode ? 'border-slate-200' : 'border-zinc-600'
                      }`}>
                        <div className={`flex items-center gap-2 p-3 ${
                          motifSelected 
                            ? (isAcademicMode ? 'bg-blue-50' : 'bg-blue-900/20')
                            : ''
                        }`}>
                          <input
                            type="checkbox"
                            checked={motifSelected}
                            onChange={() => handleToggleItem(m.target_id, m.target_name, null, null)}
                            className="w-4 h-4 rounded"
                          />
                          <div 
                            className="flex-1 flex items-center justify-between cursor-pointer"
                            onClick={() => hasSpecialties && toggleExpand(m.target_id)}
                          >
                            <div>
                              <div className="font-medium text-sm">{m.target_name}</div>
                              <div className={`text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                                Elo: {m.elo_score}
                              </div>
                            </div>
                            {hasSpecialties && (
                              <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''} ${
                                isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
                              }`}>
                                ▼
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && hasSpecialties && (
                          <div className={`border-t ${isAcademicMode ? 'border-slate-100' : 'border-zinc-700'}`}>
                            {m.specialties.flatMap(spec => 
                              (spec.variations || []).map(v => {
                                const benchmarkId = `${m.target_id}_${spec.spec_id}_${v.var_id}`;
                                const subSelected = isItemSelected(m.target_id, benchmarkId);
                                return (
                                  <div 
                                    key={benchmarkId}
                                    className={`flex items-center gap-2 px-3 py-2 pl-8 ${
                                      subSelected 
                                        ? (isAcademicMode ? 'bg-blue-50/50' : 'bg-blue-900/10')
                                        : (isAcademicMode ? 'hover:bg-slate-50' : 'hover:bg-zinc-700/50')
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={subSelected}
                                      onChange={() => handleToggleItem(m.target_id, m.target_name, benchmarkId, v.name)}
                                      className="w-3.5 h-3.5 rounded"
                                    />
                                    <div className="flex-1">
                                      <span className="text-sm">{v.name}</span>
                                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                        isAcademicMode ? 'bg-slate-100 text-slate-500' : 'bg-zinc-700 text-zinc-400'
                                      }`}>
                                        {spec.spec_name}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-8 ${
                  isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
                }`}>
                  {activeMotifs.length === 0 
                    ? '暂无激活母题（Elo ≥ 1001）'
                    : '所有激活母题已在错题区'}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-inherit">
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
                }`}
              >
                取消
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomSection;
