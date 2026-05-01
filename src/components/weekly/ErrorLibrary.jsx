import React, { useState, useMemo } from 'react';
import ManualEntryModal from './ManualEntryModal';
import { useUserProgress } from '../../context/UserProgressContext';

const ErrorLibrary = ({
  errorNotebook,
  setErrorNotebook,
  tacticalData,
  isAcademicMode,
  onClose
}) => {
  const { removeFromUserPool } = useUserProgress();
  const [filter, setFilter] = useState('all');
  const [selectedError, setSelectedError] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryErrorId, setEntryErrorId] = useState(null);

  const allEncounters = tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];

  const filteredErrors = useMemo(() => {
    let errors = errorNotebook || [];
    
    if (filter === 'unresolved') {
      errors = errors.filter(e => !e.resolved);
    } else if (filter === 'resolved') {
      errors = errors.filter(e => e.resolved);
    } else if (['weekly', 'photo', 'import'].includes(filter)) {
      errors = errors.filter(e => e.source === filter);
    }
    
    return errors.sort((a, b) => new Date(b.addedAt || b.createdAt) - new Date(a.addedAt || a.createdAt));
  }, [errorNotebook, filter]);

  const errorStats = useMemo(() => {
    const all = errorNotebook || [];
    return {
      total: all.length,
      unresolved: all.filter(e => !e.resolved).length,
      resolved: all.filter(e => e.resolved).length,
      weekly: all.filter(e => e.source === 'weekly').length,
      photo: all.filter(e => e.source === 'photo').length,
      import: all.filter(e => e.source === 'import').length
    };
  }, [errorNotebook]);

  const getMotifInfo = (targetId) => {
    const enc = allEncounters.find(e => e.target_id === targetId);
    return {
      name: enc?.target_name || targetId,
      zone: enc?.zone || '未知区域'
    };
  };

  const getWeaponMatch = (targetId) => {
    const enc = allEncounters.find(e => e.target_id === targetId);
    if (!enc) return '未匹配';
    
    const map = tacticalData?.tactical_maps?.find(m => 
      m.encounters?.some(e => e.target_id === targetId)
    );
    return map?.weapon_name || '未匹配';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getSourceLabel = (source) => {
    const labels = {
      weekly: { text: '周任务', color: 'blue' },
      photo: { text: '错题导入', color: 'purple' },
      import: { text: '导入', color: 'purple' }
    };
    return labels[source] || { text: source || '未知', color: 'gray' };
  };

  const getDifficultyColor = (level) => {
    if (level === 'L4') return isAcademicMode ? 'bg-amber-100 text-amber-700' : 'bg-amber-900/30 text-amber-400';
    if (level === 'L3') return isAcademicMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-900/30 text-purple-400';
    return isAcademicMode ? 'bg-green-100 text-green-700' : 'bg-green-900/30 text-green-400';
  };

  const handleResolveError = (errorId) => {
    setErrorNotebook(prev => prev.map(e => 
      e.id === errorId 
        ? { ...e, resolved: true, resolvedAt: new Date().toISOString() }
        : e
    ));
    setSelectedError(null);
  };

  const handleUnresolveError = (errorId) => {
    setErrorNotebook(prev => prev.map(e => 
      e.id === errorId 
        ? { ...e, resolved: false, resolvedAt: null }
        : e
    ));
  };

  const handleDeleteError = (errorId) => {
    setErrorNotebook(prev => prev.filter(e => e.id !== errorId));
    setSelectedError(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between p-4 border-b ${
        isAcademicMode ? 'border-slate-200 bg-white' : 'border-zinc-700 bg-zinc-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <h2 className="font-bold text-lg">错题库</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isAcademicMode ? 'bg-red-100 text-red-600' : 'bg-red-900/30 text-red-400'
          }`}>
            待消灭 {errorStats.unresolved}
          </span>
        </div>
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
          }`}
        >
          ×
        </button>
      </div>

      <div className={`flex gap-2 p-3 overflow-x-auto ${
        isAcademicMode ? 'bg-slate-50' : 'bg-zinc-900'
      }`}>
        {[
          { key: 'all', label: `全部 (${errorStats.total})` },
          { key: 'unresolved', label: `待消灭 (${errorStats.unresolved})` },
          { key: 'resolved', label: `已消灭 (${errorStats.resolved})` },
          { key: 'photo', label: `错题导入 (${errorStats.photo})` },
          { key: 'weekly', label: `周任务 (${errorStats.weekly})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
              filter === tab.key
                ? isAcademicMode 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-600 text-white'
                : isAcademicMode
                  ? 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-blue-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredErrors.length === 0 ? (
          <div className={`text-center py-12 ${
            isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
          }`}>
            <span className="text-4xl mb-2 block">📭</span>
            <p className="text-sm">暂无错题记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredErrors.map(error => {
              const motifInfo = getMotifInfo(error.targetId);
              const sourceInfo = getSourceLabel(error.source);
              const difficulty = error.level || 'L2';
              
              const questionPreview = error.question 
                ? (error.question.length > 50 ? error.question.substring(0, 50) + '...' : error.question)
                : '暂无题目内容';
              
              let locationInfo = error.motifName || motifInfo.name;
              if (error.specId || error.specName) {
                locationInfo += ' → ' + (error.specId || '') + (error.specName ? ' ' + error.specName : '');
              }
              if (error.varId || error.varName) {
                locationInfo += ' → ' + (error.varId || '') + (error.varName ? ' ' + error.varName : '');
              }
              
              const isEntered = error.enteredToPool;
              
              return (
                <div
                  key={error.id}
                  className={`p-2.5 rounded-lg transition-all ${
                    error.resolved
                      ? isAcademicMode 
                        ? 'bg-green-50 border border-green-200 opacity-75' 
                        : 'bg-green-900/10 border border-green-800/30 opacity-75'
                      : isAcademicMode
                        ? 'bg-white border border-slate-200'
                        : 'bg-zinc-800 border border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div 
                      onClick={() => setSelectedError(error)}
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    >
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getDifficultyColor(difficulty)}`}>
                        {difficulty}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${
                        sourceInfo.color === 'blue' 
                          ? isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'
                          : isAcademicMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/30 text-purple-400'
                      }`}>
                        {sourceInfo.text}
                      </span>
                      {error.resolved && (
                        <span className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${
                          isAcademicMode ? 'bg-green-100 text-green-600' : 'bg-green-900/30 text-green-400'
                        }`}>
                          ✓
                        </span>
                      )}
                      <span className={`flex-1 truncate min-w-0 ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                        {questionPreview}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs whitespace-nowrap ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                        {formatDate(error.addedAt)}
                      </span>
                      <span className={`text-xs whitespace-nowrap ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                        📍 {locationInfo}
                      </span>
                      {isEntered ? (
                        <>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isAcademicMode ? 'bg-green-100 text-green-600' : 'bg-green-900/30 text-green-400'
                          }`}>
                            已入库
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (error.enteredQuestionId) {
                                removeFromUserPool(error.enteredQuestionId);
                                setErrorNotebook(prev => prev.map(e => 
                                  e.id === error.id 
                                    ? { ...e, enteredToPool: false, enteredQuestionId: null }
                                    : e
                                ));
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              isAcademicMode 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                            }`}
                          >
                            撤回
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedError(error);
                            setShowEntryModal(true);
                          }}
                          className="px-2 py-1 rounded text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          📥 入库
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl ${
            isAcademicMode ? 'bg-white' : 'bg-zinc-800'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              isAcademicMode ? 'border-slate-200' : 'border-zinc-700'
            }`}>
              <h3 className="font-bold">错题详情</h3>
              <button
                onClick={() => setSelectedError(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
                }`}
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-3">
              {selectedError.question && (
                <div>
                  <label className={`text-xs font-medium ${
                    isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                  }`}>
                    题目内容
                  </label>
                  <p className={`text-sm mt-1 p-2 rounded ${
                    isAcademicMode ? 'bg-slate-100 text-slate-700' : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {selectedError.question}
                  </p>
                </div>
              )}

              <div>
                <label className={`text-xs font-medium ${
                  isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  所属位置
                </label>
                <p className={`font-medium text-sm ${
                  isAcademicMode ? 'text-slate-800' : 'text-zinc-200'
                }`}>
                  📍 {selectedError.motifName || getMotifInfo(selectedError.targetId).name}
                  {(selectedError.specId || selectedError.specName) && (
                    <span> → {selectedError.specId || ''}{selectedError.specName ? ' ' + selectedError.specName : ''}</span>
                  )}
                  {(selectedError.varId || selectedError.varName) && (
                    <span> → {selectedError.varId || ''}{selectedError.varName ? ' ' + selectedError.varName : ''}</span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-medium ${
                    isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                  }`}>
                    难度
                  </label>
                  <p className={`text-sm font-medium ${getDifficultyColor(selectedError.level || 'L2')}`}>
                    {selectedError.level || 'L2'}
                  </p>
                </div>
                <div>
                  <label className={`text-xs font-medium ${
                    isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                  }`}>
                    来源
                  </label>
                  <p className={isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}>
                    {getSourceLabel(selectedError.source).text}
                  </p>
                </div>
              </div>

              <div>
                <label className={`text-xs font-medium ${
                  isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  答案
                </label>
                <p className={`text-sm mt-1 p-2 rounded ${
                  isAcademicMode ? 'bg-green-50 text-green-700' : 'bg-green-900/20 text-green-400'
                }`}>
                  {selectedError.correctAnswer || selectedError.answer || '暂无'}
                </p>
              </div>

              <div>
                <label className={`text-xs font-medium ${
                  isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  解析要点
                </label>
                {selectedError.keyPoints && selectedError.keyPoints.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {selectedError.keyPoints.map((point, idx) => (
                      <p key={idx} className={`text-xs ${
                        isAcademicMode ? 'text-slate-600' : 'text-zinc-300'
                      }`}>
                        {point}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                    暂无
                  </p>
                )}
              </div>

              {selectedError.resolved && selectedError.resolvedAt && (
                <div>
                  <label className={`text-xs font-medium ${
                    isAcademicMode ? 'text-green-500' : 'text-green-400'
                  }`}>
                    消灭时间
                  </label>
                  <p className={isAcademicMode ? 'text-green-600' : 'text-green-400'}>
                    {formatDate(selectedError.resolvedAt)}
                  </p>
                </div>
              )}
            </div>

            <div className={`flex gap-2 p-4 border-t ${
              isAcademicMode ? 'border-slate-200' : 'border-zinc-700'
            }`}>
              <button
                onClick={() => handleDeleteError(selectedError.id)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                  isAcademicMode 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                }`}
              >
                删除
              </button>
              
              {entryErrorId === selectedError.id ? (
                <span className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                  isAcademicMode ? 'bg-green-100 text-green-600' : 'bg-green-900/30 text-green-400'
                }`}>
                  ✓ 已入库
                  <button
                    onClick={() => setEntryErrorId(null)}
                    className="ml-2 underline hover:no-underline"
                  >
                    撤回
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => {
                    setShowEntryModal(true);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  📥 入库
                </button>
              )}
              
              {selectedError.resolved ? (
                <button
                  onClick={() => handleUnresolveError(selectedError.id)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                    isAcademicMode 
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  标记为未消灭
                </button>
              ) : (
                <button
                  onClick={() => handleResolveError(selectedError.id)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600"
                >
                  手动消灭
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showEntryModal && selectedError && (
        <ManualEntryModal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          initialMotifId={selectedError.targetId}
          initialSpecId={selectedError.specId}
          initialVarId={selectedError.varId}
          initialMotifName={selectedError.motifName}
          initialQuestion={selectedError.question}
          initialLevel={selectedError.level}
          isAcademicMode={isAcademicMode}
          onEntrySuccess={(questionId) => {
            setErrorNotebook(prev => prev.map(e => 
              e.id === selectedError.id 
                ? { ...e, enteredToPool: true, enteredQuestionId: questionId }
                : e
            ));
            setShowEntryModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ErrorLibrary;
