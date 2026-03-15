// src/components/TaskCard.jsx
import React, { useState } from 'react'
import LatexRenderer from './LatexRenderer'

/**
 * 通用辅助函数：将可能为对象的内容转换为可渲染的字符串
 * 优先提取常见字段 (content, text, core_idea)，其次尝试拼接数组，最后兜底 JSON.stringify
 */
const normalizeContent = (content) => {
  if (!content) return ''
  
  // 1. 如果是字符串，直接返回
  if (typeof content === 'string') {
    return content
  }

  // 2. 如果是对象，尝试智能提取
  if (typeof content === 'object') {
    // 情况 A: 包含标准内容字段 (content, text, body)
    if (content.content) return normalizeContent(content.content)
    if (content.text) return normalizeContent(content.text)
    if (content.body) return normalizeContent(content.body)

    // 情况 B: 是答案对象 { l1: "...", l2: "..." }
    if (content.l1 || content.l2) {
      const parts = []
      if (content.l1) parts.push(`(1) ${normalizeContent(content.l1)}`)
      if (content.l2) parts.push(`(2) ${normalizeContent(content.l2)}`)
      if (content.l3) parts.push(`(3) ${normalizeContent(content.l3)}`)
      if (content.l4) parts.push(`(4) ${normalizeContent(content.l4)}`)
      // 处理其他可能的键
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

    // 情况 C: 是解析对象 { core_idea: "...", steps: [...] }
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

    // 情况 D: 纯对象兜底 -> 尝试拼接所有字符串值
    const allValues = Object.values(content)
    const stringValues = allValues.filter(v => typeof v === 'string' && v.trim().length > 0)
    if (stringValues.length > 0) {
      return stringValues.join(' ')
    }

    // 情况 E: 彻底无法解析 -> JSON 字符串 (避免 [object Object])
    return JSON.stringify(content)
  }

  // 3. 其他类型强制转字符串
  return String(content)
}

const TaskCard = ({ task, isAcademicMode, CROSS_FILE_INDEX, showAnalysis = true }) => {
  const itemKey = `task-${task.motifId}-${task.source}`
  
  const getSourceBadge = () => {
    if (task.source === 'error') {
      return { 
        emoji: '🔴', 
        label: '待消灭错题', 
        bgClass: 'bg-red-100 dark:bg-red-900/20',
        textClass: 'text-red-600 dark:text-red-400',
        cardBg: isAcademicMode ? 'bg-red-50' : 'bg-red-900/10'
      }
    }
    if (task.source === 'active') {
      return { 
        emoji: '🔵', 
        label: '本周主攻目标', 
        bgClass: 'bg-blue-100 dark:bg-blue-900/20',
        textClass: 'text-blue-600 dark:text-blue-400',
        cardBg: isAcademicMode ? 'bg-blue-50' : 'bg-blue-900/10'
      }
    }
    if (task.source === 'bottom_elo') {
      return { 
        emoji: '🟠', 
        label: '短板智能兜底', 
        bgClass: 'bg-orange-100 dark:bg-orange-900/20',
        textClass: 'text-orange-600 dark:text-orange-400',
        cardBg: isAcademicMode ? 'bg-orange-50' : 'bg-orange-900/10'
      }
    }
    return { 
      emoji: '⚪', 
      label: '未知来源', 
      bgClass: 'bg-slate-100 dark:bg-zinc-800',
      textClass: 'text-slate-600 dark:text-zinc-400',
      cardBg: isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800/50'
    }
  }
  
  const badge = getSourceBadge()
  
  const getPreviewProblem = () => {
    const rawMotifId = task.motifId || task.targetId
    const targetLevel = task.targetLevel || task.level
    
    const motifId = rawMotifId ? rawMotifId.replace(/_/g, '-').toLowerCase() : null
    
    if (!motifId || !CROSS_FILE_INDEX) {
      console.log('【未找到样题】缺少 motifId 或 CROSS_FILE_INDEX', { rawMotifId, motifId })
      return null
    }
    
    const knowledgeDataArray = CROSS_FILE_INDEX[motifId]
    if (!knowledgeDataArray || knowledgeDataArray.length === 0) {
      console.log('【未找到样题】索引中无此 ID', { motifId, availableKeys: Object.keys(CROSS_FILE_INDEX).slice(0, 5) })
      return null
    }
    
    const knowledgeData = knowledgeDataArray[0]
    
    const specialties = knowledgeData.specialties || []
    for (const spec of specialties) {
      const variations = spec.variations || []
      for (const v of variations) {
        const benchmarks = v.master_benchmarks || []
        const targetBenchmark = benchmarks.find(b => b.level === targetLevel)
        if (targetBenchmark) {
          console.log('【找到样题】', { specName: spec.spec_name, varName: v.name, level: targetLevel })
          return {
            specName: spec.spec_name || '',
            varName: v.name || '',
            level: targetLevel,
            question: targetBenchmark.problem || targetBenchmark.question,
            logicKey: targetBenchmark.logic_key || '标准解题流程',
            analysis: targetBenchmark.analysis || null,
            coreIdea: targetBenchmark.analysis?.core_idea || v.logic_core || '标准解题流程',
            keySteps: targetBenchmark.analysis?.key_steps || [],
            commonPitfalls: targetBenchmark.analysis?.common_pitfalls || [],
            linkedWeapons: v.toolkit?.linked_weapons || []
          }
        }
      }
    }
    
    const mb = knowledgeData.master_benchmarks || []
    const targetMB = mb.find(b => b.level === targetLevel)
    if (targetMB) {
      console.log('【找到样题 (旧结构)】', { level: targetLevel })
      return {
        specName: '',
        varName: '',
        level: targetLevel,
        question: targetMB.problem || targetMB.question,
        logicKey: targetMB.logic_key || '标准解题流程',
        analysis: targetMB.analysis || null,
        coreIdea: targetMB.analysis?.core_idea || '标准解题流程',
        keySteps: targetMB.analysis?.key_steps || [],
        commonPitfalls: targetMB.analysis?.common_pitfalls || [],
        linkedWeapons: []
      }
    }
    
    const prototypeProblems = knowledgeData.prototypeProblems || knowledgeData.prototype_problems || []
    if (prototypeProblems.length > 0) {
      console.log('【找到样题 (prototypeProblems)】', { count: prototypeProblems.length })
      return {
        specName: '',
        varName: '',
        level: targetLevel,
        question: prototypeProblems[0].problem || prototypeProblems[0].question,
        logicKey: '标准解题流程',
        analysis: null,
        coreIdea: '标准解题流程',
        keySteps: [],
        commonPitfalls: [],
        linkedWeapons: []
      }
    }
    
    console.log('【未找到样题】', { motifId, targetLevel })
    return null
  }
  
  const previewProblem = getPreviewProblem()
  
  const [showPrototypeModal, setShowPrototypeModal] = useState(false)

  // 【关键】预处理 variant 数据，确保传给 LatexRenderer 的永远是字符串
  const variantData = task.variant ? {
    question: normalizeContent(task.variant.question),
    analysis: normalizeContent(task.variant.analysis),
    answer: normalizeContent(task.variant.answer)
  } : null
  
  return (
    <>
      <div className={`p-3 rounded-lg border ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bgClass} ${badge.textClass}`}>
              {badge.emoji} {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${isAcademicMode ? 'bg-slate-100 text-slate-600' : 'bg-zinc-700 text-zinc-300'}`}>
              {task.motifId || task.targetId} · {task.motifName || task.targetName} - {task.targetLevel || task.level}
            </span>
            <button
              onClick={() => {
                console.log('【样题参考按钮点击】', { previewProblem: !!previewProblem, task })
                if (previewProblem) {
                  setShowPrototypeModal(true)
                }
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                previewProblem 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={previewProblem ? "查看母题样题" : "暂无样题数据"}
            >
              <span>📖</span>
              <span>样题参考</span>
            </button>
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
              task.targetLevel === 'L4' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              task.targetLevel === 'L3' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              攻克 {task.targetLevel}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs">
          <span className={`${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            📌 本周目标：攻克 {task.targetLevel} 级别变例，连续 3 次训练正确即可通关
          </span>
        </div>
        
        {task.variant && variantData && (
          <div className={`mt-3 p-3 rounded border ${isAcademicMode ? 'bg-white border-emerald-200' : 'bg-zinc-800 border-emerald-700'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">✨</span>
              <span className={`text-xs font-bold ${isAcademicMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                AI 定制题目
              </span>
              {task.isAIGenerated && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'}`}>
                  AI 生成
                </span>
              )}
            </div>
            
            {/* 题干 */}
            <div className={`text-sm ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
              <LatexRenderer content={variantData.question} />
            </div>

            {/* 解析 */}
            {showAnalysis && variantData.analysis && (
              <div className={`mt-2 pt-2 border-t text-xs ${isAcademicMode ? 'border-slate-200 text-slate-600' : 'border-zinc-600 text-zinc-400'}`}>
                <span className="font-medium">解析：</span>
                <LatexRenderer content={variantData.analysis} />
              </div>
            )}

            {/* 答案 */}
            {showAnalysis && variantData.answer && (
              <div className={`mt-1 text-xs ${isAcademicMode ? 'text-green-600' : 'text-green-400'}`}>
                <span className="font-medium">答案：</span>
                <LatexRenderer content={variantData.answer} />
              </div>
            )}
          </div>
        )}
      </div>
      
      {showPrototypeModal && previewProblem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPrototypeModal(false)}>
          <div 
            className={`max-w-3xl mx-4 rounded-lg border p-6 max-h-[85vh] overflow-y-auto ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                  📖 参考母题样题
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  {previewProblem.specName && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isAcademicMode ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/30 text-purple-400'}`}>
                      {previewProblem.specName}
                    </span>
                  )}
                  {previewProblem.varName && (
                    <span className={`text-xs px-2 py-0.5 rounded ${isAcademicMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-900/30 text-blue-400'}`}>
                      {previewProblem.varName}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                    previewProblem.level === 'L4' ? 'bg-amber-100 text-amber-600' :
                    previewProblem.level === 'L3' ? 'bg-purple-100 text-purple-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {previewProblem.level}
                  </span>
                </div>
                {previewProblem.logicKey && (
                  <div className="mt-2 mb-2 p-2 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-md">
                    <p className="text-xs font-bold text-indigo-700">
                      <span className="mr-2">🎯 [逻辑核心]</span>
                      {previewProblem.logicKey}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowPrototypeModal(false)}
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
                {/* 样题也可能有对象结构，同样处理 */}
                <LatexRenderer content={normalizeContent(previewProblem.question)} />
              </div>
            </div>
            
            <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-700'}`}>
              <div className="mb-2">
                <span className={`font-medium ${isAcademicMode ? 'text-blue-700' : 'text-blue-400'}`}>
                  💡 核心思路
                </span>
              </div>
              <div className={`${isAcademicMode ? 'text-blue-800' : 'text-blue-300'}`}>
                <LatexRenderer content={normalizeContent(previewProblem.coreIdea)} />
              </div>
            </div>
            
            {previewProblem.keySteps && previewProblem.keySteps.length > 0 && (
              <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800'}`}>
                <div className="mb-2">
                  <span className={`font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                    📝 解析步骤
                  </span>
                </div>
                <ol className={`list-decimal list-inside space-y-2 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  {previewProblem.keySteps.map((step, idx) => (
                    <li key={idx} className="text-sm">
                      <LatexRenderer content={normalizeContent(step)} />
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            {previewProblem.commonPitfalls && previewProblem.commonPitfalls.length > 0 && (
              <div className={`p-4 rounded-lg mb-4 ${isAcademicMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-700'}`}>
                <div className="mb-2">
                  <span className={`font-medium ${isAcademicMode ? 'text-amber-700' : 'text-amber-400'}`}>
                    ⚠️ 避坑指南
                  </span>
                </div>
                <ul className={`space-y-2 ${isAcademicMode ? 'text-amber-700' : 'text-amber-300'}`}>
                  {previewProblem.commonPitfalls.map((pitfall, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span>⚠️</span>
                      <LatexRenderer content={normalizeContent(pitfall)} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {previewProblem.linkedWeapons && previewProblem.linkedWeapons.length > 0 && (
              <div className={`p-4 rounded-lg ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800'}`}>
                <div className="mb-2">
                  <span className={`font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                    🔧 核心方法与公式
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewProblem.linkedWeapons.map((weapon, idx) => {
                    const weaponNames = {
                      'W028': '求导法则',
                      'W031': '公切线模型',
                      'W033': '高次方程试根法',
                      'W035': '含参不等式',
                      'W039': '切线方程综合',
                      'W040': '方程组消元',
                      'W041': '分类讨论思想',
                      'W042': '数形结合',
                      'W043': '逆向思维'
                    }
                    const weaponName = weaponNames[weapon] || weapon
                    return (
                      <button
                        key={idx}
                        onClick={() => console.log(`[Link Weapon]: ${weapon} - ${weaponName}`)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isAcademicMode 
                            ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
                            : 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'
                        }`}
                      >
                        {weaponName}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default TaskCard