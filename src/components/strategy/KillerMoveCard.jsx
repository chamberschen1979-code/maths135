import React from 'react';
import { Lock, CheckCircle, Target } from 'lucide-react';
import { isLearned } from '../../utils/weaponProgress';

const KillerMoveCard = ({ 
  weapon, 
  onNavigate, 
  onStartCertification, 
  onOpenInsight,
  tacticalData 
}) => {
  const status = weapon._userState?.status || 'LOCKED'; 
  const hasLearned = isLearned(weapon.id);
  
  const isLocked = status === 'LOCKED';
  const isCertified = status === 'CERTIFIED';

  const linkedMotifs = weapon.linked_motifs || [];

  return (
    <div 
      className={`relative group rounded-xl border p-4 transition-all duration-300 overflow-hidden flex flex-col h-44
        ${isLocked 
          ? 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed' 
          : 'bg-white border-slate-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1'
        }
      `}
    >
      {/* 顶部：ID 与状态徽章 */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          {weapon.id}
        </span>
        
        <div className="flex items-center gap-1.5">
          {isCertified && (
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
              <CheckCircle size={12} />
              <span>已认证</span>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full">
              <Lock size={10} />
              <span>未解锁</span>
            </div>
          )}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
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
        <h3 className={`text-sm font-bold mb-1 leading-tight ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
          {weapon.name}
        </h3>
        
        <p className={`text-[11px] mb-2 line-clamp-2 ${isLocked ? 'text-slate-400' : 'text-slate-600'}`}>
          {weapon.description}
        </p>
      </div>

      {/* 底部：母题场景 + 双按钮 (强制修复版) */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center w-full gap-2">
        
        {/* 左侧：适用母题场景 */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {linkedMotifs.length > 0 ? (
            linkedMotifs.slice(0, 2).map(motif => (
              <span 
                key={motif.id} 
                className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 whitespace-nowrap flex-shrink-0"
              >
                <Target size={10} className="flex-shrink-0" />
                <span className="font-mono font-bold">{motif.id}</span>
                <span className="text-indigo-500 hidden sm:inline truncate max-w-[60px]">{motif.title?.replace(/^[M\d]+\s*/, '')}</span>
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-300">暂无关联母题</span>
          )}
        </div>

        {/* 右侧：双按钮组 (核心修复) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          
          {/* 按钮 1: 要点解析 (必须显示) */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log("点击要点解析", weapon.id);
              onOpenInsight?.(weapon);
            }}
            className={`flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-bold rounded-md border transition-all whitespace-nowrap shadow-sm 
              ${hasLearned 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'} 
            `}
            style={{ minWidth: '60px' }}
          >
            {hasLearned ? '👁 已读' : '📖 要点'}
          </button>

          {/* 按钮 2: 去认证 */}
          {isCertified ? (
            <div className="flex items-center justify-center gap-1 px-2 py-1.5 bg-green-100 text-green-700 text-[11px] font-bold rounded-md border border-green-200 whitespace-nowrap">
              ✓ 已掌握
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                console.log("点击去认证", weapon.id);
                onStartCertification(weapon);
              }}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-md shadow-md hover:bg-slate-800 transition-all whitespace-nowrap"
              style={{ minWidth: '60px' }}
            >
              ⚔️ 认证
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KillerMoveCard;
