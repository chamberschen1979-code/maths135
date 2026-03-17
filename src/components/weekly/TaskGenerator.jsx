import React, { useState } from 'react';

const TaskGenerator = ({
  allSelectedMotifs,
  onGenerate,
  onPrint,
  onClear,
  isGenerating,
  hasTasks,
  debugInfo,
  isAcademicMode
}) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleGenerate = () => {
    if (allSelectedMotifs.length === 0) return;
    onGenerate?.();
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    onPrint?.();
  };

  const handleClear = () => {
    onClear?.();
  };

  return (
    <div className={`rounded-xl p-4 ${
      isAcademicMode ? 'bg-white border border-slate-200' : 'bg-zinc-800/50 border border-zinc-700'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🎯</span>
        <h2 className="font-bold text-sm">生成任务</h2>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={allSelectedMotifs.length === 0 || isGenerating}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
            allSelectedMotifs.length === 0 || isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              生成中...
            </span>
          ) : (
            `生成任务 (${allSelectedMotifs.length} 个母题)`
          )}
        </button>

        <button
          onClick={handlePrint}
          disabled={!hasTasks}
          className={`px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
            !hasTasks
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : isAcademicMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
          }`}
        >
          🖨️ 打印
        </button>

        {hasTasks && (
          <button
            onClick={handleClear}
            className={`px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
              isAcademicMode
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-800'
            }`}
          >
            🗑️ 清空
          </button>
        )}
      </div>

      {allSelectedMotifs.length === 0 && (
        <p className={`mt-3 text-xs text-center ${
          isAcademicMode ? 'text-slate-400' : 'text-zinc-500'
        }`}>
          请先在出题范围中选择母题
        </p>
      )}

      {debugInfo && (
        <div className={`mt-3 p-2 rounded-lg text-xs text-center ${
          debugInfo.startsWith('✅') 
            ? (isAcademicMode ? 'bg-green-50 text-green-600' : 'bg-green-900/20 text-green-400')
            : debugInfo.startsWith('❌')
              ? (isAcademicMode ? 'bg-red-50 text-red-600' : 'bg-red-900/20 text-red-400')
              : (isAcademicMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-900/20 text-blue-400')
        }`}>
          {debugInfo}
        </div>
      )}
    </div>
  );
};

export default TaskGenerator;
