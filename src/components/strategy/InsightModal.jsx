import React from 'react';
import { X, Lightbulb, AlertTriangle, Target, BookOpen, Zap, GitBranch, Eye, Atom, Link2 } from 'lucide-react';
import { markAsLearned } from '../../utils/weaponProgress';
import weaponDetails from '../../data/weapon_details.json';

const InsightModal = ({ weapon, isOpen, onClose }) => {
  if (!isOpen || !weapon) return null;

  const detail = weaponDetails[weapon.id];
  
  if (!detail) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 text-center"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-slate-500">正在加载解析内容...</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 rounded-lg text-slate-600"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  const coreLogic = detail.coreLogic || '暂无核心逻辑说明';
  const scenarios = detail.scenarios || [];
  const pitfalls = detail.pitfalls || [];
  const example = detail.example || {};
  const mnemonic = detail.mnemonic || '';
  const steps = detail.steps || [];
  const signals = detail.signals || [];
  const principle = detail.principle || '';
  const relatedWeapons = detail.relatedWeapons || [];

  const handleUnderstood = () => {
    if (weapon?.id) {
      markAsLearned(weapon.id);
    }
    onClose();
  };

  const getRelatedWeaponName = (id) => {
    const related = weaponDetails[id];
    if (related) {
      const match = related.coreLogic?.match(/^([^：]+)/);
      return match ? match[1] : id;
    }
    return id;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{weapon.name}</h2>
              <p className="text-xs text-slate-500">要点解析</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mnemonic && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-purple-800">口诀速记</h3>
              </div>
              <p className="text-purple-900 text-base font-medium leading-relaxed">"{mnemonic}"</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-blue-800">解题流程</h3>
                </div>
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-blue-900 pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {signals.length > 0 && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-green-800">识别信号</h3>
                </div>
                <ul className="space-y-2">
                  {signals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                      <span className="text-green-500 flex-shrink-0">•</span>
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {principle && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-amber-800">原理解析</h3>
              </div>
              <p className="text-amber-900 text-sm leading-relaxed">{principle}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pitfalls.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-red-800">避坑指南</h3>
                </div>
                <ul className="space-y-2">
                  {pitfalls.map((pitfall, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-red-900">
                      <span className="text-red-500 flex-shrink-0">⚠️</span>
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {scenarios.length > 0 && (
              <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-cyan-500" />
                  <h3 className="font-bold text-cyan-800">使用场景</h3>
                </div>
                <ul className="space-y-2">
                  {scenarios.slice(0, 4).map((scenario, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-cyan-900">
                      <span className="w-5 h-5 rounded-full bg-cyan-200 text-cyan-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{scenario}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {example.question && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-800">经典例题</h3>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200 mb-3">
                <p className="text-sm text-slate-700">{example.question}</p>
              </div>
              {example.solution && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs font-medium text-green-700 mb-1">解析：</p>
                  <p className="text-sm text-green-900 whitespace-pre-line">{example.solution}</p>
                </div>
              )}
            </div>
          )}

          {relatedWeapons.length > 0 && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-indigo-800">相关杀手锏</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedWeapons.map((id, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {getRelatedWeaponName(id)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleUnderstood}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
          >
            我已理解
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightModal;
