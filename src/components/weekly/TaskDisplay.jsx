import React, { useState } from 'react';
import AnswerInput from './AnswerInput';
import LatexRenderer from '../LatexRenderer';
import { formatWeaponList } from '../../utils/weaponHelper';
import { getWeaponNameById } from '../../utils/weaponUtils';

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
  CROSS_FILE_INDEX,
  errorNotebook
}) => {
  const [expandedTask, setExpandedTask] = useState(null);
  const [showAnswerInput, setShowAnswerInput] = useState(null);

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

  const getWeaponInfo = (task) => {
    const weaponId = task.constraints?.weaponId || task.weaponId;
    if (weaponId) {
      const weaponName = getWeaponNameById(weaponId);
      return { weaponId, weaponName };
    }
    return null;
  };

  const getAllLinkedWeapons = (task) => {
    const weapons = [];
    
    const weaponId = task.constraints?.weaponId || task.weaponId;
    if (weaponId) {
      const weaponName = getWeaponNameById(weaponId);
      if (weaponName) {
        weapons.push({ id: weaponId, name: weaponName });
      }
    }
    
    const linkedWeapons = task.benchmark?.linked_weapons || task.benchmark?.linkedWeapons || task.linked_weapons || task.linkedWeapons || [];
    console.log('[TaskDisplay] getAllLinkedWeapons:', {
      taskId: task.id,
      benchmarkLinkedWeapons: task.benchmark?.linked_weapons,
      benchmarkLinkedWeapons2: task.benchmark?.linkedWeapons,
      linkedWeapons: task.linked_weapons,
      linkedWeapons2: task.linkedWeapons,
      extractedLinkedWeapons: linkedWeapons
    });
    
    for (const wId of linkedWeapons) {
      if (!weapons.find(w => w.id === wId)) {
        const weaponName = getWeaponNameById(wId);
        if (weaponName) {
          weapons.push({ id: wId, name: weaponName });
        }
      }
    }
    
    console.log('[TaskDisplay] 最终武器列表:', weapons);
    return weapons;
  };

  const getErrorSource = (task) => {
    if (task.source !== 'error') return null;
    const errorInfo = errorNotebook?.find(e => 
      e.targetId === task.motifId && !e.resolved
    );
    return errorInfo;
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
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('[Debug] 答案录入按钮点击, index:', index, 'showAnswerInput:', showAnswerInput);
                      setShowAnswerInput(showAnswerInput === index ? null : index);
                    }}
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

              {/* 杀手锏训练提示 */}
              {(() => {
                const weaponInfo = getWeaponInfo(task);
                const errorSource = getErrorSource(task);
                
                return (
                  <>
                    {weaponInfo && weaponInfo.weaponName && (
                      <div className={`p-2 rounded-lg mb-2 flex items-center gap-2 ${
                        isAcademicMode 
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200' 
                          : 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-700'
                      }`}>
                        <span className="text-base">🔥</span>
                        <span className={`text-xs font-bold ${
                          isAcademicMode ? 'text-indigo-700' : 'text-indigo-300'
                        }`}>
                          专项突破：本题重点训练「{weaponInfo.weaponName}」
                        </span>
                      </div>
                    )}
                    
                    {errorSource && (
                      <div className={`p-2 rounded-lg mb-2 flex items-center gap-2 ${
                        isAcademicMode 
                          ? 'bg-red-50 border border-red-200' 
                          : 'bg-red-900/20 border border-red-700'
                      }`}>
                        <span className="text-base">📌</span>
                        <span className={`text-xs ${
                          isAcademicMode ? 'text-red-600' : 'text-red-300'
                        }`}>
                          基于你的错题「{errorSource.questionText?.substring(0, 30) || errorSource.diagnosis?.substring(0, 30) || '该知识点'}...」生成
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className={`text-xs mb-2 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                📌 本周目标：攻克 {task.targetLevel || task.level} 级别变例，连续 3 次训练正确即可通关
              </div>

              {/* 🔥 修复：无论是否 AI 生成，都显示题目 */}
              <div className={`p-3 rounded-lg border mb-2 ${
                isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{task.isAIGenerated ? '✨' : '📚'}</span>
                  <span className={`text-xs font-bold ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                    {task.isAIGenerated ? 'AI 定制题目' : '真题库原题'}
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

              {expandedTask === index && (
                <div className="mt-3 space-y-3">
                  {(() => {
                    const allWeapons = getAllLinkedWeapons(task);
                    if (allWeapons.length > 0) {
                      return (
                        <div className={`p-3 rounded-lg text-sm ${
                          isAcademicMode ? 'bg-indigo-50 border border-indigo-200' : 'bg-indigo-900/20 border border-indigo-700'
                        }`}>
                          <div className="font-bold text-xs mb-2 flex items-center gap-1">
                            <span>🔥</span> 适配杀手锏
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {allWeapons.map(weapon => (
                              <div 
                                key={weapon.id}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  isAcademicMode 
                                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                    : 'bg-indigo-900/30 text-indigo-300 border border-indigo-600'
                                }`}
                              >
                                <span className="opacity-70">{weapon.id}</span>
                                <span className="mx-1">·</span>
                                <span>{weapon.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
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
                  onSubmit={(answer, answerType) => {
                    onSubmitAnswer?.(index, answer, answerType);
                    setShowAnswerInput(null);
                  }}
                  isAcademicMode={isAcademicMode}
                />
              )}

              {task.score !== undefined && (
                <div className={`mt-3 p-3 rounded-lg ${
                  task.evaluationResult?.isAllCorrect 
                    ? (isAcademicMode ? 'bg-green-50 border border-green-200' : 'bg-green-900/20 border border-green-700')
                    : (isAcademicMode ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-700')
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{task.evaluationResult?.isAllCorrect ? '✅' : '❌'}</span>
                    <span className={`font-bold text-sm ${
                      task.evaluationResult?.isAllCorrect 
                        ? (isAcademicMode ? 'text-green-700' : 'text-green-400')
                        : (isAcademicMode ? 'text-red-700' : 'text-red-400')
                    }`}>
                      {task.evaluationResult?.isAllCorrect ? '回答正确' : '回答错误'}
                    </span>
                  </div>
                  
                  {task.evaluationResult?.aiReason && (
                    <div className={`mb-2 p-2 rounded text-xs ${
                      isAcademicMode ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300'
                    }`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span>🤖</span>
                        <span className="font-bold">AI 老师点评：</span>
                        {task.evaluationResult?.isFallback && (
                          <span className={`text-xs px-1 rounded ${
                            isAcademicMode ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-900/30 text-yellow-400'
                          }`}>
                            (离线模式)
                          </span>
                        )}
                      </div>
                      <div className="leading-relaxed">
                        {task.evaluationResult.aiReason}
                      </div>
                    </div>
                  )}
                  
                  {task.evaluationResult?.isAllCorrect && task.source === 'error' && (
                    <div className={`mb-2 p-2 rounded text-xs ${
                      isAcademicMode ? 'bg-green-50 text-green-700' : 'bg-green-900/30 text-green-300'
                    }`}>
                      <div className="flex items-center gap-1">
                        <span>✅</span>
                        <span className="font-bold">恭喜！已自动消灭该变例的错题</span>
                      </div>
                    </div>
                  )}
                  
                  {/* 🔥 单问模式：直接显示得分，不显示"第X问" */}
                  <div className={`flex items-center gap-2 text-sm font-bold ${
                    task.score >= 0 
                      ? (isAcademicMode ? 'text-green-700' : 'text-green-400')
                      : (isAcademicMode ? 'text-red-700' : 'text-red-400')
                  }`}>
                    <span>{task.score >= 0 ? '✓' : '✗'}</span>
                    <span>得分: {task.score >= 0 ? '+' : ''}{task.score} 分</span>
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
