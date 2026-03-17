import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const ProgressTree = ({ progressTree, isAcademicMode, onVariantClick }) => {
  const [expandedMotifs, setExpandedMotifs] = useState(new Set());

  const toggleMotif = (motifId) => {
    setExpandedMotifs(prev => {
      const next = new Set(prev);
      if (next.has(motifId)) next.delete(motifId);
      else next.add(motifId);
      return next;
    });
  };

  const getLevelLightColor = (levelStatus) => {
    if (!levelStatus.exists) return 'bg-slate-300 dark:bg-zinc-600';
    if (levelStatus.isMastered) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getLevelLightBorder = (levelStatus) => {
    if (!levelStatus.exists) return 'border-slate-300 dark:border-zinc-600';
    if (levelStatus.isMastered) return 'border-green-500';
    return 'border-red-500';
  };

  const getMotifLevelColor = (level) => {
    if (level === 'L4') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    if (level === 'L3') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
    if (level === 'L2') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="space-y-4 pb-20">
      {progressTree.map(motif => {
        const isExpanded = expandedMotifs.has(motif.motifId);
        const statusColor = motif.progress === 1 ? 'bg-green-500' : 'bg-blue-500';

        return (
          <div key={motif.motifId} className={`rounded-xl border overflow-hidden transition-all ${isAcademicMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800 shadow-md'}`}>
            
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => toggleMotif(motif.motifId)}
            >
              <div className="flex items-center gap-3 flex-1">
                {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                
                <span className={`text-xs font-mono ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                  {motif.motifId}
                </span>
                
                <span className={`font-bold text-base ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                  {motif.motifName}
                </span>
                
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getMotifLevelColor(motif.level)}`}>
                  {motif.level}
                </span>
                
                <span className="text-xs text-slate-500 dark:text-zinc-400">Elo {motif.elo}</span>
              </div>

              <div className="w-24 sm:w-32 ml-4 flex flex-col items-end">
                <span className={`text-xs font-bold mb-1 ${statusColor.replace('bg-', 'text-')}`}>
                  {Math.round(motif.progress * 100)}%
                </span>
                <div className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className={`h-full ${statusColor} transition-all duration-500`} style={{ width: `${motif.progress * 100}%` }} />
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className={`border-t ${isAcademicMode ? 'border-slate-100 bg-slate-50/50' : 'border-zinc-800 bg-zinc-900/50'} p-5`}>
                <div className="space-y-6">
                  {motif.specialties && motif.specialties.length > 0 ? (
                    motif.specialties.map((spec, idx) => (
                      <div key={idx}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-1 h-4 rounded-full ${isAcademicMode ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
                          <h3 className={`text-sm font-bold uppercase tracking-wider ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                            {spec.specName}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3">
                          {spec.variants.map(variant => (
                            <div 
                              key={variant.varId}
                              className={`p-4 rounded-lg border transition-all ${
                                isAcademicMode 
                                  ? 'bg-white border-slate-200 hover:border-blue-300' 
                                  : 'bg-zinc-800 border-zinc-700 hover:border-blue-600'
                              } hover:shadow-sm`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <span className={`text-sm font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                                  {variant.varName}
                                </span>
                                
                                <div className="flex items-center gap-3 flex-wrap">
                                  {['L2', 'L3', 'L4'].map(lvl => {
                                    const ls = variant.levelStatuses[lvl];
                                    if (!ls.exists) return null;
                                    
                                    return (
                                      <div key={lvl} className="flex items-center gap-1.5">
                                        <div className={`w-5 h-5 rounded-full border-2 ${getLevelLightColor(ls)} ${getLevelLightBorder(ls)} flex items-center justify-center`}>
                                          <span className="text-[10px] font-bold text-white">
                                            {lvl}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-0.5">
                                          {[1, 2, 3].map(i => (
                                            <div 
                                              key={i}
                                              className={`w-1.5 h-3 rounded-sm transition-all ${
                                                i <= ls.streak 
                                                  ? 'bg-blue-500' 
                                                  : (isAcademicMode ? 'bg-slate-200' : 'bg-zinc-600')
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className={`text-xs font-bold ${ls.streak > 0 ? 'text-blue-500' : (isAcademicMode ? 'text-slate-400' : 'text-zinc-500')}`}>
                                          {ls.streak}/3
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`text-center py-4 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                      暂无专项数据
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressTree;
