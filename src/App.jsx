import { useState, useRef, useEffect, createContext, useContext } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { X, Paperclip, LayoutDashboard, Crosshair, Target, Trophy, AlertCircle, Moon, Sun, ChevronDown, Settings, BookOpen, Calendar } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import initialTacticalData from './data/tacticalMaps.json'
import strategyLib from './data/strategy_lib.json'
import TacticalDashboard from './components/TacticalDashboard'
import TrainingView from './components/TrainingView'
import StrategyHub from './components/StrategyHub'
import BattleScanner from './components/BattleScanner'
import WeeklyMission from './components/WeeklyMission'
import eloEngine from './utils/eloEngine'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const API_KEY = import.meta.env.VITE_QWEN_API_KEY
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const MODEL_NAME = 'qwen-plus'
const VISION_MODEL_NAME = 'qwen-vl-max'

const VISION_DIAGNOSIS_PROMPT = `你是一位中国顶尖的高中数学教研组长。请仔细观察这张学生上传的数学题目/错题图片。
请匹配国家新教材高考数学体系，判断这道题属于哪个核心母题，并给出极其严厉、专业的学术诊断。
必须返回严格的纯 JSON 格式（不要包含任何 Markdown 标记如 \`\`\`json，不要解释），格式如下：
{
  "targetId": "M11",
  "greenSubIds": [],
  "message": "一针见血的教研评语，例如：'极值点偏移特征未识别，代数变形能力处于 L2 以下水平，必须前往武器库补充指对同构模版。'"
}

可用的母题ID列表：
M01 集合、逻辑与复数, M02 不等式性质, M03 函数概念与性质, M04 指对数函数与运算, M05 平面向量,
M06 三角函数基础, M07 解三角形综合, M08 数列基础与求和, M09 立体几何基础, M10 解析几何基础,
M11 导数工具基础, M12 概率与统计综合, M13 解析几何综合压轴, M14 导数综合压轴, M15 数列综合压轴,
M16 计数原理与二项式, M17 创新思维与情境`

const EXP_MAP = { 'S': 50, 'A': 20, 'B': 5, 'C': -20 }

const LEVEL_THRESHOLDS = eloEngine.LEVEL_THRESHOLDS
const DECAY_CONFIG = eloEngine.DECAY_CONFIG
const MASTERY_CONFIG = eloEngine.MASTERY_CONFIG

const getDaysSincePractice = eloEngine.getDaysSincePractice

const checkSubTargetDecay = (sub) => {
  const decay = eloEngine.checkTimeDecay(sub)
  if (decay.decayed) {
    return { 
      ...sub, 
      is_mastered: 'warning',
      decayed_from: true,
      days_since_practice: decay.daysSincePractice
    }
  }
  return sub
}

const checkEncounterDecay = (encounter) => {
  if (!encounter.sub_targets) return encounter
  
  const updatedSubTargets = encounter.sub_targets.map(checkSubTargetDecay)
  const hasYellowWarning = updatedSubTargets.some(sub => sub.is_mastered === 'warning' && sub.decayed_from)
  
  let warningLevel = null
  if (hasYellowWarning) {
    const oldestYellow = updatedSubTargets
      .filter(sub => sub.is_mastered === 'warning' && sub.decayed_from)
      .sort((a, b) => (a.last_practice || 0) - (b.last_practice || 0))[0]
    
    if (oldestYellow) {
      const daysSince = getDaysSincePractice(oldestYellow.last_practice)
      if (daysSince >= DECAY_CONFIG.WARNING_THRESHOLD_DAYS) {
        warningLevel = 'critical'
      } else {
        warningLevel = 'attention'
      }
    }
  }
  
  return {
    ...encounter,
    sub_targets: updatedSubTargets,
    decay_warning: warningLevel
  }
}

const getLevelByElo = eloEngine.getLevelByElo

const getLevelSpan = (level) => {
  const thresholds = LEVEL_THRESHOLDS[level]
  return thresholds.max - thresholds.min + 1
}

const getMaxEloGain = (currentLevel) => {
  const span = getLevelSpan(currentLevel)
  return Math.round(span * 0.2)
}

const hasRedSubTarget = (subTargets) => {
  return subTargets.some(sub => sub.is_mastered === false)
}

const hasYellowSubTarget = (subTargets) => {
  return subTargets.some(sub => sub.is_mastered === 'warning')
}

const isNotGreen = (sub) => sub.is_mastered !== true

const getEloCeiling = eloEngine.getEloCeiling

const getLockedLevel = (subTargets) => {
  if (!subTargets || subTargets.length === 0) return 'L1'
  
  if (hasRedSubTarget(subTargets)) {
    const l2Subs = subTargets.filter(sub => sub.level_req === 'L2')
    const l3Subs = subTargets.filter(sub => sub.level_req === 'L3')
    const l4Subs = subTargets.filter(sub => sub.level_req === 'L4')
    
    const hasL2Red = l2Subs.some(sub => sub.is_mastered === false)
    const hasL3Red = l3Subs.some(sub => sub.is_mastered === false)
    const hasL4Red = l4Subs.some(sub => sub.is_mastered === false)
    
    if (hasL4Red || hasL3Red || hasL2Red) {
      const l2AllGreen = l2Subs.length > 0 && l2Subs.every(sub => sub.is_mastered === true)
      const l3AllGreen = l3Subs.length > 0 && l3Subs.every(sub => sub.is_mastered === true)
      
      if (l3AllGreen && l4Subs.length > 0 && hasL4Red) return 'L3'
      if (l2AllGreen && l3Subs.length > 0 && hasL3Red) return 'L2'
      if (l2Subs.length > 0 && hasL2Red) return 'L1'
    }
  }
  
  return null
}

const getLevelBySubTargets = (subTargets) => {
  if (!subTargets || subTargets.length === 0) return 'L1'
  
  const lockedLevel = getLockedLevel(subTargets)
  if (lockedLevel) return lockedLevel
  
  const l2Subs = subTargets.filter(sub => sub.level_req === 'L2')
  const l3Subs = subTargets.filter(sub => sub.level_req === 'L3')
  const l4Subs = subTargets.filter(sub => sub.level_req === 'L4')
  
  const l2AllGreen = l2Subs.length > 0 && l2Subs.every(sub => sub.is_mastered === true)
  const l3AllGreen = l3Subs.length > 0 && l3Subs.every(sub => sub.is_mastered === true)
  const l4AllGreen = l4Subs.length > 0 && l4Subs.every(sub => sub.is_mastered === true)
  
  if (l4AllGreen) return 'L4'
  if (l3AllGreen) return 'L3'
  if (l2AllGreen) return 'L2'
  
  const elo = calculateElo(subTargets)
  return getLevelByElo(elo)
}

const isEloCapped = (subTargets) => {
  if (!subTargets || subTargets.length === 0) return false
  
  const l2Subs = subTargets.filter(sub => sub.level_req === 'L2')
  if (l2Subs.length > 0 && l2Subs.some(isNotGreen)) return true
  
  const l3Subs = subTargets.filter(sub => sub.level_req === 'L3')
  if (l3Subs.length > 0 && l3Subs.some(isNotGreen)) return true
  
  const l4Subs = subTargets.filter(sub => sub.level_req === 'L4')
  if (l4Subs.length > 0 && l4Subs.some(isNotGreen)) return true
  
  return false
}

const calculateElo = (subTargets) => {
  if (!subTargets || subTargets.length === 0) return 800
  
  const stats = eloEngine.getEloStatistics(subTargets)
  
  let baseElo = 800
  const l2Subs = subTargets.filter(sub => sub.level_req === 'L2')
  const l3Subs = subTargets.filter(sub => sub.level_req === 'L3')
  const l4Subs = subTargets.filter(sub => sub.level_req === 'L4')
  
  const l2AllGreen = l2Subs.length > 0 && l2Subs.every(sub => sub.is_mastered === true)
  const l3AllGreen = l3Subs.length > 0 && l3Subs.every(sub => sub.is_mastered === true)
  const l4AllGreen = l4Subs.length > 0 && l4Subs.every(sub => sub.is_mastered === true)
  
  if (l4AllGreen) baseElo = LEVEL_THRESHOLDS.L4.min
  else if (l3AllGreen) baseElo = LEVEL_THRESHOLDS.L3.min
  else if (l2AllGreen) baseElo = LEVEL_THRESHOLDS.L2.min
  else {
    const l2HasWarning = l2Subs.some(sub => sub.is_mastered === 'warning')
    const l3HasWarning = l3Subs.some(sub => sub.is_mastered === 'warning')
    
    if (l3HasWarning && l2AllGreen) baseElo = LEVEL_THRESHOLDS.L2.min
    else if (l2HasWarning) baseElo = 800
  }
  
  let bonus = 0
  subTargets.forEach(sub => {
    if (sub.is_mastered === 'warning') {
      const levelScore = sub.level_req === 'L4' ? 100 : sub.level_req === 'L3' ? 60 : 40
      if (sub.decayed_from) {
        bonus += levelScore * DECAY_CONFIG.YELLOW_ELO_PENALTY
      } else {
        bonus += levelScore * 0.6
      }
    }
  })
  
  const ceiling = eloEngine.applyEloCeiling(baseElo + bonus, subTargets)
  return Math.min(Math.round(baseElo + bonus), ceiling)
}

const calculateDecayedElo = (subTargets) => {
  const currentElo = calculateElo(subTargets)
  
  let decayedAmount = 0
  subTargets.forEach(sub => {
    if (sub.is_mastered === 'warning' && sub.decayed_from) {
      const levelScore = sub.level_req === 'L4' ? 100 : sub.level_req === 'L3' ? 60 : 40
      decayedAmount += levelScore * (1 - DECAY_CONFIG.YELLOW_ELO_PENALTY)
    }
  })
  
  return {
    current: currentElo,
    potential: currentElo + Math.round(decayedAmount),
    decayed: Math.round(decayedAmount)
  }
}

const getWeaponInfo = (weaponId) => {
  if (!strategyLib) return null
  
  for (const category of strategyLib.categories) {
    for (const weapon of category.weapons || []) {
      if (weapon.id === weaponId) {
        return {
          id: weapon.id,
          name: weapon.name,
          category: category.name,
          categoryId: category.id,
          triggerKeywords: weapon.trigger_keywords,
          corePrinciple: weapon.core_principle,
          applicationScenarios: weapon.application_scenarios,
          pitfalls: weapon.pitfalls
        }
      }
    }
  }
  
  return null
}

const CATEGORY_TO_MOTIF = {
  'S-SET': 'M01',
  'S-COMP': 'M01',
  'S-INEQ': 'M02',
  'S-FUNC': 'M03',
  'S-LOG': 'M04',
  'S-VEC': 'M05',
  'S-TRIG': 'M06',
  'S-TRI': 'M07',
  'S-SEQ': 'M08',
  'S-SOLID': 'M09',
  'S-ANAL': 'M10',
  'S-DERIV': 'M11',
  'S-PROB': 'M12',
  'S-COMB': 'M16',
  'S-INNOV': 'M17',
}

const getWeaponProficiency = (weaponId, tacticalData) => {
  const weapon = getWeaponInfo(weaponId)
  if (!weapon || !tacticalData) return { exp: 0, proficiency: 0 }
  
  const motifId = CATEGORY_TO_MOTIF[weapon.categoryId]
  if (!motifId) return { exp: 0, proficiency: 0 }
  
  let totalExp = 0
  
  tacticalData.tactical_maps.forEach(map => {
    map.encounters.forEach(encounter => {
      if (encounter.target_id === motifId) {
        if (encounter.sub_targets) {
          encounter.sub_targets.forEach(sub => {
            if (sub.is_mastered === true) {
              totalExp += sub.level_req === 'L4' ? 40 : sub.level_req === 'L3' ? 25 : 15
            } else if (sub.is_mastered === 'warning') {
              totalExp += sub.level_req === 'L4' ? 20 : sub.level_req === 'L3' ? 12 : 8
            }
          })
        }
      }
    })
  })
  
  const proficiency = totalExp >= 200 ? 3 : totalExp >= 100 ? 2 : totalExp >= 40 ? 1 : 0
  return { exp: totalExp, proficiency }
}

const checkLowProficiencyWarning = (tacticalData) => {
  if (!tacticalData) return null
  
  const highFreqWeapons = ['S-DERIV-01', 'S-DERIV-02', 'S-DERIV-05', 'S-ANAL-01']
  
  for (const weaponId of highFreqWeapons) {
    const { exp, proficiency } = getWeaponProficiency(weaponId, tacticalData)
    const weapon = getWeaponInfo(weaponId)
    
    if (weapon && proficiency < 1 && exp < 30) {
      let stalledZone = ''
      const motifId = CATEGORY_TO_MOTIF[weapon.categoryId]
      
      for (const map of tacticalData.tactical_maps) {
        for (const encounter of map.encounters) {
          if (encounter.target_id === motifId) {
            if (encounter.elo_score < 1500 && encounter.elo_score > 800) {
              stalledZone = map.map_name
              break
            }
          }
        }
        if (stalledZone) break
      }
      
      if (stalledZone) {
        return {
          weaponName: weapon.name,
          zone: stalledZone,
          motif: motifId,
          exp
        }
      }
    }
  }
  
  return null
}

export const ThemeContext = createContext()
export const GradeContext = createContext()

export const useTheme = () => useContext(ThemeContext)
export const useGrade = () => useContext(GradeContext)

const DATA_VERSION = '10.5'

function App() {
  const [isAcademicMode, setIsAcademicMode] = useState(true)
  const [currentGrade, setCurrentGrade] = useState('高三')
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false)
  const [initModalOpen, setInitModalOpen] = useState(false)
  const [initGradeFilter, setInitGradeFilter] = useState('高三')
  const [initStates, setInitStates] = useState({})
  
  useEffect(() => {
    if (isAcademicMode) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  }, [isAcademicMode])

  const getSystemPrompt = (isAcademic) => {
    if (isAcademic) {
      return `你是一位拥有20年教学经验的省级重点高中数学教研组长。语气温和、极其严谨、循循善诱。

【沟通规范】
开场白：简洁地问候学生，例如："同学你好，我们来学习这个知识点。"
核心教学：使用苏格拉底提问法，每次只抛出一个数学启发式问题，引导学生自己推导下一步。不要直接给最终答案。
格式：所有的数学公式必须用标准的 LaTeX 格式（$ 或 $$）包裹。标准数学名词用【】包裹。

【最高机密：能力评级】当学生完全答对或掌握时，你必须在回复最后独立换行输出这串代码：[系统评级: S]（或A/B/C）。评级标准：S=完美掌握；A=基本正确有小瑕疵；B=需要提示才完成；C=概念不清需要重新讲解。代码绝对不能包含其他字符。`
    } else {
      return `你是一名高中数学教研组长，现在以战术联络人"老乔"的身份指导学生。

【沟通规范：严格隔离战术与数学】

开场白：仅在回复的第一句话使用战术问候，例如："特遣队员，你已进入【xxx】战区。"

核心教学：从第二句话开始，必须立刻收起游戏口吻，完全恢复为极其专业、严谨、循循善诱的高中数学名师！

词汇禁忌：在分析错题和数学推演的过程中，绝对禁止使用任何游戏术语（禁止使用掩体、爆头、流血、殉爆、防弹衣等词汇干扰数学概念）。数学就是数学！

教学法：使用苏格拉底提问法，每次只抛出一个数学启发式问题，引导学生自己推导下一步。不要直接给最终答案。

格式：所有的数学公式必须用标准的 LaTeX 格式（$ 或 $$）包裹。标准数学名词用【】包裹。

【致命指令：战术结算强制输出】无论你前面进行了多么复杂的推演，只要特遣队员的回答或推演是正确的，你【必须、绝对、一定】要在回复的最后一行独立输出这串代码：[战术结算: S]（或A/B/C）。这是系统的底层触发器，绝不能遗忘！评级标准：S=完美/一遍过；A=思路对但计算马虎/有瑕疵；B=在你的反复提示下勉强做对；C=彻底不会/概念崩溃。代码绝对不能包含其他多余字符。`
    }
  }

  const [tacticalData, setTacticalData] = useState(() => {
    const savedVersion = localStorage.getItem('tactical_data_version')
    if (savedVersion !== DATA_VERSION) {
      localStorage.removeItem('tactical_data')
      localStorage.setItem('tactical_data_version', DATA_VERSION)
      return initialTacticalData
    }
    const saved = localStorage.getItem('tactical_data')
    return saved ? JSON.parse(saved) : initialTacticalData
  })
  
  useEffect(() => {
    localStorage.setItem('tactical_data', JSON.stringify(tacticalData))
  }, [tacticalData])

  const [activeTab, setActiveTab] = useState('dashboard')
  const [highlightFormulaId, setHighlightFormulaId] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [currentTarget, setCurrentTarget] = useState(null)
  const [battleResult, setBattleResult] = useState(null)
  const [winStreak, setWinStreak] = useState(0)
  const [showStreakEffect, setShowStreakEffect] = useState(false)
  const [laoQiaoWarning, setLaoQiaoWarning] = useState(null)
  const fileInputRef = useRef(null)

  const [errorNotebook, setErrorNotebook] = useState(() => {
    const saved = localStorage.getItem('error_notebook')
    return saved ? JSON.parse(saved) : []
  })

  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    const saved = localStorage.getItem('weekly_plan')
    return saved ? JSON.parse(saved) : {
      activeMotifs: [],
      pendingErrors: [],
      weekStart: null,
      weekEnd: null
    }
  })

  useEffect(() => {
    localStorage.setItem('error_notebook', JSON.stringify(errorNotebook))
  }, [errorNotebook])

  useEffect(() => {
    localStorage.setItem('weekly_plan', JSON.stringify(weeklyPlan))
  }, [weeklyPlan])

  const generateWeeklyBundle = () => {
    const selectedMotifs = [];
    const addedMotifIds = new Set();

    // 辅助函数：根据 Elo 判断当前需要攻克的等级 (即"红灯"级别)
    const getTargetLevel = (elo) => {
      if (elo >= 3000) return null; // 满级通关，不需要再练
      if (elo >= 2500) return 'L4';
      if (elo >= 1800) return 'L3';
      if (elo >= 1001) return 'L2';
      return null; // 未激活
    };

    // 获取全局所有的 encounters 平铺列表，方便查询
    const allEncounters = tacticalData.tactical_maps.flatMap(map => map.encounters);

    // ==========================================
    // 优先级 1：优先错题所在领域 (未解决的错题)
    // ==========================================
    const unresolvedErrors = errorNotebook.filter(e => !e.resolved);
    unresolvedErrors.forEach(error => {
      const motifId = error.targetId;
      if (!addedMotifIds.has(motifId)) {
        const encounter = allEncounters.find(e => e.target_id === motifId);
        if (encounter) {
          const targetLevel = getTargetLevel(encounter.elo_score || 800);
          if (targetLevel) {
            selectedMotifs.push({
              motifId: encounter.target_id,
              motifName: encounter.target_name,
              targetLevel: targetLevel,
              source: 'error',
              elo: encounter.elo_score
            });
            addedMotifIds.add(motifId);
          }
        }
      }
    });

    // ==========================================
    // 优先级 2：勾选的母题 (必须 elo >= 1001 且未通关)
    // ==========================================
    (weeklyPlan.activeMotifs || []).forEach(motifId => {
      if (!addedMotifIds.has(motifId)) {
        const encounter = allEncounters.find(e => e.target_id === motifId);
        if (encounter) {
          const elo = encounter.elo_score || 800;
          const targetLevel = getTargetLevel(elo);
          if (elo >= 1001 && targetLevel) {
            selectedMotifs.push({
              motifId: encounter.target_id,
              motifName: encounter.target_name,
              targetLevel: targetLevel,
              source: 'active',
              elo: elo
            });
            addedMotifIds.add(motifId);
          }
        }
      }
    });

    // ==========================================
    // 优先级 3：底分兜底 (激活过 elo >= 1001，选最低的 2 个)
    // ==========================================
    const availableForBottom = allEncounters
      .filter(e => !addedMotifIds.has(e.target_id))
      .filter(e => (e.elo_score || 800) >= 1001 && getTargetLevel(e.elo_score || 800) !== null)
      .sort((a, b) => (a.elo_score || 800) - (b.elo_score || 800))
      .slice(0, 2); // 取最低的 2 个

    availableForBottom.forEach(encounter => {
      selectedMotifs.push({
        motifId: encounter.target_id,
        motifName: encounter.target_name,
        targetLevel: getTargetLevel(encounter.elo_score || 800),
        source: 'bottom_elo',
        elo: encounter.elo_score
      });
      addedMotifIds.add(encounter.target_id);
    });

    // 返回组装好的任务包，等待 AI 注入题目
    return {
      generatedAt: new Date().toISOString(),
      tasks: selectedMotifs // 这里面包含了本周需要训练的母题清单
    };
  }

  const addErrorToNotebook = (targetId, diagnosis, level) => {
    setErrorNotebook(prev => {
      const exists = prev.find(e => e.targetId === targetId && !e.resolved)
      if (exists) return prev
      
      return [...prev, {
        id: `err_${Date.now()}`,
        targetId,
        diagnosis,
        level: level || 'L2',
        addedAt: new Date().toISOString(),
        resolved: false
      }]
    })
  }

  const resolveError = (errorId) => {
    setErrorNotebook(prev => 
      prev.map(e => e.id === errorId ? { ...e, resolved: true, resolvedAt: new Date().toISOString() } : e)
    )
  }

  const setActiveMotifs = (motifIds) => {
    setWeeklyPlan(prev => ({
      ...prev,
      activeMotifs: motifIds,
      weekStart: prev.weekStart || new Date().toISOString(),
      weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }))
  }

  const getWeeklyStats = () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const weekErrors = errorNotebook.filter(e => 
      new Date(e.addedAt) >= weekAgo
    )
    
    const newErrors = weekErrors.filter(e => !e.resolved).length
    const resolvedErrors = weekErrors.filter(e => e.resolved).length
    
    let eloChanges = []
    let levelUps = 0
    
    for (const map of tacticalData.tactical_maps) {
      for (const encounter of map.encounters) {
        if (encounter.elo_score > 800) {
          eloChanges.push({
            targetId: encounter.target_id,
            targetName: encounter.target_name,
            elo: encounter.elo_score,
            level: encounter.gear_level
          })
        }
      }
    }
    
    const bleedingCount = tacticalData.tactical_maps
      .flatMap(m => m.encounters)
      .filter(e => e.health_status === 'bleeding').length

    return {
      newErrors,
      resolvedErrors,
      totalErrors: errorNotebook.filter(e => !e.resolved).length,
      eloChanges: eloChanges.slice(0, 5),
      bleedingCount,
      activeMotifsCount: weeklyPlan.activeMotifs.length
    }
  }

  const callLLM = async (historyMessages) => {
    const lastMessage = historyMessages[historyMessages.length - 1]
    const hasImage = lastMessage?.imageBase64

    let formattedMessages

    if (hasImage) {
      formattedMessages = [
        { role: 'system', content: getSystemPrompt(isAcademicMode) },
        ...historyMessages.slice(0, -1).map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: lastMessage.imageBase64 },
            },
            {
              type: 'text',
              text: lastMessage.content,
            },
          ],
        },
      ]
    } else {
      formattedMessages = [
        { role: 'system', content: getSystemPrompt(isAcademicMode) },
        ...historyMessages.map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
      ]
    }

    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: hasImage ? VISION_MODEL_NAME : MODEL_NAME,
          messages: formattedMessages,
        }),
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('LLM 调用错误:', error)
      return `通讯中断...错误代码：${error.message}`
    }
  }

  const processBattleResult = (responseText, targetId) => {
    const match = responseText.match(/\[(系统评级|战术结算):\s*([SABC])\]/)
    if (!match || !targetId) return { cleanText: responseText, settled: false }

    const grade = match[2]
    const expChange = EXP_MAP[grade]
    const cleanText = responseText.replace(/\[(系统评级|战术结算):\s*[SABC]\]/g, '').trim()

    updateTargetData(targetId, grade, expChange)

    return { cleanText, settled: true }
  }

  const updateTargetData = (targetId, grade, expChange, masteredSubIds = [], isDiminished = false) => {
    const isWin = grade === 'S' || grade === 'A'
    
    if (isWin) {
      setWinStreak(prev => {
        const newStreak = prev + 1
        if (newStreak >= 3) {
          setShowStreakEffect(true)
          setTimeout(() => setShowStreakEffect(false), 2000)
        }
        return newStreak
      })
    } else {
      setWinStreak(0)
    }
    
    setTacticalData((prevData) => {
      const newData = { ...prevData }
      for (const map of newData.tactical_maps) {
        const encounterIndex = map.encounters.findIndex((e) => e.target_id === targetId)
        if (encounterIndex !== -1) {
          const encounter = { ...map.encounters[encounterIndex] }
          const oldLevel = encounter.gear_level
          
          if (masteredSubIds.length > 0 && encounter.sub_targets) {
            encounter.sub_targets = encounter.sub_targets.map(sub => 
              masteredSubIds.includes(sub.sub_id)
                ? { ...sub, is_mastered: true, last_practice: new Date().toISOString() }
                : sub
            )
          }
          
          if (encounter.sub_targets) {
            encounter.sub_targets = encounter.sub_targets.map(sub => {
              if (sub.is_mastered === true || sub.is_mastered === 'warning') {
                return { ...sub, last_practice: new Date().toISOString() }
              }
              return sub
            })
          }
          
          const currentLevel = encounter.gear_level
          const currentElo = encounter.elo_score
          const eloCap = getEloCeiling(encounter.sub_targets || [])
          
          if (isWin && currentElo >= eloCap) {
            const nextLevel = { 'L1': 'L2', 'L2': 'L3', 'L3': 'L4' }[currentLevel]
            if (nextLevel) {
              setLaoQiaoWarning({
                currentLevel,
                nextLevel,
                message: `别白费力气了，低阶战斗已无法提升你的境界。去挑战 ${nextLevel} 陷阱，那里才有你需要的晋级能量！`
              })
            }
          }
          
          encounter.elo_score = calculateElo(encounter.sub_targets || [])
          encounter.total_raids += 1
          encounter.gear_level = getLevelBySubTargets(encounter.sub_targets || [])
          encounter.health_status = encounter.elo_score >= 2501 ? 'healthy' : 'bleeding'
          
          const currentWins = Math.round(encounter.win_rate * (encounter.total_raids - 1))
          encounter.win_rate = (currentWins + (isWin ? 1 : 0)) / encounter.total_raids
          
          const levelUp = encounter.gear_level !== oldLevel && encounter.gear_level > oldLevel
          
          const finalExpChange = isDiminished ? Math.round(expChange * 0.33) : expChange
          
          const streakBonus = winStreak >= 3 ? 1.5 : 1
          const bonusExp = isWin ? Math.round(finalExpChange * (streakBonus - 1)) : 0
          
          setBattleResult({
            grade,
            expChange: finalExpChange + bonusExp,
            newElo: encounter.elo_score,
            levelUp,
            newLevel: encounter.gear_level,
            targetName: encounter.target_name,
            isDiminished,
            isCapped: isEloCapped(encounter.sub_targets),
            winStreak: winStreak + (isWin ? 1 : 0),
          })
          
          map.encounters[encounterIndex] = encounter
          break
        }
      }
      return newData
    })
  }

  const handleBattleComplete = ({ targetId, eloChange, newHealthStatus, grade, masteredSubIds = [] }) => {
    let isDiminished = false
    
    if (grade === 'S' || grade === 'A') {
      for (const map of tacticalData.tactical_maps) {
        const encounter = map.encounters.find(e => e.target_id === targetId)
        if (encounter && encounter.sub_targets) {
          const hasNonGreenSub = encounter.sub_targets.some(sub => sub.is_mastered !== true)
          
          if (hasNonGreenSub && masteredSubIds.length === 0) {
            isDiminished = true
          }
          break
        }
      }
    }
    
    updateTargetData(targetId, grade, eloChange, masteredSubIds, isDiminished)
  }

  const handleCalibrate = (targetId, level) => {
    setTacticalData((prevData) => {
      const newData = { ...prevData }
      for (const map of newData.tactical_maps) {
        const encounterIndex = map.encounters.findIndex((e) => e.target_id === targetId)
        if (encounterIndex !== -1) {
          const encounter = { ...map.encounters[encounterIndex] }
          
          if (encounter.sub_targets && encounter.sub_targets.length > 0) {
            const now = new Date().toISOString()
            const updatedSubTargets = encounter.sub_targets.map((sub, index) => {
              let isMastered = false
              
              if (level === 'L1') {
                isMastered = false
              } else if (level === 'L2') {
                if (sub.sub_name.includes('常规') || sub.sub_name.includes('基础') || sub.sub_name.includes('底座')) {
                  isMastered = true
                } else if (index === 0) {
                  isMastered = true
                }
              } else if (level === 'L3') {
                isMastered = index < encounter.sub_targets.length - 1 ? true : 'warning'
              } else if (level === 'L4') {
                isMastered = true
              }
              
              return { 
                ...sub, 
                is_mastered: isMastered,
                last_practice: (isMastered === true || isMastered === 'warning') ? now : sub.last_practice
              }
            })
            
            encounter.sub_targets = updatedSubTargets
          }
          
          encounter.elo_score = calculateElo(encounter.sub_targets)
          encounter.gear_level = getLevelBySubTargets(encounter.sub_targets)
          encounter.health_status = encounter.elo_score >= 1700 ? 'healthy' : 'bleeding'
          
          map.encounters[encounterIndex] = encounter
          break
        }
      }
      return newData
    })
  }

  const handleRecalculateElo = (targetId) => {
    setTacticalData((prevData) => {
      const newData = { ...prevData }
      for (const map of newData.tactical_maps) {
        const encounter = map.encounters.find(e => e.target_id === targetId)
        if (encounter) {
          const now = new Date().toISOString()
          if (encounter.sub_targets) {
            encounter.sub_targets = encounter.sub_targets.map(sub => {
              if (sub.is_mastered === true || sub.is_mastered === 'warning') {
                return { ...sub, last_practice: now }
              }
              return sub
            })
          }
          encounter.elo_score = calculateElo(encounter.sub_targets)
          encounter.gear_level = getLevelBySubTargets(encounter.sub_targets)
          encounter.health_status = encounter.elo_score >= 1700 ? 'healthy' : 'bleeding'
          break
        }
      }
      return newData
    })
  }

  const handleRealDiagnosis = async (base64Data) => {
    if (!API_KEY) {
      throw new Error('API Key 未配置，请检查 .env 文件中的 VITE_QWEN_API_KEY')
    }
    
    console.log('开始视觉诊断请求...')
    console.log('Base64 数据长度:', base64Data?.length)
    console.log('Base64 数据前缀:', base64Data?.substring(0, 50))
    
    try {
      const requestBody = {
        model: VISION_MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: base64Data }
              },
              {
                type: 'text',
                text: VISION_DIAGNOSIS_PROMPT
              }
            ]
          }
        ]
      }
      
      console.log('请求体模型:', requestBody.model)
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API 错误响应:', errorText)
        console.error('状态码:', response.status)
        throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('API 响应成功:', data.choices?.[0]?.message?.content?.substring(0, 100))
      
      const resultText = data.choices[0].message.content
      
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim()
      return JSON.parse(cleanJson)
    } catch (error) {
      console.error('视觉诊断 API 调用失败:', error)
      throw error
    }
  }

  const handleDiagnosisComplete = (result) => {
    if (!result) return
    
    const now = new Date().toISOString()
    setTacticalData((prevData) => {
      const newData = { ...prevData }
      for (const map of newData.tactical_maps) {
        const encounter = map.encounters.find(e => e.target_id === result.targetId)
        if (encounter && encounter.sub_targets) {
          encounter.sub_targets = encounter.sub_targets.map(sub => {
            if (result.greenSubIds && result.greenSubIds.includes(sub.sub_id)) {
              return { ...sub, is_mastered: true, last_practice: now }
            }
            return sub
          })
          
          const currentLevel = encounter.gear_level || 'L1'
          const maxGain = getMaxEloGain(currentLevel)
          const eloGain = Math.min(result.eloGain || 0, maxGain)
          encounter.elo_score = Math.min(3000, (encounter.elo_score || 800) + eloGain)
          
          encounter.gear_level = getLevelBySubTargets(encounter.sub_targets)
          encounter.health_status = encounter.elo_score >= 2501 ? 'healthy' : 'bleeding'
          break
        }
      }
      return newData
    })
    
    setActiveView('tactical')
  }

  const handleGlobalReset = () => {
    setTacticalData((prevData) => {
      const newData = { ...prevData }
      newData.tactical_maps.forEach(map => {
        map.encounters.forEach(encounter => {
          encounter.elo_score = 800
          encounter.gear_level = 'L1'
          encounter.health_status = 'bleeding'
          if (encounter.sub_targets) {
            encounter.sub_targets.forEach(sub => {
              sub.is_mastered = false
            })
          }
        })
      })
      return newData
    })
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      if (file.type.includes('image')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setSelectedImage({
            base64: event.target.result,
            name: file.name,
            type: 'image',
          })
        }
        reader.readAsDataURL(file)
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target.result
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            const page = await pdf.getPage(1)
            
            const scale = 2.0
            const viewport = page.getViewport({ scale })
            
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.height = viewport.height
            canvas.width = viewport.width
            
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise
            
            const base64 = canvas.toDataURL('image/jpeg', 0.9)
            
            setSelectedImage({
              base64: base64,
              name: file.name,
              type: 'pdf',
            })
          } catch (error) {
            console.error('PDF 解析错误:', error)
            alert('PDF 解析失败，请重试')
          }
        }
        reader.readAsArrayBuffer(file)
      }
    } catch (error) {
      console.error('文件处理错误:', error)
      alert('文件处理失败，请重试')
    }
    
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
  }

  const handleDeployToZone = (target) => {
    setCurrentTarget(target)
    setActiveTab('diagnosis')

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: isAcademicMode 
        ? `老师，我准备学习【${target.target_name}】。核心考点是：${target.core_skeleton}。请出题或给出第一步引导！`
        : `老乔，我准备进行【${target.target_name}】的训练。核心考点是：${target.core_skeleton}。请出题或给出第一步引导！`,
    }

    const newMessages = [userMessage]
    setMessages(newMessages)
    setIsLoading(true)

    const tacticalContext = `当前目标：${target.target_name}，装备等级：${target.gear_level}，核心骨架：${target.core_skeleton}，陷阱标签：${target.trap_tags?.join('、') || '无'}。请针对这个目标给出指导。`
    
    callLLM([{ type: 'user', content: tacticalContext }]).then((aiResponse) => {
      const { cleanText } = processBattleResult(aiResponse, target.target_id)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, type: 'ai', content: cleanText },
      ])
      setIsLoading(false)
    })
  }

  const handleSelectQuestion = async (question) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: isAcademicMode
        ? `老师，我准备学习【${question.Core_Model}】。核心考点是：${question.Content_LaTeX}。请出题或给出第一步引导！`
        : `老乔，我准备进行【${question.Core_Model}】的训练。核心考点是：${question.Content_LaTeX}。请出题或给出第一步引导！`,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)

    const aiResponse = await callLLM(newMessages)
    const { cleanText } = processBattleResult(aiResponse, currentTarget?.target_id)

    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, type: 'ai', content: cleanText },
    ])
    setIsLoading(false)
  }

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedImage) || isLoading) return

    const hasImage = !!selectedImage
    const imageBase64 = selectedImage?.base64

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: hasImage
        ? `[附加图片] ${inputValue.trim() || '请分析这道题'}`
        : inputValue.trim(),
      imageBase64: hasImage ? imageBase64 : undefined,
      imageName: selectedImage?.name,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setSelectedImage(null)
    setIsLoading(true)

    const aiResponse = await callLLM(newMessages)
    const { cleanText } = processBattleResult(aiResponse, currentTarget?.target_id)

    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, type: 'ai', content: cleanText },
    ])
    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const tabs = [
    { id: 'dashboard', label: '知识图谱', icon: LayoutDashboard },
    { id: 'diagnosis', label: '错题诊断', icon: Crosshair },
    { id: 'training', label: '每日训练', icon: Target },
    { id: 'formula', label: '方法与定理库', icon: BookOpen },
    { id: 'weekly', label: '周度任务', icon: Calendar },
  ]

  const DiagnosisView = () => (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-zinc-950">
      <header className="h-14 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-blue-500/30 z-10">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1 text-sm ${
            isAcademicMode ? 'text-blue-600 hover:text-blue-700' : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          返回
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-zinc-200">
          {isAcademicMode ? '教研组长' : '联络人 · 老乔'}
        </h1>
        <div className="w-16"></div>
      </header>

      <div className={`mx-4 mt-4 p-3 rounded-lg border ${
        isAcademicMode 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-emerald-900/20 border-emerald-500/30'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">🔍</span>
          <span className={`text-xs font-semibold ${isAcademicMode ? 'text-blue-700' : 'text-emerald-400'}`}>
            情报收集模式
          </span>
        </div>
        <p className={`text-xs mt-1 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-400/80'}`}>
          上传错题仅点亮红区，不扣除 Elo 积分。每次成功上传可获得情报值奖励！
        </p>
      </div>

      <main className="flex-1 overflow-y-auto px-4 bg-slate-50 dark:bg-zinc-950 pb-32 md:pb-24">
        <div className="py-4 space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-zinc-500">
              <Crosshair className="w-12 h-12 mb-4 text-slate-400 dark:text-zinc-600" />
              <p className="text-sm">点击下方快捷部署或上传图片</p>
              <p className="text-xs text-slate-400 dark:text-zinc-600 mt-2">开始对话</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white dark:bg-zinc-900 dark:text-zinc-300 dark:border-r-4 dark:border-orange-500'
                    : 'bg-white border border-slate-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-l-4 dark:border-blue-500'
                }`}
              >
                {message.imageBase64 && (
                  <div className="mb-2">
                    <img
                      src={message.imageBase64}
                      alt="图片"
                      className="max-w-full rounded-lg border border-slate-200 dark:border-blue-500/50"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
                {message.type === 'ai' ? (
                  <div className="prose prose-sm dark:prose-invert prose-blue max-w-none prose-headings:text-slate-800 dark:prose-headings:text-zinc-200 prose-p:text-slate-700 dark:prose-p:text-zinc-300 prose-strong:text-blue-600 dark:prose-strong:text-blue-400">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white prose-strong:text-blue-200 dark:prose-strong:text-orange-400">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] px-4 py-3 rounded-lg bg-white border border-slate-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-l-4 dark:border-blue-500">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm text-slate-500 dark:text-zinc-500">
                    {isAcademicMode ? '正在思考...' : '联络人老乔正在评估战损报告...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-16 md:bottom-0 left-0 md:left-20 right-0 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 z-20">
        <div className="max-w-3xl mx-auto">
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
              {isAcademicMode ? '快捷选题' : '快捷部署'}
            </span>
          </div>
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
            {currentTarget && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Target className="w-3 h-3" />
                {currentTarget.target_name}
              </span>
            )}
          </div>
          
          {selectedImage && (
            <div className="px-4 pt-2">
              <div className="relative inline-block">
                <div className="relative rounded-lg border-2 border-blue-500/50 dark:border-blue-500/50 overflow-hidden">
                  <img
                    src={selectedImage.base64}
                    alt="图片"
                    className="h-12 object-contain bg-slate-100 dark:bg-zinc-950"
                  />
                  {selectedImage.type === 'pdf' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-100/80 dark:bg-zinc-900/80 text-xs text-center text-slate-500 dark:text-zinc-400 py-0.5">
                      PDF
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 p-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 ${
                isLoading
                  ? 'text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500/50'
              }`}
              title="上传图片"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <BattleScanner 
              onDiagnosisComplete={handleDiagnosisComplete}
              isAcademicMode={isAcademicMode}
              tacticalData={tacticalData}
              onRealDiagnosis={handleRealDiagnosis}
            />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedImage ? "补充说明..." : "输入问题..."}
              disabled={isLoading}
              className={`flex-1 h-9 px-3 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || (!inputValue.trim() && !selectedImage)}
              className={`h-9 px-4 text-white text-sm font-medium rounded-lg transition-all ${
                isLoading || (!inputValue.trim() && !selectedImage)
                  ? 'bg-slate-300 dark:bg-zinc-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-95'
              }`}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ThemeContext.Provider value={{ isAcademicMode, setIsAcademicMode }}>
      <GradeContext.Provider value={{ currentGrade, setCurrentGrade }}>
      <div className="h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden flex">
        {battleResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
            <div className={`bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-sm mx-4 text-center border-2 ${
              battleResult.levelUp ? 'border-amber-500' : 'border-slate-200 dark:border-zinc-700'
            } ${showStreakEffect ? 'animate-pulse ring-4 ring-amber-400/50' : ''}`}>
              {showStreakEffect && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold animate-bounce">
                  🔥 连胜加速中！
                </div>
              )}
              {battleResult.levelUp ? (
                <>
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-500 animate-bounce" />
                  <h2 className="text-2xl font-bold text-amber-500 mb-2">
                    {isAcademicMode ? '能力提升！' : '目标被攻克！'}
                  </h2>
                  <p className="text-slate-600 dark:text-zinc-300 mb-4">
                    排位分 <span className="text-blue-600 dark:text-blue-400">+{battleResult.expChange}</span>
                    {battleResult.winStreak >= 3 && (
                      <span className="ml-2 text-amber-500 text-sm">🔥 连胜 x{battleResult.winStreak}</span>
                    )}
                  </p>
                  <p className="text-lg text-amber-500 font-semibold">
                    {isAcademicMode ? '等级提升至' : '装备升级至'} {battleResult.newLevel}！
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${
                    battleResult.grade === 'S' ? 'text-amber-400' :
                    battleResult.grade === 'A' ? 'text-blue-500' :
                    battleResult.grade === 'B' ? 'text-blue-400' : 'text-red-400'
                  }`} />
                  <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-200 mb-2">
                    {isAcademicMode ? '学习反馈' : '战局结算'}
                  </h2>
                  <p className="text-slate-500 dark:text-zinc-400 mb-2">
                    评级 <span className={`font-bold ${
                      battleResult.grade === 'S' ? 'text-amber-500' :
                      battleResult.grade === 'A' ? 'text-blue-500' :
                      battleResult.grade === 'B' ? 'text-blue-400' : 'text-red-400'
                    }`}>{battleResult.grade}</span>
                  </p>
                  <p className="text-slate-500 dark:text-zinc-400">
                    排位分 <span className={battleResult.expChange > 0 ? 'text-blue-500' : 'text-red-400'}>
                      {battleResult.expChange > 0 ? '+' : ''}{battleResult.expChange}
                    </span>
                    {battleResult.winStreak >= 3 && battleResult.expChange > 0 && (
                      <span className="ml-2 text-amber-500 text-sm">🔥 连胜 x{battleResult.winStreak}</span>
                    )}
                  </p>
                </>
              )}
              <button
                onClick={() => {
                  setBattleResult(null)
                  const warning = checkLowProficiencyWarning(tacticalData)
                  if (warning) {
                    setTimeout(() => {
                      setLaoQiaoWarning({
                        message: `特遣队员，你的【${warning.weaponName}】熟练度严重不足（仅 ${warning.exp} EXP），这是你在 ${warning.zone} 被锁死的元凶！建议回武器库闭关，点亮 3 个专项变例！`
                      })
                    }, 500)
                  }
                }}
                className="mt-6 px-6 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        )}
        {laoQiaoWarning && (
          <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[90] animate-slide-in">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="text-3xl">🎖️</div>
                <div className="flex-1">
                  <p className="text-white font-bold mb-1">老乔提示</p>
                  <p className="text-white/90 text-sm">{laoQiaoWarning.message}</p>
                </div>
                <button 
                  onClick={() => setLaoQiaoWarning(null)}
                  className="text-white/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="hidden md:flex flex-col w-20 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex-1 flex flex-col items-center py-6 space-y-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                      : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              )
            })}
          </div>
          <div className="pb-2 flex flex-col items-center space-y-2">
            <div className="relative">
              <button
                onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-xs font-bold ${
                  currentGrade === '高三' ? 'text-red-500' : currentGrade === '高二' ? 'text-blue-500' : 'text-green-500'
                } bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700`}
              >
                <span>{currentGrade}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${gradeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {gradeDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-700 overflow-hidden z-50">
                  {['高一', '高二', '高三'].map((grade) => (
                    <button
                      key={grade}
                      onClick={() => {
                        setCurrentGrade(grade)
                        setGradeDropdownOpen(false)
                      }}
                      className={`block w-full px-4 py-2 text-xs font-medium transition-colors ${
                        currentGrade === grade
                          ? grade === '高三' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                            grade === '高二' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                            'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                          : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsAcademicMode(!isAcademicMode)}
              className="flex flex-col items-center gap-1 p-3 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all"
            >
              {isAcademicMode ? (
                <>
                  <Moon className="w-5 h-5" />
                  <span className="text-xs">深色</span>
                </>
              ) : (
                <>
                  <Sun className="w-5 h-5" />
                  <span className="text-xs">浅色</span>
                </>
              )}
            </button>
          </div>
        </nav>

        <main className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0 relative">
          <button
            onClick={() => setInitModalOpen(true)}
            className="flex absolute top-4 right-4 z-40 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 transition-all shadow-sm"
          >
            <Settings className="w-5 h-5" />
            <span>初始化</span>
          </button>
          {activeTab === 'dashboard' && (
            <TacticalDashboard 
              tacticalData={tacticalData} 
              onDeployToZone={handleDeployToZone}
              currentGrade={currentGrade}
              onGlobalReset={handleGlobalReset}
              onRecalculateElo={handleRecalculateElo}
              onCalibrate={handleCalibrate}
              onNavigate={(tab, formulaId) => {
                setActiveTab(tab)
                if (formulaId) {
                  setHighlightFormulaId(formulaId)
                }
              }}
            />
          )}
          {activeTab === 'diagnosis' && <DiagnosisView />}
          {activeTab === 'training' && (
            <TrainingView 
              tacticalData={tacticalData}
              currentGrade={currentGrade}
              onBattleComplete={handleBattleComplete}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'formula' && (
            <StrategyHub 
              isAcademicMode={isAcademicMode} 
              tacticalData={tacticalData}
              highlightFormulaId={highlightFormulaId}
              onClearHighlight={() => setHighlightFormulaId(null)}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'weekly' && (
            <WeeklyMission 
              tacticalData={tacticalData}
              weeklyPlan={weeklyPlan}
              errorNotebook={errorNotebook}
              currentGrade={currentGrade}
              onSetActiveMotifs={setActiveMotifs}
              onResolveError={resolveError}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex justify-around items-center z-50">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 p-2 transition-all ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            )
          })}
          <div className="relative">
            <button
              onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
              className={`flex flex-col items-center gap-0.5 p-2 text-xs font-bold ${
                currentGrade === '高三' ? 'text-red-500' : currentGrade === '高二' ? 'text-blue-500' : 'text-green-500'
              }`}
            >
              <span>{currentGrade}</span>
            </button>
            {gradeDropdownOpen && (
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-700 overflow-hidden z-50">
                {['高一', '高二', '高三'].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => {
                      setCurrentGrade(grade)
                      setGradeDropdownOpen(false)
                    }}
                    className={`block w-full px-6 py-2 text-xs font-medium transition-colors ${
                      currentGrade === grade
                        ? grade === '高三' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                          grade === '高二' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setInitModalOpen(true)}
            className="flex flex-col items-center gap-0.5 p-2 text-xs font-bold text-slate-500 dark:text-zinc-400"
          >
            <Settings className="w-4 h-4" />
            <span>初始化</span>
          </button>
          <button
            onClick={() => setIsAcademicMode(!isAcademicMode)}
            className="flex flex-col items-center gap-1 p-2 text-slate-400 dark:text-zinc-500"
          >
            {isAcademicMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="text-xs">{isAcademicMode ? '深色' : '浅色'}</span>
          </button>
        </nav>
      </div>
      
      {initModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setInitModalOpen(false)}
        >
          <div 
            className={`max-w-2xl max-h-[85vh] overflow-auto mx-4 rounded-lg border p-6 ${
              isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                ⚡ 母题初始化调试面板
              </h3>
              <button
                onClick={() => setInitModalOpen(false)}
                className={`p-1 rounded ${isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className={`text-sm mb-4 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
              点击灯泡切换状态（灰→红→绿），快速初始化母题数据：
            </p>
            
            {/* 年级切换 */}
            <div className="flex gap-2 mb-4">
              {['高一', '高二', '高三'].map(grade => (
                <button
                  key={grade}
                  onClick={() => {
                    const selector = document.getElementById('grade-selector');
                    if (selector) selector.value = grade;
                    setInitGradeFilter(grade);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    (initGradeFilter || '高三') === grade
                      ? isAcademicMode 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-blue-600 text-white'
                      : isAcademicMode
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {(() => {
                const gradeOrder = { '高一': 1, '高二': 2, '高三': 3 };
                const selectedGrade = initGradeFilter || '高三';
                const allEncounters = tacticalData?.tactical_maps?.flatMap(map => map.encounters) || [];
                
                const filteredEncounters = allEncounters.filter(encounter => {
                  const grades = encounter.grades || [];
                  if (selectedGrade === '高三') return true;
                  if (selectedGrade === '高二') return grades.includes('高一') || grades.includes('高二');
                  if (selectedGrade === '高一') return grades.includes('高一');
                  return true;
                });
                
                return filteredEncounters.map(encounter => {
                  // 1. 兼容新旧格式，深层查找是否存在 L2/L3/L4 节点
                  let hasL2 = false, hasL3 = false, hasL4 = false;
                  if (encounter.specialties) {
                    encounter.specialties.forEach(spec => spec.variations?.forEach(v => {
                      v.master_benchmarks?.forEach(b => {
                        if (b.level === 'L2') hasL2 = true;
                        if (b.level === 'L3') hasL3 = true;
                        if (b.level === 'L4') hasL4 = true;
                      });
                    }));
                  } else if (encounter.sub_targets) {
                    hasL2 = encounter.sub_targets.some(s => s.level_req === 'L2');
                    hasL3 = encounter.sub_targets.some(s => s.level_req === 'L3');
                    hasL4 = encounter.sub_targets.some(s => s.level_req === 'L4');
                  } else {
                    hasL2 = true;
                    hasL3 = true;
                    hasL4 = true;
                  }

                  // 2. 根据用户要求的极简规则，判断状态灯颜色
                  const elo = encounter.elo_score || 800;
                  const l2Gray = elo < 1001;
                  const l2Green = elo >= 1800;
                  const l3Gray = elo < 1801;
                  const l3Green = elo >= 2500;
                  const l4Gray = elo < 2501;
                  const l4Green = elo >= 3000;

                  const handleLightClick = (level) => {
                    const newData = JSON.parse(JSON.stringify(tacticalData));
                    for (const m of newData.tactical_maps) {
                      for (const e of m.encounters) {
                        if (e.target_id === encounter.target_id) {
                          let newStatus = null;
                          // 三色切换逻辑：灰→红→绿→灰
                          if (level === 'L2') {
                            if (l2Gray) { e.elo_score = 1001; newStatus = false; }
                            else if (!l2Green) { e.elo_score = 1800; newStatus = true; }
                            else { e.elo_score = 800; newStatus = null; }
                          }
                          if (level === 'L3') {
                            if (l3Gray) { e.elo_score = 1801; newStatus = false; }
                            else if (!l3Green) { e.elo_score = 2500; newStatus = true; }
                            else { e.elo_score = 1800; newStatus = null; }
                          }
                          if (level === 'L4') {
                            if (l4Gray) { e.elo_score = 2501; newStatus = false; }
                            else if (!l4Green) { e.elo_score = 3000; newStatus = true; }
                            else { e.elo_score = 2500; newStatus = null; }
                          }
                          e.gear_level = e.elo_score >= 2501 ? 'L4' : e.elo_score >= 1801 ? 'L3' : e.elo_score >= 1001 ? 'L2' : 'L1';
                          
                          // 同步修改 sub_targets 的 is_mastered 状态
                          if (e.sub_targets && newStatus !== null) {
                            e.sub_targets.forEach(sub => {
                              if (sub.level_req === level) {
                                sub.is_mastered = newStatus;
                              }
                            });
                          }
                        }
                      }
                    }
                    setTacticalData(newData);
                  };
                  
                  return (
                    <div 
                      key={encounter.target_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isAcademicMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800 border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`text-sm font-medium w-36 truncate ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                          {encounter.target_name}
                        </span>
                        <span className={`text-sm font-bold text-purple-500 ml-4 mr-8`}>
                          Elo: {elo}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasL2 && (
                          <button
                            onClick={() => handleLightClick('L2')}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                              l2Gray 
                                ? 'bg-slate-200 border-slate-300 text-slate-500' 
                                : l2Green 
                                  ? 'bg-emerald-500 border-emerald-600 text-white' 
                                  : 'bg-red-500 border-red-600 text-white'
                            }`}
                          >
                            L2
                          </button>
                        )}
                        
                        {hasL3 && (
                          <button
                            onClick={() => handleLightClick('L3')}
                            disabled={l2Gray}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                              l2Gray 
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                                : l3Gray && !l2Gray
                                  ? 'bg-slate-200 border-slate-300 text-slate-500' 
                                  : l3Green 
                                    ? 'bg-emerald-500 border-emerald-600 text-white' 
                                    : 'bg-red-500 border-red-600 text-white'
                            }`}
                          >
                            L3
                          </button>
                        )}
                        
                        {hasL4 && (
                          <button
                            onClick={() => handleLightClick('L4')}
                            disabled={l3Gray}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                              l3Gray 
                                ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                                : l4Gray && !l3Gray
                                  ? 'bg-slate-200 border-slate-300 text-slate-500' 
                                  : l4Green 
                                    ? 'bg-emerald-500 border-emerald-600 text-white' 
                                    : 'bg-red-500 border-red-600 text-white'
                            }`}
                          >
                            L4
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-between gap-2" style={{ borderColor: isAcademicMode ? '#e2e8f0' : '#3f3f46' }}>
              <button
                onClick={() => {
                  const newData = JSON.parse(JSON.stringify(tacticalData));
                  for (const m of newData.tactical_maps) {
                    for (const e of m.encounters) {
                      e.elo_score = 800;
                      e.gear_level = 'L1';
                    }
                  }
                  setTacticalData(newData);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isAcademicMode ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                }`}
              >
                🗑️ 清空配置
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setInitModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isAcademicMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={() => setInitModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isAcademicMode ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  ✓ 确认配置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </GradeContext.Provider>
    </ThemeContext.Provider>
  )
}

export default App
