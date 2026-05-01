import React, { useState, useMemo } from 'react';
import { getWeaponNameById } from '../../utils/weaponUtils';
import { getCooldownRemainingDays, isInCooldown } from '../../utils/questionStateManager';

const ErrorSection = ({
  errorNotebook,
  tacticalData,
  isAcademicMode,
  selectedErrorIds = [],
  onErrorSelect
}) => {
  const allEncounters = useMemo(() => {
    return tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];
  }, [tacticalData]);

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
            suggestedWeapons: [],
            currentElo: enc?.elo_score || 1000
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

  return (
    <div className={`rounded-lg p-3 h-full flex flex-col ${
      isAcademicMode ? 'bg-red-50 border border-red-200' : 'bg-red-900/10 border border-red-800/30'
    }`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">🔴</span>
        <h3 className="font-bold text-xs">错题区</h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
          isAcademicMode ? 'bg-red-100 text-red-600' : 'bg-red-900/30 text-red-400'
        }`}>
          {errorMotifs.length} 个母题
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {errorMotifs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {errorMotifs.map(motif => {
              const elo = motif.currentElo || 1000;
              const level = elo >= 2501 ? 'L4' : elo >= 1801 ? 'L3' : elo >= 1001 ? 'L2' : 'L1';
              
              const motifErrors = errorNotebook?.filter(e => e.targetId === motif.motifId && !e.resolved) || [];
              const latestError = motifErrors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
              const questionId = latestError?.id;
              const inCooldown = questionId ? isInCooldown(questionId) : false;
              const remainingDays = questionId ? getCooldownRemainingDays(questionId) : 0;
              
              const isSelected = selectedErrorIds.includes(motif.motifId);
              
              return (
                <div
                  key={motif.motifId}
                  onClick={() => onErrorSelect && onErrorSelect(motif.motifId)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-pointer transition-all ${
                    isSelected
                      ? (isAcademicMode 
                          ? 'bg-red-100 border-2 border-red-400 ring-2 ring-red-200' 
                          : 'bg-red-900/30 border-2 border-red-500 ring-2 ring-red-500/30')
                      : (isAcademicMode 
                          ? 'bg-white border border-red-200 hover:border-red-400' 
                          : 'bg-zinc-800 border border-red-800/50 hover:border-red-600')
                  }`}
                  title={`${motif.motifName} - ${motif.errorCount} 道错题${isSelected ? ' (已选择)' : ' (点击选择)'}`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                    isSelected
                      ? 'bg-red-500 border-red-500 text-white'
                      : (isAcademicMode ? 'border-slate-300 bg-white' : 'border-zinc-600 bg-zinc-700')
                  }`}>
                    {isSelected && '✓'}
                  </span>
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
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-4 text-xs ${
            isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
          }`}>
            暂无错题
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorSection;
