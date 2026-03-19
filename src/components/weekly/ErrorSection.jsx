import React, { useState, useMemo } from 'react';
import { getWeaponNameById } from '../../utils/weaponUtils';

const ErrorSection = ({
  errorNotebook,
  tacticalData,
  isAcademicMode,
  onImportError,
  onNavigateToErrorLibrary
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMotif, setSelectedMotif] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  const allEncounters = tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];

  const activeMotifs = useMemo(() => {
    return allEncounters.filter(e => e.elo_score >= 1001);
  }, [allEncounters]);

  const errorMotifs = useMemo(() => {
    const motifMap = new Map();
    const unresolvedErrors = errorNotebook?.filter(e => !e.resolved) || [];
    
    unresolvedErrors.forEach(err => {
      if (err.targetId) {
        if (!motifMap.has(err.targetId)) {
          const enc = allEncounters.find(e => e.target_id === err.targetId);
          motifMap.set(err.targetId, {
            motifId: err.targetId,
            motifName: enc?.target_name || err.targetId,
            errorCount: 0,
            sources: new Set(),
            suggestedWeapons: []
          });
        }
        const motif = motifMap.get(err.targetId);
        motif.errorCount++;
        if (err.source) motif.sources.add(err.source);
        
        const weapons = err.diagnosisDetails?.suggestedWeapons || 
                        err.diagnosis?.suggestedWeapons || [];
        weapons.forEach(w => {
          if (!motif.suggestedWeapons.includes(w)) {
            motif.suggestedWeapons.push(w);
          }
        });
      }
    });
    
    return Array.from(motifMap.values());
  }, [errorNotebook, allEncounters]);

  const errorCountBySource = useMemo(() => {
    const unresolvedErrors = errorNotebook?.filter(e => !e.resolved) || [];
    return {
      weekly: unresolvedErrors.filter(e => e.source === 'weekly').length,
      training: unresolvedErrors.filter(e => e.source === 'training').length,
      import: unresolvedErrors.filter(e => e.source === 'import').length,
      total: unresolvedErrors.length
    };
  }, [errorNotebook]);

  const handleImportConfirm = () => {
    if (!selectedMotif) return;
    onImportError({
      id: `import-${Date.now()}`,
      targetId: selectedMotif,
      targetName: activeMotifs.find(m => m.target_id === selectedMotif)?.target_name,
      diagnosis: diagnosis || '外部导入错题',
      source: 'import',
      addedAt: new Date().toISOString(),
      resolved: false
    });
    setSelectedMotif('');
    setDiagnosis('');
    setShowImportModal(false);
  };

  return (
    <>
      <div className={`rounded-lg p-3 h-full flex flex-col ${
        isAcademicMode ? 'bg-red-50 border border-red-200' : 'bg-red-900/10 border border-red-800/30'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🔴</span>
            <h3 className="font-bold text-xs">错题区</h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowImportModal(true)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                isAcademicMode 
                  ? 'bg-white border border-slate-200 hover:border-red-300 hover:text-red-600' 
                  : 'bg-zinc-800 border border-zinc-700 hover:border-red-500 hover:text-red-400'
              }`}
            >
              导入
            </button>
          </div>
        </div>

        <div 
          onClick={onNavigateToErrorLibrary}
          className={`cursor-pointer rounded p-2 mb-2 transition-colors ${
            isAcademicMode ? 'bg-white/50 hover:bg-white' : 'bg-zinc-800/50 hover:bg-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              待消灭错题
            </span>
            <span className={`text-lg font-bold ${isAcademicMode ? 'text-red-600' : 'text-red-400'}`}>
              {errorCountBySource.total}
            </span>
          </div>
          <div className="flex gap-1 mt-1">
            {errorCountBySource.weekly > 0 && (
              <span className={`text-xs px-1 rounded ${isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'}`}>
                周{errorCountBySource.weekly}
              </span>
            )}
            {errorCountBySource.training > 0 && (
              <span className={`text-xs px-1 rounded ${isAcademicMode ? 'bg-green-100 text-green-600' : 'bg-green-900/30 text-green-400'}`}>
                日{errorCountBySource.training}
              </span>
            )}
            {errorCountBySource.import > 0 && (
              <span className={`text-xs px-1 rounded ${isAcademicMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/30 text-purple-400'}`}>
                导{errorCountBySource.import}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {errorMotifs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {errorMotifs.map(motif => {
                const enc = allEncounters.find(e => e.target_id === motif.motifId);
                const elo = enc?.elo_score || 1000;
                const level = elo < 1100 ? 'L2' : elo < 1300 ? 'L3' : 'L4';
                return (
                  <div
                    key={motif.motifId}
                    className={`inline-flex flex-col gap-1 px-2 py-1.5 rounded text-xs ${
                      isAcademicMode 
                        ? 'bg-white border border-red-200' 
                        : 'bg-zinc-800 border border-red-800/50'
                    }`}
                    title={`${motif.motifName} - ${motif.errorCount} 道错题`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{motif.motifName}</span>
                      <span className={`px-1 rounded text-xs font-bold ${
                        level === 'L4' 
                          ? (isAcademicMode ? 'bg-amber-100 text-amber-600' : 'bg-amber-900/30 text-amber-400')
                          : level === 'L3'
                            ? (isAcademicMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/30 text-purple-400')
                            : (isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400')
                      }`}>
                        {level}
                      </span>
                      <span className={`px-1 rounded text-xs ${
                        isAcademicMode ? 'bg-red-100 text-red-500' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {motif.errorCount}
                      </span>
                    </div>
                    {motif.suggestedWeapons.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        {motif.suggestedWeapons.slice(0, 2).map(weaponId => {
                          const weaponName = getWeaponNameById(weaponId);
                          return weaponName ? (
                            <span 
                              key={weaponId}
                              className={`px-1 py-0.5 rounded text-xs ${
                                isAcademicMode 
                                  ? 'bg-indigo-100 text-indigo-600' 
                                  : 'bg-indigo-900/30 text-indigo-400'
                              }`}
                            >
                              🎯 {weaponName}
                            </span>
                          ) : null;
                        })}
                        {motif.suggestedWeapons.length > 2 && (
                          <span className={`text-xs ${
                            isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
                          }`}>
                            +{motif.suggestedWeapons.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-2 text-xs ${
              isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
            }`}>
              暂无错题
            </div>
          )}
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl ${
            isAcademicMode ? 'bg-white' : 'bg-zinc-800'
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-inherit">
              <h3 className="font-bold">导入错题</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedMotif('');
                  setDiagnosis('');
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
                }`}
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isAcademicMode ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  选择母题
                </label>
                <select
                  value={selectedMotif}
                  onChange={(e) => setSelectedMotif(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${
                    isAcademicMode 
                      ? 'bg-white border-slate-200' 
                      : 'bg-zinc-700 border-zinc-600'
                  }`}
                >
                  <option value="">请选择...</option>
                  {activeMotifs.map(m => (
                    <option key={m.target_id} value={m.target_id}>
                      {m.target_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isAcademicMode ? 'text-slate-600' : 'text-zinc-400'
                }`}>
                  错误诊断（可选）
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="描述错误原因..."
                  className={`w-full p-2 rounded-lg border ${
                    isAcademicMode 
                      ? 'bg-white border-slate-200' 
                      : 'bg-zinc-700 border-zinc-600'
                  }`}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-inherit">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedMotif('');
                  setDiagnosis('');
                }}
                className={`px-4 py-2 rounded-lg text-sm ${
                  isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
                }`}
              >
                取消
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={!selectedMotif}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  selectedMotif 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ErrorSection;
