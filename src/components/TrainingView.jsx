import { useState, useContext, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Target, AlertTriangle, Package, Loader2, ChevronRight, Send, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { ThemeContext } from '../App'
import tacticalMapsData from '../data/tacticalMaps.json'
import eloEngine from '../utils/eloEngine'

const API_KEY = import.meta.env.VITE_QWEN_API_KEY
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const MODEL_NAME = 'qwen-plus'

const GRADE_ZONE_MAPPING = {
  '高一': ['zone_outer'],
  '高二': ['zone_outer', 'zone_middle'],
  '高三': ['zone_outer', 'zone_middle', 'zone_inner'],
}

const getGradeZones = (grade) => {
  const zoneIds = GRADE_ZONE_MAPPING[grade] || GRADE_ZONE_MAPPING['高三']
  return zoneIds.map(zoneId => {
    const map = tacticalMapsData.tactical_maps.find(m => m.map_id === zoneId)
    return map ? map.map_id : null
  }).filter(Boolean)
}

const ELO_CHANGES = { 'S': 30, 'A': 15, 'B': -45, 'C': -90 }
const PENALTY_RATIO = 1.5

const ELO_CAPS = {
  L2: 1000,
  L3: 1800,
  L4: 2500,
}

const LEVEL_THRESHOLDS = {
  L1: { min: 0, max: 1000 },
  L2: { min: 1001, max: 1800 },
  L3: { min: 1801, max: 2500 },
  L4: { min: 2501, max: 3000 },
}

const getLevelByElo = (elo) => {
  if (elo >= 2501) return 'L4'
  if (elo >= 1801) return 'L3'
  if (elo >= 1001) return 'L2'
  return 'L1'
}

const getAllBenchmarks = (specialties) => {
  if (!specialties || specialties.length === 0) return []
  const benchmarks = []
  specialties.forEach(spec => {
    spec.variations?.forEach(v => {
      v.master_benchmarks?.forEach(b => {
        benchmarks.push({
          ...b,
          spec_id: spec.spec_id,
          spec_name: spec.spec_name,
          var_id: v.var_id,
          var_name: v.name
        })
      })
    })
  })
  return benchmarks
}

const getEloCapFromSpecialties = (specialties) => {
  const benchmarks = getAllBenchmarks(specialties)
  if (benchmarks.length === 0) return 1000
  
  const hasNonGreenL2 = benchmarks.some(b => b.level === 'L2' && b.is_mastered !== true)
  const hasNonGreenL3 = benchmarks.some(b => b.level === 'L3' && b.is_mastered !== true)
  const hasNonGreenL4 = benchmarks.some(b => b.level === 'L4' && b.is_mastered !== true)
  
  if (hasNonGreenL2) return ELO_CAPS.L2
  if (hasNonGreenL3) return ELO_CAPS.L3
  if (hasNonGreenL4) return ELO_CAPS.L4
  
  return 3000
}

const getUnmasteredBenchmarkName = (specialties) => {
  const benchmarks = getAllBenchmarks(specialties)
  if (benchmarks.length === 0) return null
  
  const unmasteredL4 = benchmarks.find(b => b.level === 'L4' && b.is_mastered !== true)
  if (unmasteredL4) return unmasteredL4.var_name
  
  const unmasteredL3 = benchmarks.find(b => b.level === 'L3' && b.is_mastered !== true)
  if (unmasteredL3) return unmasteredL3.var_name
  
  const unmasteredL2 = benchmarks.find(b => b.level === 'L2' && b.is_mastered !== true)
  if (unmasteredL2) return unmasteredL2.var_name
  
  return null
}

const hasUnmasteredBenchmarks = (specialties) => {
  const benchmarks = getAllBenchmarks(specialties)
  if (benchmarks.length === 0) return false
  return benchmarks.some(b => b.is_mastered !== true)
}

function TrainingView({ tacticalData, currentGrade, onBattleComplete, onNavigate }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [trainingPaper, setTrainingPaper] = useState(null)
  const [currentTargetName, setCurrentTargetName] = useState(null)
  const [currentTargets, setCurrentTargets] = useState([])
  const [currentPracticedSubs, setCurrentPracticedSubs] = useState([])
  const [userAnswer, setUserAnswer] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState(null)
  const [lastGrade, setLastGrade] = useState(null)
  const [lockWarning, setLockWarning] = useState(null)
  const [antiGrindWarning, setAntiGrindWarning] = useState(null)
  const { isAcademicMode } = useContext(ThemeContext)

  const allowedZones = getGradeZones(currentGrade)

  const filteredMaps = useMemo(() => {
    return tacticalData?.tactical_maps?.filter((map) => allowedZones.includes(map.map_id)) || []
  }, [tacticalData, allowedZones])

  const weakTargets = filteredMaps.flatMap((map) =>
    map.encounters.filter(
      (e) => e.health_status === 'bleeding' || e.gear_level === 'L1' || e.gear_level === 'L2'
    )
  )

  const generatePaper = async (targets, mode = 'all') => {
    if (!targets || targets.length === 0) return

    setIsGenerating(true)
    setTrainingPaper(null)
    setCurrentTargets(targets)
    setCurrentTargetName(mode === 'single' ? targets[0].target_name : `${targets.length}个薄弱点`)
    setUserAnswer('')
    setDiagnosisResult(null)
    setLastGrade(null)

    const allPracticedSubs = []
    const tacticalPrompts = targets.map(t => {
      const benchmarks = getAllBenchmarks(t.specialties)
      if (benchmarks.length > 0) {
        const unmasteredBenchmarks = benchmarks.filter(b => !b.is_mastered)
        if (unmasteredBenchmarks.length > 0) {
          unmasteredBenchmarks.forEach(b => {
            allPracticedSubs.push({
              targetId: t.target_id,
              subId: b.id || b.legacy_id,
              levelReq: b.level
            })
          })
          const subPrompts = unmasteredBenchmarks.map(b => 
            `【致命弱点：${b.var_name}】 -> 出题指令：${b.ai_prompt || '基础训练'}`
          ).join('\n')
          return `【母题：${t.target_name}】常规技能已掌握，但以下二级指标待突破：\n${subPrompts}`
        }
        const masteredNames = benchmarks.filter(b => b.is_mastered).map(b => b.var_name).join('、')
        return `【母题：${t.target_name}】所有二级指标已掌握（${masteredNames}），出综合提升题。`
      }
      return `【目标：${t.target_name}】 -> 出题指令：${t.ai_tactical_prompt || '出综合题'}`
    }).join('\n\n')
    
    setCurrentPracticedSubs(allPracticedSubs)

    const systemPrompt = isAcademicMode
      ? `你现在是资深数学教师，专门为学生定制专项训练卷。

【最高机密：出题协议】
针对每个薄弱点，必须严格遵循对应的出题指令进行出题（包含设定的底座与陷阱）：
${tacticalPrompts}

【防暴走强制要求】
1. 绝不允许自由发挥！严格按指令构造陷阱。
2. 你必须在内部自行验算，确保题目条件完备、数据算得通，但绝不要输出验算过程！
3. 数学公式必须使用 LaTeX 格式，用 $...$ 包裹行内公式，用 $$...$$ 包裹独立公式。
4. 直接输出排版精美的 Markdown 试卷，格式要求：
   - 标题：# 今日专属数学专项训练卷
   - 每道题用 ## 题号 标注
   - 题目内容清晰，不要附带答案
5. 不要输出任何 <draft>、验算过程、思考过程等内容！只输出纯净的试卷！`
      : `你现在是暗区军火商"老乔"。特遣队员的雷达扫描出了以下薄弱点，请定制【今日靶场实战卷】。

【最高机密：出题协议】
针对每个弱点，必须严格遵循对应的战术指令进行出题（包含设定的底座与陷阱）：
${tacticalPrompts}

【防暴走强制要求】
1. 绝不允许自由发挥！严格按指令构造陷阱。
2. 你必须在内部自行验算，确保题目条件完备、数据算得通，但绝不要输出验算过程！
3. 数学公式必须使用 LaTeX 格式，用 $...$ 包裹行内公式，用 $$...$$ 包裹独立公式。
4. 直接输出排版精美的 Markdown 试卷，格式要求：
   - 标题：# 今日靶场实战卷
   - 每道题用 ## 目标X 标注
   - 题目内容清晰，不要附带答案
5. 不要输出任何 <draft>、验算过程、思考过程等内容！只输出纯净的试卷！`

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: isAcademicMode ? '请生成今日专属训练卷！' : '请生成今日专属实战卷！' },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }

      const data = await response.json()
      setTrainingPaper(data.choices[0].message.content)
    } catch (error) {
      console.error('组卷失败:', error)
      setTrainingPaper(`**组卷失败**\n\n错误信息：${error.message}\n\n请检查网络连接后重试。`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSingleTarget = (target) => {
    generatePaper([target], 'single')
  }

  const handleAllTargets = () => {
    generatePaper(weakTargets, 'all')
  }

  const handleEvaluate = async () => {
    if (!userAnswer.trim() || currentTargets.length === 0) return

    setIsEvaluating(true)
    setDiagnosisResult(null)

    const tacticalPrompts = currentTargets.map(t => t.ai_tactical_prompt).join('\n')
    const targetNames = currentTargets.map(t => t.target_name).join('、')

    const evaluatePrompt = `你现在是${isAcademicMode ? '资深数学教研组长' : '暗区战术联络人"老乔"'}。

【当前任务】特遣队员刚刚挑战了这道题目：
${trainingPaper}

该题目的底层陷阱设计图纸为：
${tacticalPrompts}

特遣队员提交的推演过程为：
"${userAnswer}"

【批改与诊断协议】
态度极其严厉/冷酷，一针见血。
对照"陷阱设计图纸"，精准判断他有没有踩坑（比如有没有漏掉定义域、有没有讨论判别式、是不是算错了符号）。
给出你的战术分析（指出死因，或表扬其排雷能力）。

【最高机密：必须执行的格式化结算】
在你长篇大论的点评结束后的最后一行，你必须独立换行，输出以下四种结算代码之一，绝不能包含其他字符：
满分排雷，逻辑严密 -> 输出：${isAcademicMode ? '[系统评级: S]' : '[战术结算: S]'}
过程稍有瑕疵，但大方向对 -> 输出：${isAcademicMode ? '[系统评级: A]' : '[战术结算: A]'}
踩中陷阱，或出现中级计算失误 -> 输出：${isAcademicMode ? '[系统评级: B]' : '[战术结算: B]'}
完全不会，或者犯了极其低级的马虎 -> 输出：${isAcademicMode ? '[系统评级: C]' : '[战术结算: C]'}`

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: 'system', content: evaluatePrompt },
            { role: 'user', content: isAcademicMode ? '请批改并给出评级！' : '老乔，请结算！' },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }

      const data = await response.json()
      const llmResponse = data.choices[0].message.content
      handleEvaluateComplete(llmResponse)
    } catch (error) {
      console.error('批改失败:', error)
      setDiagnosisResult(`**批改失败**\n\n错误信息：${error.message}\n\n请检查网络连接后重试。`)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleEvaluateComplete = (llmResponse) => {
    const match = llmResponse.match(/\[(?:战术结算|系统评级):\s*([SABC])\]/)
    
    setDiagnosisResult(llmResponse)
    setLockWarning(null)
    setAntiGrindWarning(null)

    if (match) {
      const grade = match[1]
      setLastGrade(grade)
      
      let eloChange = ELO_CHANGES[grade] || 0
      const newHealthStatus = (grade === 'S' || grade === 'A') ? 'healthy' : 'bleeding'
      const isCorrect = grade === 'S' || grade === 'A'

      if (onBattleComplete && currentTargets.length > 0) {
        const masteredSubIds = []
        
        currentTargets.forEach((target) => {
          let finalEloChange = eloChange
          
          const benchmarks = getAllBenchmarks(target.specialties)
          if (benchmarks.length > 0) {
            const unmasteredBenchmarks = benchmarks.filter(b => !b.is_mastered)
            const masteredBenchmarks = benchmarks.filter(b => b.is_mastered)
            
            if (eloChange > 0 && unmasteredBenchmarks.length > 0) {
              const eloCap = getEloCapFromSpecialties(target.specialties)
              const trapName = getUnmasteredBenchmarkName(target.specialties)
              
              if (target.elo_score >= eloCap) {
                finalEloChange = 0
                setLockWarning({
                  trapName,
                  eloCap,
                  currentElo: target.elo_score,
                })
              }
            }
            
            if (eloChange > 0 && masteredBenchmarks.length > 0 && unmasteredBenchmarks.length > 0) {
              finalEloChange = 0
              setAntiGrindWarning(true)
            }
            
            if (isCorrect && unmasteredBenchmarks.length > 0) {
              unmasteredBenchmarks.forEach(b => {
                masteredSubIds.push(b.id || b.legacy_id)
              })
            }
          }
          
          onBattleComplete({
            targetId: target.target_id,
            eloChange: finalEloChange,
            newHealthStatus,
            grade,
            masteredSubIds,
          })
        })
      }
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'S': return 'text-amber-500'
      case 'A': return 'text-purple-500'
      case 'B': return 'text-blue-500'
      case 'C': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getGradeBg = (grade) => {
    switch (grade) {
      case 'S': return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700'
      case 'A': return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
      case 'B': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
      case 'C': return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
      default: return 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700'
    }
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 overflow-y-auto">
      <div className="p-6 max-w-4xl mx-auto">
        <header className="mb-6">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className={`flex items-center gap-1 text-sm mb-3 ${
              isAcademicMode ? 'text-blue-600 hover:text-blue-700' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
            返回知识图谱
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Target className={`w-6 h-6 ${isAcademicMode ? 'text-amber-600' : 'text-orange-500'}`} />
            <h1 className={`text-xl font-bold ${isAcademicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
              {isAcademicMode ? '每日训练' : '每日靶场'}
            </h1>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${
              currentGrade === '高三' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
              currentGrade === '高二' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
              'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
            }`}>
              {currentGrade}
            </span>
          </div>
          <p className={`text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
            {isAcademicMode ? 'DAILY TRAINING v2.0' : 'DAILY TRAINING GROUND v2.0'}
          </p>
        </header>

        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className={`text-sm font-semibold uppercase tracking-wider ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              {isAcademicMode
                ? `薄弱点扫描：发现 ${weakTargets.length} 个待强化知识点（点击单独训练）`
                : `战区弱点扫描：发现 ${weakTargets.length} 个高价值目标（点击单独打击）`
              }
            </h2>
          </div>

          {weakTargets.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {weakTargets.map((target, index) => {
                const eloCap = getEloCapFromSpecialties(target.specialties)
                const isLocked = target.elo_score >= eloCap && hasUnmasteredBenchmarks(target.specialties)
                const trapName = getUnmasteredBenchmarkName(target.specialties)
                const benchmarks = getAllBenchmarks(target.specialties)
                
                return (
                  <button
                    key={`${target.target_id}-${index}`}
                    onClick={() => handleSingleTarget(target)}
                    disabled={isGenerating || isEvaluating}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      (isGenerating || isEvaluating) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                    } ${
                      target.health_status === 'bleeding'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 hover:border-red-400 dark:hover:border-red-400'
                        : isAcademicMode
                          ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
                          : 'bg-orange-900/20 border-orange-500/30 hover:border-orange-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {target.health_status === 'bleeding' && (
                          <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse flex-shrink-0" />
                        )}
                        {isLocked && (
                          <span className="text-xs" title={`需突破【${trapName}】以晋级`}>🔒</span>
                        )}
                        <span className={`text-sm ${isAcademicMode ? 'text-slate-700' : 'text-zinc-200'}`}>{target.target_name}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>{target.gear_level}</span>
                      <span className={`text-xs ${isAcademicMode ? 'text-slate-300' : 'text-zinc-600'}`}>|</span>
                      <span className={`text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                        ELO {target.elo_score}
                        {isLocked && <span className="text-red-500 ml-1">(锁定)</span>}
                      </span>
                    </div>
                    {benchmarks.length > 0 && (
                      <div className="flex items-center gap-1">
                        {benchmarks.map((b) => {
                          const displayTitle = b.level === 'L2' ? `[基准] ${b.var_name}` : b.var_name
                          return (
                            <span
                              key={b.id || b.legacy_id}
                              title={displayTitle}
                              className={`w-2 h-2 rounded-full cursor-pointer ${
                                b.is_mastered === true
                                  ? 'bg-emerald-500'
                                  : 'bg-red-500 animate-pulse'
                              }`}
                            />
                          )
                        })}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className={`rounded-lg border p-8 text-center ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <Target className={`w-12 h-12 mx-auto mb-3 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-600'}`} />
              <p className={isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}>暂无薄弱点</p>
              <p className={`text-xs mt-1 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-600'}`}>继续保持，稳步提升！</p>
            </div>
          )}
        </section>

        {weakTargets.length > 1 && !trainingPaper && (
          <section className="mb-6">
            <button
              onClick={handleAllTargets}
              disabled={isGenerating || isEvaluating}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                (isGenerating || isEvaluating)
                  ? isAcademicMode
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  : isAcademicMode
                    ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isAcademicMode ? '正在生成试卷...' : '正在呼叫空投...'}
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  {isAcademicMode 
                    ? `一键生成全部（${weakTargets.length}个薄弱点）` 
                    : `呼叫空投：一键打击全部（${weakTargets.length}个目标）`
                  }
                </>
              )}
            </button>
          </section>
        )}

        {trainingPaper && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Package className={`w-4 h-4 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-500'}`} />
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                {isAcademicMode ? `学习白板 · ${currentTargetName}` : `战术白板 · ${currentTargetName}`}
              </h2>
            </div>
            <div className={`border p-6 rounded-lg ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'}`}>
              <div className={`prose prose-sm max-w-none ${
                isAcademicMode
                  ? 'prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-blue-600 prose-code:text-blue-600'
                  : 'prose-invert prose-emerald prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-strong:text-emerald-400 prose-code:text-emerald-300'
              }`}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                >
                  {trainingPaper}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        )}

        {trainingPaper && !diagnosisResult && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Send className={`w-4 h-4 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-500'}`} />
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                {isAcademicMode ? '答题区 · 提交批改' : '作战记录 · 呼叫老乔结算'}
              </h2>
            </div>
            <div className={`border rounded-lg p-4 ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'}`}>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={isAcademicMode 
                  ? '请输入你的推演步骤，或在此描述你的计算过程...' 
                  : '请特遣队员输入推演步骤，或在此描述你的计算过程...'
                }
                className={`w-full h-40 p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 ${
                  isAcademicMode 
                    ? 'bg-slate-50 border-slate-200 focus:ring-blue-500 focus:border-blue-500 text-slate-700 placeholder-slate-400' 
                    : 'bg-zinc-800 border-zinc-700 focus:ring-emerald-500 focus:border-emerald-500 text-zinc-200 placeholder-zinc-500'
                }`}
                disabled={isEvaluating}
              />
              <button
                onClick={handleEvaluate}
                disabled={!userAnswer.trim() || isEvaluating}
                className={`mt-4 w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  !userAnswer.trim() || isEvaluating
                    ? isAcademicMode
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : isAcademicMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-[0.98] shadow-lg'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white active:scale-[0.98] shadow-lg'
                }`}
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isAcademicMode ? '正在批改中...' : '老乔正在结算...'}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {isAcademicMode ? '提交批改' : '呼叫老乔结算'}
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {diagnosisResult && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              {lastGrade && (lastGrade === 'S' || lastGrade === 'A') ? (
                <CheckCircle className={`w-4 h-4 ${lastGrade === 'S' ? 'text-amber-500' : 'text-purple-500'}`} />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                {isAcademicMode ? '批改结果' : '战术结算报告'}
              </h2>
              {lastGrade && (
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold border ${getGradeBg(lastGrade)} ${getGradeColor(lastGrade)}`}>
                  {lastGrade}级
                </span>
              )}
            </div>
            
            {lastGrade && (
              <div className={`mb-4 p-4 rounded-lg border ${getGradeBg(lastGrade)}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${getGradeColor(lastGrade)}`}>
                    {lastGrade === 'S' ? '🏆' : lastGrade === 'A' ? '⭐' : lastGrade === 'B' ? '📝' : '⚠️'}
                  </span>
                  <div>
                    <p className={`font-semibold ${getGradeColor(lastGrade)}`}>
                      {lastGrade === 'S' ? '完美排雷！逻辑严密！' :
                       lastGrade === 'A' ? '过程稍有瑕疵，但大方向正确' :
                       lastGrade === 'B' ? '踩中陷阱，需要强化训练' :
                       '存在严重问题，建议重新学习'}
                    </p>
                    <p className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                      Elo 排位分 {ELO_CHANGES[lastGrade] > 0 ? '+' : ''}{ELO_CHANGES[lastGrade]} 分
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {antiGrindWarning && (
              <div className="mb-4 p-4 rounded-lg border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚫</span>
                  <div>
                    <p className="font-semibold text-orange-600 dark:text-orange-400">
                      虐菜不能变强！
                    </p>
                    <p className="text-xs text-orange-500 dark:text-orange-400">
                      你挑战的是已掌握的指标，但该母题下仍有红色未掌握的陷阱。请挑战闪红光的致命陷阱！
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {antiGrindWarning && (
              <div className="mb-4 p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📉</span>
                  <div>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      检测到战术重复，收益已衰减！
                    </p>
                    <p className="text-xs text-amber-500 dark:text-amber-400">
                      本次 Elo 增益已降至 33%。请直面红色核心变式以获取全额增益！
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {lockWarning && (
              <div className="mb-4 p-4 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      战力遭遇瓶颈！
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400">
                      你的常规战术已满级，但如果不攻克【{lockWarning.trapName}】，你将永远无法晋升下一等级！
                    </p>
                    <p className="text-xs text-red-400 dark:text-red-500 mt-1">
                      当前分数 {lockWarning.currentElo} 已达上限 {lockWarning.eloCap}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className={`border p-6 rounded-lg ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'}`}>
              <div className={`prose prose-sm max-w-none ${
                isAcademicMode
                  ? 'prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-blue-600'
                  : 'prose-invert prose-emerald prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-strong:text-emerald-400'
              }`}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                >
                  {diagnosisResult}
                </ReactMarkdown>
              </div>
            </div>
            
            <button
              onClick={() => {
                setTrainingPaper(null)
                setDiagnosisResult(null)
                setUserAnswer('')
                setLastGrade(null)
                setCurrentTargets([])
                setLockWarning(null)
                setAntiGrindWarning(null)
              }}
              className={`mt-4 w-full py-3 rounded-lg font-semibold transition-all ${
                isAcademicMode
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              继续训练
            </button>
          </section>
        )}

        {!trainingPaper && !isGenerating && weakTargets.length === 0 && (
          <section className="mt-8">
            <div className={`border p-6 rounded-lg text-center ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <p className={isAcademicMode ? 'text-slate-500 mb-2' : 'text-zinc-400 mb-2'}>所有模块状态良好！</p>
              <p className={`text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-600'}`}>
                当有模块处于 L1/L2 等级或"需强化"状态时，这里会显示薄弱点
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default TrainingView
