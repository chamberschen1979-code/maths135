import React, { useState } from 'react';

const TaskGenerator = ({
  allSelectedMotifs,
  onGenerate,
  onRegenerate,
  onPrint,
  onClear,
  isGenerating,
  hasTasks,
  debugInfo,
  isAcademicMode,
  verificationStatus
}) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleGenerate = () => {
    if (allSelectedMotifs.length === 0) return;
    onGenerate?.();
  };

  const handleRegenerate = () => {
    if (allSelectedMotifs.length === 0) return;
    onRegenerate?.();
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    onPrint?.();
  };

  const handleClear = () => {
    onClear?.();
  };

  const getPhaseIcon = (phase) => {
    const icons = {
      'generating': '📝',
      'verifying_math': '🔬',
      'evaluating_fitness': '📊',
      'retrying': '🔄',
      'passed': '✅',
      'failed': '❌'
    };
    return icons[phase] || '⏳';
  };

  const getPhaseText = (status) => {
    if (!status) return null;
    
    const { phase, attempt, maxRetries, fitnessScore, errorType } = status;
    
    const texts = {
      'generating': `正在生成第 ${status.problemIndex} 题...`,
      'verifying_math': `🔬 正在验算数学逻辑...`,
      'evaluating_fitness': fitnessScore 
        ? `📊 评估完成：适配度 ${fitnessScore.toFixed(1)}/5.0` 
        : `📊 正在评估难度匹配度...`,
      'retrying': `🔄 题目质量不足 (${errorType})，正在重新构思...`,
      'passed': `✅ 验证通过`,
      'failed': `❌ 验证失败`
    };
    
    return texts[phase] || phase;
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
        {hasTasks ? (
          <button
            onClick={handleRegenerate}
            disabled={allSelectedMotifs.length === 0 || isGenerating}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
              allSelectedMotifs.length === 0 || isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                重新生成中...
              </span>
            ) : (
              `🔄 重新生成`
            )}
          </button>
        ) : (
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
                智能打磨中...
              </span>
            ) : (
              `生成任务 (${allSelectedMotifs.length} 个母题)`
            )}
          </button>
        )}

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

      {isGenerating && verificationStatus && (
        <div className={`mt-3 p-3 rounded-lg text-xs ${
          isAcademicMode ? 'bg-blue-50 border border-blue-100' : 'bg-blue-900/20 border border-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{getPhaseIcon(verificationStatus.phase)}</span>
            <span className={`font-medium ${
              isAcademicMode ? 'text-blue-700' : 'text-blue-300'
            }`}>
              {getPhaseText(verificationStatus)}
            </span>
          </div>
          
          {verificationStatus.phase === 'evaluating_fitness' && verificationStatus.details && (
            <div className={`mt-2 grid grid-cols-3 gap-2 text-xs ${
              isAcademicMode ? 'text-blue-600' : 'text-blue-400'
            }`}>
              <div className="flex flex-col items-center">
                <span className="opacity-70">难度匹配</span>
                <span className="font-bold">
                  {verificationStatus.details.difficultyMatch?.score?.toFixed(1) || '-'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="opacity-70">考纲合规</span>
                <span className="font-bold">
                  {verificationStatus.details.syllabusCheck?.score?.toFixed(1) || '-'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="opacity-70">区分度</span>
                <span className="font-bold">
                  {verificationStatus.details.uniqueness?.score?.toFixed(1) || '-'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {debugInfo && !isGenerating && (
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
