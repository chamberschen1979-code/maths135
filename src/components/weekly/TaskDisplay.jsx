import React, { useState } from 'react';
import AnswerInput from './AnswerInput';
import LatexRenderer from '../LatexRenderer';
import { formatWeaponList } from '../../utils/weaponHelper';

const normalizeContent = (content) => {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (typeof content === 'object') {
    if (content.content) return normalizeContent(content.content)
    if (content.text) return normalizeContent(content.text)
    if (content.body) return normalizeContent(content.body)
    if (content.l1 || content.l2) {
      const parts = []
      if (content.l1) parts.push(`(1) ${normalizeContent(content.l1)}`)
      if (content.l2) parts.push(`(2) ${normalizeContent(content.l2)}`)
      if (content.l3) parts.push(`(3) ${normalizeContent(content.l3)}`)
      if (content.l4) parts.push(`(4) ${normalizeContent(content.l4)}`)
      Object.keys(content).forEach(key => {
        if (!['l1', 'l2', 'l3', 'l4', 'content', 'text'].includes(key)) {
          const val = content[key]
          if (typeof val === 'string' && val.trim().length > 0) {
            parts.push(`${key}: ${val}`)
          }
        }
      })
      if (parts.length > 0) return parts.join('\n\n')
    }
    if (content.core_idea || content.steps) {
      const parts = []
      if (content.core_idea) parts.push(`【核心思路】${normalizeContent(content.core_idea)}`)
      if (content.steps && Array.isArray(content.steps)) {
        const stepTexts = content.steps.map((s, i) => `${i + 1}. ${normalizeContent(s)}`)
        parts.push(`【步骤】\n${stepTexts.join('\n')}`)
      }
      if (content.conclusion) parts.push(`【结论】${normalizeContent(content.conclusion)}`)
      if (parts.length > 0) return parts.join('\n\n')
    }
    const allValues = Object.values(content)
    const stringValues = allValues.filter(v => typeof v === 'string' && v.trim().length > 0)
    if (stringValues.length > 0) return stringValues.join(' ')
    return JSON.stringify(content)
  }
  return String(content)
}

const getSourceBadge = (source) => {
  if (source === 'error') {
    return { emoji: '🔴', label: '待消灭错题', bgClass: 'bg-red-100 dark:bg-red-900/20', textClass: 'text-red-600 dark:text-red-400' }
  }
  if (source === 'custom') {
    return { emoji: '🔵', label: '自选目标', bgClass: 'bg-blue-100 dark:bg-blue-900/20', textClass: 'text-blue-600 dark:text-blue-400' }
  }
  if (source === 'reinforcement') {
    return { emoji: '🟠', label: '强化训练', bgClass: 'bg-orange-100 dark:bg-orange-900/20', textClass: 'text-orange-600 dark:text-orange-400' }
  }
  if (source === 'active') {
    return { emoji: '🔵', label: '本周主攻', bgClass: 'bg-blue-100 dark:bg-blue-900/20', textClass: 'text-blue-600 dark:text-blue-400' }
  }
  return { emoji: '⚪', label: '未知来源', bgClass: 'bg-slate-100 dark:bg-zinc-800', textClass: 'text-slate-600 dark:text-zinc-400' }
}

const TaskDisplay = ({
  tasks,
  onSubmitAnswer,
  isAcademicMode,
  CROSS_FILE_INDEX
}) => {
  const [expandedTask, setExpandedTask] = useState(null);
  const [showAnswerInput, setShowAnswerInput] = useState(null);
  const [showPrototypeModal, setShowPrototypeModal] = useState(null);

  if (!tasks || tasks.length === 0) {
    return null;
  }

  const getQuestion = (task) => {
    const q = task.variant?.question || task.problem || task.question;
    if (!q) return '';
    if (typeof q === 'string') return q;
    if (q.content) return q.content;
    if (q.text) return q.text;
    if (q.body) return q.body;
    return normalizeContent(q);
  };

  const getAnalysis = (task) => {
    return task.variant?.analysis || task.analysis || '';
  };

  const getAnswer = (task) => {
    return task.variant?.answer || task.answer || '';
  };

  return (
    <div className={`rounded-xl p-4 ${
      isAcademicMode ? 'bg-white border border-slate-200' : 'bg-zinc-800/50 border border-zinc-700'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📝</span>
        <h2 className="font-bold text-sm">任务区域</h2>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
          isAcademicMode ? 'bg-slate-100 text-slate-600' : 'bg-zinc-700 text-zinc-400'
        }`}>
          {tasks.length} 道题目
        </span>
      </div>

      <div className="space-y-4">
        {tasks.map((task, index) => {
          const question = normalizeContent(getQuestion(task));
          const analysis = normalizeContent(getAnalysis(task));
          const answer = normalizeContent(getAnswer(task));
          const badge = getSourceBadge(task.source);
          const hasBenchmark = task.benchmark && (task.benchmark.problem || task.benchmark.question);
          
          return (
            <div
              key={task.id || index}
              className={`rounded-lg p-4 ${
                isAcademicMode ? 'bg-slate-50 border border-slate-200' : 'bg-zinc-700 border border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bgClass} ${badge.textClass}`}>
                    {badge.emoji} {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    (task.targetLevel || task.level) === 'L4' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    (task.targetLevel || task.level) === 'L3' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    攻克 {task.targetLevel || task.level}
                  </span>
                  <button
                    onClick={() => hasBenchmark && setShowPrototypeModal(index)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      hasBenchmark 
                        ? (isAcademicMode ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50')
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    title={hasBenchmark ? "查看母题样题" : "暂无样题数据"}
                  >
                    📖 样题参考
                  </button>
                  <button
                    onClick={() => setExpandedTask(expandedTask === index ? null : index)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      expandedTask === index
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : isAcademicMode 
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
                    }`}
                  >
                    {expandedTask === index ? '收起解析' : '查看解析'}
                  </button>
                  <button
                    onClick={() => setShowAnswerInput(showAnswerInput === index ? null : index)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      task.userAnswer
                        ? 'bg-green-100 text-green-700'
                        : isAcademicMode 
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                    }`}
                  >
                    {task.userAnswer ? '已作答' : '答案录入'}
                  </button>
                </div>
              </div>

              <div className={`text-xs mb-2 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                📌 本周目标：攻克 {task.targetLevel || task.level} 级别变例，连续 3 次训练正确即可通关
              </div>

              {task.isAIGenerated && (
                <div className={`p-3 rounded-lg border mb-2 ${
                  isAcademicMode ? 'bg-white border-emerald-200' : 'bg-zinc-800 border-emerald-700'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">✨</span>
                    <span className={`text-xs font-bold ${isAcademicMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      AI 定制题目
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      isAcademicMode ? 'bg-slate-100 text-slate-600' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {task.motifName}{task.specName ? ` · ${task.specName}` : ''}{task.varName ? ` · ${task.varName}` : ''}
                    </span>
                  </div>
                  <div className={`text-sm leading-relaxed ${
                    isAcademicMode ? 'text-slate-700' : 'text-zinc-300'
                  }`}>
                    <LatexRenderer content={question} />
                  </div>
                </div>
              )}

              {expandedTask === index && (
                <div className="mt-3 space-y-3">
                  {analysis && (
                    <div className={`p-3 rounded-lg text-sm ${
                      isAcademicMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-800/30'
                    }`}>
                      <div className="font-bold text-xs mb-2 flex items-center gap-1">
                        <span>💡</span> 解析
                      </div>
                      <div className={`leading-relaxed ${
                        isAcademicMode ? 'text-amber-800' : 'text-amber-300'
                      }`}>
                        <LatexRenderer content={analysis} />
                      </div>
                    </div>
                  )}
                  
                  {answer && (
                    <div className={`p-3 rounded-lg text-sm ${
                      isAcademicMode ? 'bg-green-50 border border-green-200' : 'bg-green-900/20 border border-green-800/30'
                    }`}>
                      <div className="font-bold text-xs mb-2 flex items-center gap-1">
                        <span>✅</span> 答案
                      </div>
                      <div className={`leading-relaxed ${
                        isAcademicMode ? 'text-green-700' : 'text-green-400'
                      }`}>
                        <LatexRenderer content={answer} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showAnswerInput === index && (
                <AnswerInput
                  task={task}
                  onSubmit={(answer) => {
                    onSubmitAnswer?.(index, answer);
                    setShowAnswerInput(null);
                  }}
                  isAcademicMode={isAcademicMode}
                />
              )}

              {task.score !== undefined && (
                <div className={`mt-2 text-xs ${
                  task.score >= 80 ? 'text-green-500' : task.score >= 60 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  得分: {task.score} 分
                </div>
              )}

              {showPrototypeModal === index && task.benchmark && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPrototypeModal(null)}>
                  <div 
                    className={`max-w-3xl mx-4 rounded-lg border p-6 max-h-[85vh] overflow-y-auto ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className={`text-lg font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                          📖 参考母题样题
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowPrototypeModal(null)}
                        className={`p-1 rounded ${isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800'}`}>
                      <div className="mb-2">
                        <span className={`font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                          【题目】
                        </span>
                      </div>
                      <div className={`${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                        <LatexRenderer content={normalizeContent(task.benchmark.problem || task.benchmark.question)} />
                      </div>
                    </div>
                    
                    {task.benchmark.analysis?.core_idea && (
                      <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-700'}`}>
                        <div className="mb-2">
                          <span className={`font-medium ${isAcademicMode ? 'text-blue-700' : 'text-blue-400'}`}>
                            💡 核心思路
                          </span>
                        </div>
                        <div className={`${isAcademicMode ? 'text-blue-800' : 'text-blue-300'}`}>
                          <LatexRenderer content={normalizeContent(task.benchmark.analysis.core_idea)} />
                        </div>
                      </div>
                    )}
                    
                    {task.benchmark.analysis?.key_steps && task.benchmark.analysis.key_steps.length > 0 && (
                      <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800'}`}>
                        <div className="mb-2">
                          <span className={`font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                            📝 解析步骤
                          </span>
                        </div>
                        <ol className={`list-decimal list-inside space-y-2 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                          {task.benchmark.analysis.key_steps.map((step, idx) => (
                            <li key={idx} className="text-sm">
                              <LatexRenderer content={normalizeContent(step)} />
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    
                    {task.benchmark.analysis?.common_pitfalls && task.benchmark.analysis.common_pitfalls.length > 0 && (
                      <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-700'}`}>
                        <div className="mb-2">
                          <span className={`font-medium ${isAcademicMode ? 'text-amber-700' : 'text-amber-400'}`}>
                            ⚠️ 陷阱类型
                          </span>
                        </div>
                        <ul className={`space-y-2 ${isAcademicMode ? 'text-amber-700' : 'text-amber-300'}`}>
                          {task.benchmark.analysis.common_pitfalls.map((pitfall, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <span>⚠️</span>
                              <LatexRenderer content={normalizeContent(pitfall)} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {task.variableKnobs && Object.keys(task.variableKnobs).length > 0 && (() => {
                      const trapKeys = ['trap_type', 'trap_condition'];
                      const variableFactors = Object.entries(task.variableKnobs).filter(([key]) => !trapKeys.includes(key));
                      
                      return (
                        <>
                          {variableFactors.length > 0 && (
                            <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-900/20 border border-emerald-700'}`}>
                              <div className="mb-2">
                                <span className={`font-medium ${isAcademicMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                  🎲 变量因子（本题生成策略）
                                </span>
                              </div>
                              <div className="space-y-2">
                                {variableFactors.map(([key, knob]) => {
                                  if (!knob || !knob.desc) return null;
                                  const dimensionLabels = {
                                    property_type: '核心考点',
                                    calculation_mode: '计算要求',
                                    angle_relation: '角度关系',
                                    function_type: '函数类型',
                                    expression_structure: '式子结构',
                                    solution_strategy: '解题策略'
                                  };
                                  return (
                                    <div key={key} className="flex items-start gap-2">
                                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                        isAcademicMode ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-900/30 text-emerald-400'
                                      }`}>
                                        {dimensionLabels[key] || key}
                                      </span>
                                      <span className={`text-sm ${isAcademicMode ? 'text-emerald-700' : 'text-emerald-300'}`}>
                                        {knob.desc}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    {task.benchmark && task.benchmark.linked_weapons && task.benchmark.linked_weapons.length > 0 && (
                      <div className={`p-4 rounded-lg ${isAcademicMode ? 'bg-violet-50 border border-violet-200' : 'bg-violet-900/20 border border-violet-700'}`}>
                        <div className="mb-2">
                          <span className={`font-medium ${isAcademicMode ? 'text-violet-700' : 'text-violet-400'}`}>
                            🔧 杀手锏
                          </span>
                        </div>
                        <div className="space-y-1">
                          {formatWeaponList(task.benchmark.linked_weapons).map((weapon, idx) => (
                            <div key={idx} className={`text-sm ${isAcademicMode ? 'text-violet-700' : 'text-violet-300'}`}>
                              {weapon}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskDisplay;
