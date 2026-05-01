import { useState, useEffect, useCallback } from 'react'
import { TaskDisplay, PrintPreview } from '../weekly'
import LatexRenderer from '../LatexRenderer'
import { judgeAnswerWithFallback } from '../../utils/aiGrader'
import MotifSelector from './MotifSelector'

const SmartAssessment = ({
  tacticalData,
  setTacticalData,
  isAcademicMode,
  onClose,
  assessmentHistory,
  setAssessmentHistory
}) => {
  const [questionBank, setQuestionBank] = useState(null)
  const [selectedMotifs, setSelectedMotifs] = useState([])
  const [tasks, setTasks] = useState([])
  const [step, setStep] = useState('select')
  const [results, setResults] = useState(null)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [isLoadingBank, setIsLoadingBank] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState(null)

  useEffect(() => {
    if (step === 'select' && !questionBank && !isLoadingBank) {
      setIsLoadingBank(true)
      fetch('/data/assessment_bank.json')
        .then(res => {
          if (!res.ok) throw new Error('题库加载失败')
          return res.json()
        })
        .then(data => {
          setQuestionBank(data)
          setIsLoadingBank(false)
        })
        .catch(err => {
          console.error('[SmartAssessment] 题库加载失败:', err)
          setIsLoadingBank(false)
        })
    }
  }, [step, questionBank, isLoadingBank])

  const generateTasks = useCallback(() => {
    if (!questionBank || selectedMotifs.length === 0) return []

    return selectedMotifs.flatMap(mid => {
      const motifData = questionBank[mid]
      if (!motifData) return []

      return motifData.specialties.flatMap(spec =>
        spec.variations
          .filter(v => v.question)
          .map(v => ({
            id: `assess-${mid}-${spec.spec_id}-${v.var_id}-${Date.now()}`,
            motifId: mid,
            motifName: motifData.motif_name,
            specName: spec.spec_name,
            specId: spec.spec_id,
            varName: v.name,
            varId: v.var_id,
            level: 'L3',
            targetLevel: 'L3',
            questionId: v.question.id,
            variant: {
              question: v.question.problem,
              analysis: v.question.analysis || v.question.key_points?.join('\n') || '暂无解析',
              answer: v.question.answer
            },
            source: 'assessment',
            isAIGenerated: false,
            aiLabel: `[摸底: ${v.question.id}]`,
            questionMeta: { questions: [{ level: 'L3' }] }
          }))
      )
    })
  }, [questionBank, selectedMotifs])

  const handleGenerate = () => {
    const flatTasks = generateTasks()
    if (flatTasks.length === 0) return
    setTasks(flatTasks)
    setResults(null)
    setStep('answer')
  }

  const handleSubmitAnswer = useCallback(async (taskIndex, answer, answerType = 'text') => {
    setTasks(prev => prev.map((task, idx) =>
      idx === taskIndex ? { ...task, isSubmitting: true } : task
    ))

    try {
      const task = tasks[taskIndex]
      if (!task || task.isSubmitted) {
        setTasks(prev => prev.map((t, idx) =>
          idx === taskIndex ? { ...t, isSubmitting: false } : t
        ))
        return
      }

      const question = task.variant?.question || ''
      const correctAnswer = task.variant?.answer || ''
      const level = task.targetLevel || 'L3'
      const questionMeta = task.questionMeta || { questions: [{ level }] }

      const aiResult = await judgeAnswerWithFallback(
        question,
        correctAnswer,
        answer,
        level,
        (userAns, correctAns) => {
          const userNorm = String(userAns || '').replace(/\s+/g, '').toLowerCase()
          const correctNorm = String(correctAns || '').replace(/\s+/g, '').toLowerCase()
          return userNorm === correctNorm
        },
        questionMeta,
        answerType
      )

      const evaluationResult = {
        status: 'OK',
        isAllCorrect: aiResult.isCorrect,
        totalDelta: aiResult.delta,
        aiReason: aiResult.reason,
        isFallback: aiResult.isFallback || false,
        details: aiResult.details || [{
          index: 0,
          level,
          isCorrect: aiResult.isCorrect,
          delta: aiResult.delta
        }]
      }

      setTasks(prev => prev.map((t, idx) => {
        if (idx !== taskIndex) return t
        return {
          ...t,
          userAnswer: answerType === 'text' ? answer : '[图片答案]',
          userAnswerType: answerType,
          score: aiResult.delta,
          evaluationResult,
          isSubmitted: true,
          isSubmitting: false,
          _assessmentCorrect: aiResult.isCorrect
        }
      }))
    } catch (error) {
      console.error('[SmartAssessment] 判题出错:', error)
      setTasks(prev => prev.map((t, idx) =>
        idx === taskIndex ? { ...t, isSubmitting: false, submitError: '判题服务暂时繁忙' } : t
      ))
    }
  }, [tasks])

  const calculateMotifResults = useCallback(() => {
    const motifMap = new Map()

    tasks.forEach(task => {
      if (!task.isSubmitted) return

      const { motifId, motifName, specId, specName, varId, varName } = task
      const correct = task._assessmentCorrect === true

      if (!motifMap.has(motifId)) {
        motifMap.set(motifId, {
          motifId,
          motifName,
          variations: [],
          totalVariations: 0
        })
      }

      const motifData = motifMap.get(motifId)
      motifData.variations.push({
        variationId: `${specId}_${varId}`,
        specId,
        specName,
        varId,
        varName,
        correct,
        status: correct ? 'green' : 'red'
      })
      motifData.totalVariations++
    })

    return Array.from(motifMap.values()).map(motif => {
      const correctCount = motif.variations.filter(v => v.correct).length
      const allCorrect = correctCount === motif.totalVariations
      const allIncorrect = correctCount === 0
      const partialCorrect = !allCorrect && !allIncorrect

      let elo, level, overallStatus

      if (allCorrect) {
        elo = 1801
        level = 'L3准入'
        overallStatus = 'green'
      } else if (partialCorrect) {
        elo = 1400
        level = 'L2进阶'
        overallStatus = 'yellow'
      } else {
        elo = 1001
        level = 'L2基础'
        overallStatus = 'red'
      }

      return {
        ...motif,
        correctCount,
        elo,
        level,
        overallStatus
      }
    })
  }, [tasks])

  const updateTacticalData = useCallback((motifResults) => {
    setTacticalData(prevData => {
      const newData = JSON.parse(JSON.stringify(prevData))

      motifResults.forEach(result => {
        const { motifId, elo, variations } = result

        for (const map of newData.tactical_maps) {
          const encounter = map.encounters.find(e => e.target_id === motifId)
          if (encounter) {
            encounter.elo_score = elo

            if (elo >= 2501) encounter.gear_level = 'L4'
            else if (elo >= 1801) encounter.gear_level = 'L3'
            else if (elo >= 1001) encounter.gear_level = 'L2'
            else encounter.gear_level = 'L1'

            encounter.health_status = elo >= 1801 ? 'healthy' : 'bleeding'

            const l2Status = elo < 1001 ? 'GREEN' : (elo >= 1800 ? 'GREEN' : 'RED')
            const l3Status = elo < 1801 ? 'GREEN' : (elo >= 2500 ? 'GREEN' : 'RED')
            const l4Status = elo < 2501 ? 'GREEN' : (elo >= 3000 ? 'GREEN' : 'RED')

            if (encounter.specialties) {
              encounter.specialties.forEach(spec => {
                spec.variations?.forEach(v => {
                  if (v.original_pool) {
                    v.original_pool.forEach(q => {
                      if (q.level === 'L2') {
                        q.is_mastered = l2Status === 'GREEN'
                        q.consecutive_correct = l2Status === 'GREEN' ? 3 : 0
                        q.l2_status = l2Status
                      }
                      if (q.level === 'L3') {
                        q.is_mastered = l3Status === 'GREEN'
                        q.consecutive_correct = l3Status === 'GREEN' ? 3 : 0
                        q.l2_status = l3Status
                      }
                      if (q.level === 'L4') {
                        q.is_mastered = l4Status === 'GREEN'
                        q.consecutive_correct = l4Status === 'GREEN' ? 3 : 0
                        q.l2_status = l4Status
                      }
                    })
                  }
                  if (v.master_benchmarks) {
                    v.master_benchmarks.forEach(b => {
                      if (b.level === 'L2') {
                        b.is_mastered = l2Status === 'GREEN'
                        b.consecutive_correct = l2Status === 'GREEN' ? 3 : 0
                        b.l2_status = l2Status
                      }
                      if (b.level === 'L3') {
                        b.is_mastered = l3Status === 'GREEN'
                        b.consecutive_correct = l3Status === 'GREEN' ? 3 : 0
                        b.l2_status = l3Status
                      }
                      if (b.level === 'L4') {
                        b.is_mastered = l4Status === 'GREEN'
                        b.consecutive_correct = l4Status === 'GREEN' ? 3 : 0
                        b.l2_status = l4Status
                      }
                    })
                  }
                })
              })
            }

            break
          }
        }
      })

      return newData
    })
  }, [setTacticalData])

  const handleFinishAssessment = () => {
    const motifResults = calculateMotifResults()
    updateTacticalData(motifResults)

    const historyEntry = {
      id: `assess_${Date.now()}`,
      date: new Date().toISOString(),
      dateDisplay: new Date().toLocaleDateString('zh-CN'),
      motifIds: [...new Set(tasks.map(t => t.motifId))],
      motifNames: [...new Set(tasks.map(t => t.motifName))],
      motifResults,
      tasks: tasks.map(t => ({
        motifId: t.motifId,
        motifName: t.motifName,
        specId: t.specId,
        specName: t.specName,
        varId: t.varId,
        varName: t.varName,
        question: t.variant?.question,
        answer: t.variant?.answer,
        analysis: t.variant?.analysis,
        userAnswer: t.userAnswer,
        isCorrect: t._assessmentCorrect
      }))
    }

    setAssessmentHistory(prev => [historyEntry, ...prev])
    setResults(motifResults)
    setStep('result')
  }

  const allSubmitted = tasks.length > 0 && tasks.every(t => t.isSubmitted)
  const submittedCount = tasks.filter(t => t.isSubmitted).length

  return (
    <div className="space-y-4">
      {step === 'select' && (
        <>
          <div className={`p-4 rounded-lg border ${
            isAcademicMode ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-700'
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-lg">🎯</span>
              <div>
                <p className={`text-sm font-medium ${isAcademicMode ? 'text-blue-800' : 'text-blue-300'}`}>
                  智能摸底测评
                </p>
                <p className={`text-xs mt-1 ${isAcademicMode ? 'text-blue-600' : 'text-blue-400'}`}>
                  选择要摸底的母题，系统将从每个变例中抽取一道经典L3题目进行测试。
                  根据作答情况，精准判定每个变例的掌握程度。
                </p>
              </div>
            </div>
          </div>

          <MotifSelector
            questionBank={questionBank}
            selectedMotifs={selectedMotifs}
            onSelectionChange={setSelectedMotifs}
            isAcademicMode={isAcademicMode}
          />

          <div className="flex justify-end gap-2 pt-2">
            {assessmentHistory && assessmentHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isAcademicMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                📋 历史记录 ({assessmentHistory.length})
              </button>
            )}
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isAcademicMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              取消
            </button>
            <button
              onClick={handleGenerate}
              disabled={selectedMotifs.length === 0 || !questionBank}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedMotifs.length === 0 || !questionBank
                  ? isAcademicMode ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : isAcademicMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              生成摸底卷 ({selectedMotifs.length > 0 ? `${selectedMotifs.reduce((sum, mid) => {
                const m = questionBank?.[mid]
                return sum + (m ? m.specialties.reduce((s, spec) => s + spec.variations.filter(v => v.question).length, 0) : 0)
              }, 0)}题` : '0题'})
            </button>
          </div>
        </>
      )}

      {step === 'answer' && (
        <>
          <div className={`flex items-center justify-between sticky top-0 z-10 py-2 px-1 ${
            isAcademicMode ? 'bg-white' : 'bg-zinc-900'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <h3 className={`font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                摸底测试
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isAcademicMode ? 'bg-slate-100 text-slate-500' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {submittedCount}/{tasks.length} 已答
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintPreview(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isAcademicMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                🖨️ 打印
              </button>
              <button
                onClick={() => {
                  setTasks([])
                  setStep('select')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isAcademicMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                ← 重选
              </button>
            </div>
          </div>

          <TaskDisplay
            tasks={tasks}
            onSubmitAnswer={handleSubmitAnswer}
            isAcademicMode={isAcademicMode}
            CROSS_FILE_INDEX={{}}
            errorNotebook={[]}
          />

          <div className="flex justify-end pt-2">
            <button
              onClick={handleFinishAssessment}
              disabled={!allSubmitted}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                allSubmitted
                  ? isAcademicMode
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg'
                  : isAcademicMode
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {allSubmitted ? '📊 查看评估结果' : `请完成所有题目 (${submittedCount}/${tasks.length})`}
            </button>
          </div>

          <PrintPreview
            tasks={tasks}
            isOpen={showPrintPreview}
            onClose={() => setShowPrintPreview(false)}
            isAcademicMode={isAcademicMode}
            title="摸底测试"
          />
        </>
      )}

      {step === 'result' && results && (
        <>
          <div className={`flex items-center gap-2 py-2 px-1`}>
            <span className="text-lg">📊</span>
            <h3 className={`font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
              评估结果
            </h3>
          </div>

          <div className="space-y-3">
            {results.map(motif => (
              <div
                key={motif.motifId}
                className={`rounded-lg border p-4 ${
                  isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                      {motif.motifId} {motif.motifName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                      motif.overallStatus === 'green'
                        ? 'bg-emerald-100 text-emerald-700'
                        : motif.overallStatus === 'yellow'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                    }`}>
                      {motif.level}
                    </span>
                    <span className={`text-sm font-mono font-bold ${
                      motif.elo >= 1801 ? 'text-emerald-600' : motif.elo >= 1400 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      ELO: {motif.elo}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {motif.variations.map(v => (
                    <div
                      key={v.variationId}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                        isAcademicMode ? 'bg-slate-50' : 'bg-zinc-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          v.correct
                            ? 'bg-emerald-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          {v.correct ? '✓' : '✗'}
                        </span>
                        <span className={isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}>
                          {v.specName} → {v.varName}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${
                        v.correct
                          ? 'text-emerald-600'
                          : 'text-red-500'
                      }`}>
                        {v.correct ? '已掌握 (跳过)' : '薄弱 (建议练习)'}
                      </span>
                    </div>
                  ))}
                </div>

                {motif.overallStatus === 'yellow' && (
                  <div className={`mt-3 p-2 rounded-lg text-xs ${
                    isAcademicMode ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-900/20 text-amber-400 border border-amber-700'
                  }`}>
                    💡 修补建议：你已掌握部分变例，仅需针对红色标记的薄弱项进行专项练习，补完短板即可升级！
                  </div>
                )}

                {motif.overallStatus === 'red' && (
                  <div className={`mt-3 p-2 rounded-lg text-xs ${
                    isAcademicMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-900/20 text-red-400 border border-red-700'
                  }`}>
                    📖 建议路径：从L2基础概念开始系统学习，逐步建立知识体系。
                  </div>
                )}

                {motif.overallStatus === 'green' && (
                  <div className={`mt-3 p-2 rounded-lg text-xs ${
                    isAcademicMode ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-900/20 text-emerald-400 border border-emerald-700'
                  }`}>
                    🎉 恭喜！该母题所有变例均已掌握，可直接进入L3进阶训练，冲击L4！
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setTasks([])
                setResults(null)
                setStep('select')
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isAcademicMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              重新测评
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isAcademicMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              ✓ 完成
            </button>
          </div>
        </>
      )}

      {showHistory && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowHistory(false)}
        >
          <div
            className={`max-w-4xl w-full max-h-[85vh] overflow-hidden mx-4 rounded-xl border shadow-2xl ${
              isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isAcademicMode ? 'border-slate-200' : 'border-zinc-700'
            }`}>
              <div>
                <h3 className={`text-lg font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                  📋 摸底考试历史记录
                </h3>
                <p className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                  共 {assessmentHistory.length} 次摸底记录
                </p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className={`p-2 rounded-lg ${isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
              {selectedHistory ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedHistory(null)}
                    className={`text-sm ${isAcademicMode ? 'text-blue-600 hover:underline' : 'text-blue-400 hover:underline'}`}
                  >
                    ← 返回历史列表
                  </button>
                  <div className={`rounded-lg border p-4 ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className={`text-sm font-medium ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                          {selectedHistory.dateDisplay}
                        </p>
                        <p className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                          母题: {selectedHistory.motifNames.join('、')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedHistory.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${
                            isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              task.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {task.isCorrect ? '✓' : '✗'}
                            </span>
                            <span className={`text-sm ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                              {task.motifName} · {task.specName} · {task.varName}
                            </span>
                          </div>
                          <div className={`text-sm ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                            <div className="mb-2">
                              <span className="font-medium">题目：</span>
                              <div className="mt-1 p-2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                                <LatexRenderer content={task.question || ''} />
                              </div>
                            </div>
                            <div className="mb-2">
                              <span className="font-medium">正确答案：</span>
                              <div className="mt-1 p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                                <LatexRenderer content={task.answer || ''} />
                              </div>
                            </div>
                            <div className={task.isCorrect ? 'text-emerald-600' : 'text-red-600'}>
                              <span className="font-medium">你的答案：</span>
                              {task.userAnswer ? (
                                <div className="mt-1 p-2 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                                  <LatexRenderer content={task.userAnswer} />
                                </div>
                              ) : '(未作答)'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {assessmentHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isAcademicMode
                          ? 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                          : 'bg-zinc-800 border-zinc-700 hover:border-blue-500 hover:bg-blue-900/20'
                      }`}
                      onClick={() => setSelectedHistory(entry)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                            {entry.dateDisplay}
                          </p>
                          <p className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                            {entry.motifNames.join('、')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                              {entry.motifResults.length} 个母题
                            </p>
                            <p className={`text-xs font-medium ${
                              entry.motifResults.some(r => r.overallStatus === 'green') ? 'text-emerald-600' :
                              entry.motifResults.some(r => r.overallStatus === 'yellow') ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {entry.motifResults.filter(r => r.overallStatus === 'green').length} 绿 /{' '}
                              {entry.motifResults.filter(r => r.overallStatus === 'yellow').length} 黄 /{' '}
                              {entry.motifResults.filter(r => r.overallStatus === 'red').length} 红
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('确定要删除这次摸底记录吗？')) {
                                setAssessmentHistory(prev => prev.filter(h => h.id !== entry.id))
                              }
                            }}
                            className={`p-1.5 rounded text-xs ${
                              isAcademicMode ? 'hover:bg-red-100 text-red-500' : 'hover:bg-red-900/30 text-red-400'
                            }`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartAssessment
