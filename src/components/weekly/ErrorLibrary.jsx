import React, { useState, useMemo } from 'react';

const ErrorLibrary = ({
  errorNotebook,
  setErrorNotebook,
  tacticalData,
  isAcademicMode,
  onClose
}) => {
  const [filter, setFilter] = useState('all');
  const [selectedError, setSelectedError] = useState(null);

  const allEncounters = tacticalData?.tactical_maps?.flatMap(m => m.encounters) || [];

  const filteredErrors = useMemo(() => {
    let errors = errorNotebook || [];
    
    if (filter === 'unresolved') {
      errors = errors.filter(e => !e.resolved);
    } else if (filter === 'resolved') {
      errors = errors.filter(e => e.resolved);
    } else if (['weekly', 'training', 'import'].includes(filter)) {
      errors = errors.filter(e => e.source === filter);
    }
    
    return errors.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }, [errorNotebook, filter]);

  const errorStats = useMemo(() => {
    const all = errorNotebook || [];
    return {
      total: all.length,
      unresolved: all.filter(e => !e.resolved).length,
      resolved: all.filter(e => e.resolved).length,
      weekly: all.filter(e => e.source === 'weekly').length,
      training: all.filter(e => e.source === 'training').length,
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
      training: { text: '日训练', color: 'green' },
      import: { text: '导入', color: 'purple' }
    };
    return labels[source] || { text: source, color: 'gray' };
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
          { key: 'weekly', label: `周任务 (${errorStats.weekly})` },
          { key: 'training', label: `日训练 (${errorStats.training})` },
          { key: 'import', label: `导入 (${errorStats.import})` }
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
              const weaponMatch = getWeaponMatch(error.targetId);
              const sourceInfo = getSourceLabel(error.source);
              
              return (
                <div
                  key={error.id}
                  onClick={() => setSelectedError(error)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    error.resolved
                      ? isAcademicMode 
                        ? 'bg-green-50 border border-green-200 opacity-75' 
                        : 'bg-green-900/10 border border-green-800/30 opacity-75'
                      : isAcademicMode
                        ? 'bg-white border border-slate-200 hover:border-red-300'
                        : 'bg-zinc-800 border border-zinc-700 hover:border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          sourceInfo.color === 'blue' 
                            ? isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'
                            : sourceInfo.color === 'green'
                              ? isAcademicMode ? 'bg-green-100 text-green-600' : 'bg-green-900/30 text-green-400'
                              : isAcademicMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/30 text-purple-400'
                        }`}>
                          {sourceInfo.text}
                        </span>
                        {error.resolved && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            isAcademicMode ? 'bg-green-100 text-green-600' : 'bg-green-900/30 text-green-400'
                          }`}>
                            ✓ 已消灭
                          </span>
                        )}
                      </div>
                      <p className={`font-medium text-sm truncate ${
                        isAcademicMode ? 'text-slate-800' : 'text-zinc-200'
                      }`}>
                        {motifInfo.name}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                      }`}>
                        武器库: {weaponMatch}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${
                        isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
                      }`}>
                        入库: {formatDate(error.addedAt)}
                      </p>
                      {error.resolved && error.resolvedAt && (
                        <p className={`text-xs ${
                          isAcademicMode ? 'text-green-500' : 'text-green-400'
                        }`}>
                          消灭: {formatDate(error.resolvedAt)}
                        </p>
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
              <div>
                <label className={`text-xs font-medium ${
                  isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  母题归属
                </label>
                <p className={`font-medium ${
                  isAcademicMode ? 'text-slate-800' : 'text-zinc-200'
                }`}>
                  {getMotifInfo(selectedError.targetId).name}
                </p>
              </div>

              <div>
                <label className={`text-xs font-medium ${
                  isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                }`}>
                  匹配武器库
                </label>
                <p className={isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}>
                  {getWeaponMatch(selectedError.targetId)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className={`text-xs font-medium ${
                    isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                  }`}>
                    入库时间
                  </label>
                  <p className={isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}>
                    {formatDate(selectedError.addedAt)}
                  </p>
                </div>
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

              {selectedError.diagnosis && (
                <div>
                  <label className={`text-xs font-medium ${
                    isAcademicMode ? 'text-slate-500' : 'text-zinc-400'
                  }`}>
                    错误诊断
                  </label>
                  <p className={`text-sm ${
                    isAcademicMode ? 'text-slate-700' : 'text-zinc-300'
                  }`}>
                    {selectedError.diagnosis}
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
    </div>
  );
};

export default ErrorLibrary;
