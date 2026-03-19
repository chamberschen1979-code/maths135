import React from 'react';
import { Lock, CheckCircle, PenTool, Target } from 'lucide-react';

const KillerMoveCard = ({ weapon, onNavigate, onStartCertification, tacticalData }) => {
  const status = weapon._userState?.status || 'LOCKED'; 
  const progress = weapon._userState?.progress || 0;
  
  const isLocked = status === 'LOCKED';
  const isCertified = status === 'CERTIFIED';
  const isTraining = status === 'UNLOCKED';

  const handleCardClick = () => {
    if (isLocked) return;
    
    if (isCertified) {
      if (weapon.linked_motifs && weapon.linked_motifs.length > 0) {
        onNavigate('dashboard', { highlight: weapon.linked_motifs[0].id });
      }
    } else {
      onStartCertification(weapon);
    }
  };

  const linkedMotifs = weapon.linked_motifs || [];

  return (
    <div 
      onClick={handleCardClick}
      className={`relative group rounded-xl border p-5 transition-all duration-300 overflow-hidden flex flex-col h-48
        ${isLocked 
          ? 'bg-slate-50 border-slate-200 opacity-60 blur-[0.5px] cursor-not-allowed grayscale select-none' 
          : 'bg-white border-slate-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 cursor-pointer'
        }
      `}
    >
      {/* 顶部：ID 与状态徽章 */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
          {weapon.id}
        </span>
        
        <div className="flex items-center gap-2">
          {isCertified && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <CheckCircle size={18} className="text-green-500" />
              <span>已认证</span>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
              <Lock size={12} />
              <span>未解锁</span>
            </div>
          )}
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
            weapon.rank === 'killer' 
              ? 'bg-red-100 text-red-700 border-red-200' 
              : weapon.rank === 'advanced'
                ? 'bg-purple-100 text-purple-700 border-purple-200'
                : 'bg-blue-100 text-blue-700 border-blue-200'
          }`}>
            {weapon.rank === 'killer' ? '杀手锏' : weapon.rank === 'advanced' ? '进阶' : '基础'}
          </span>
        </div>
      </div>

      {/* 中部：核心内容 */}
      <div className="flex-grow">
        <h3 className={`text-base font-bold mb-1.5 leading-tight ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
          {weapon.name}
        </h3>
        
        <p className={`text-xs mb-2 line-clamp-2 ${isLocked ? 'text-slate-400' : 'text-slate-600'}`}>
          {weapon.description}
        </p>
      </div>

      {/* 底部：母题场景 + 认证按钮 (同一行) */}
      <div className="flex justify-between items-end pt-2 border-t border-slate-100">
        {/* 左侧：适用母题场景 */}
        <div className="flex flex-wrap gap-1.5">
          {linkedMotifs.length > 0 ? (
            linkedMotifs.slice(0, 2).map(motif => (
              <button
                key={motif.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('dashboard', { highlight: motif.id });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all border ${
                  isLocked
                    ? 'bg-slate-100 border-slate-200 text-slate-400'
                    : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-200'
                } cursor-pointer`}
              >
                <Target size={12} />
                <span className="font-mono font-bold">{motif.id}</span>
                <span className="truncate max-w-[60px]">{motif.title}</span>
              </button>
            ))
          ) : (
            <span className="text-xs text-slate-400">暂无关联母题</span>
          )}
        </div>

        {/* 右侧：去认证按钮或已认证印章 */}
        {!isLocked && (
          isCertified ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle size={20} className="text-green-500" />
            </div>
          ) : isTraining && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onStartCertification(weapon);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <PenTool size={14} />
              去认证
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default KillerMoveCard;
