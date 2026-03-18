import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const RecommendedNextPanel = ({ recommendations, isAcademicMode, onTrain }) => {
  if (recommendations.length === 0) return null;

  const getLevelLightColor = (levelStatus) => {
    if (!levelStatus.exists) return 'bg-slate-300 dark:bg-zinc-600';
    if (levelStatus.isMastered === true) return 'bg-green-500';
    if (levelStatus.isMastered === false) return 'bg-red-500';
    return 'bg-slate-300 dark:bg-zinc-600';
  };

  const getLevelLightBorder = (levelStatus) => {
    if (!levelStatus.exists) return 'border-slate-300 dark:border-zinc-600';
    if (levelStatus.isMastered === true) return 'border-green-500';
    if (levelStatus.isMastered === false) return 'border-red-500';
    return 'border-slate-300 dark:border-zinc-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {recommendations.map((item, index) => (
        <div 
          key={index}
          onClick={() => onTrain && onTrain(item)}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            isAcademicMode 
              ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm' 
              : 'bg-zinc-800 border-zinc-700 hover:border-blue-500'
          }`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                {item.motifId}
              </span>
              <span className={`font-bold text-base ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                {item.motifName}
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-1 h-4 rounded-full ${isAcademicMode ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
                <span className={`text-sm font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                  {item.varName}
                </span>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {['L2', 'L3', 'L4'].map(lvl => {
                  const levelStatuses = item.levelStatuses || {};
                  const ls = levelStatuses[lvl] || { exists: false, isMastered: null, streak: 0 };
                  if (!ls.exists && lvl !== item.level) return null;
                  
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
                              i <= (ls.streak || 0)
                                ? 'bg-blue-500'
                                : (isAcademicMode ? 'bg-slate-200' : 'bg-zinc-600')
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-bold ${ls.streak > 0 ? 'text-blue-500' : (isAcademicMode ? 'text-slate-400' : 'text-zinc-500')}`}>
                        {ls.streak || 0}/3
                      </span>
                    </div>
                  );
                })}
                
                <ChevronRight className={`w-5 h-5 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecommendedNextPanel;
