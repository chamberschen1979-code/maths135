import { useState, useRef, useEffect, createContext, useContext } from 'react'
import 'katex/dist/katex.min.css'
import { X, Target, Trophy, AlertCircle, Moon, Sun, ChevronDown, Settings } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import initialTacticalData from './data/tacticalMaps.json'
import TacticalDashboard from './components/TacticalDashboard'
import TrainingCenter from './components/training/TrainingCenter'
import TrainingView from './components/TrainingView'
import StrategyHub from './components/StrategyHub'
import WeeklyMissionNew from './components/WeeklyMissionNew'
import DiagnosisView from './components/DiagnosisView'
import InitModal from './components/InitModal'
import BattleResultModal from './components/BattleResultModal'
import LaoQiaoWarning from './components/LaoQiaoWarning'
import Navigation from './components/Navigation'
import { migrateTacticalData, SCHEMA_VERSION } from './utils/migrateDataStructure'

import { 
  API_KEY, 
  BASE_URL, 
  MODEL_NAME, 
  VISION_MODEL_NAME, 
  VISION_DIAGNOSIS_PROMPT,
  CATEGORY_TO_MOTIF,
  DATA_VERSION,
  getSystemPrompt
} from './constants/config'

import {
  getAllBenchmarks,
  calculateGearLevelFromSpecialties,
  LEVEL_THRESHOLDS,
  DECAY_CONFIG,
  LEVEL_INITIAL_ELO
} from './utils/benchmarkUtils'

import {
  getMaxEloGain,
  calculateEloFromSpecialties,
  isEloCappedFromSpecialties,
  getEloCeilingFromSpecialties
} from './utils/eloUtils'

import {
  getWeaponInfo,
  checkLowProficiencyWarning
} from './utils/weaponUtils'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const getDaysSincePractice = (lastPracticeDate) => {
  if (!lastPracticeDate) return Infinity
  const last = new Date(lastPracticeDate)
  const now = new Date()
  const diffMs = now - last
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

const getLevelByElo = (elo) => {
  if (elo >= LEVEL_THRESHOLDS.L4.min) return 'L4'
  if (elo >= LEVEL_THRESHOLDS.L3.min) return 'L3'
  if (elo >= LEVEL_THRESHOLDS.L2.min) return 'L2'
  return 'L1'
}

export const ThemeContext = createContext()
export const GradeContext = createContext()

export const useTheme = () => useContext(ThemeContext)
export const useGrade = () => useContext(GradeContext)

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

  const [tacticalData, setTacticalData] = useState(() => {
    const savedVersion = localStorage.getItem('tactical_data_version')
    if (savedVersion !== DATA_VERSION) {
      localStorage.removeItem('tactical_data')
      localStorage.setItem('tactical_data_version', DATA_VERSION)
      const migrated = migrateTacticalData(initialTacticalData, {})
      console.log('[迁移] 初始化数据完成, schemaVersion:', migrated.data.schemaVersion)
      if (migrated.warnings.length > 0) {
        console.warn('[迁移] 警告:', migrated.warnings)
      }
      return migrated.data
    }
    const saved = localStorage.getItem('tactical_data')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
        console.log('[迁移] 检测到旧版本数据，执行迁移...')
        const migrated = migrateTacticalData(parsed, {})
        if (migrated.migrated) {
          console.log('[迁移] 迁移完成, schemaVersion:', migrated.data.schemaVersion)
          if (migrated.warnings.length > 0) {
            console.warn('[迁移] 警告:', migrated.warnings)
          }
          return migrated.data
        }
      }
      return parsed
    }
    return initialTacticalData
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

  const [weeklyTasks, setWeeklyTasks] = useState(() => {
    const saved = localStorage.getItem('weekly_tasks')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('error_notebook', JSON.stringify(errorNotebook))
  }, [errorNotebook])

  useEffect(() => {
    localStorage.setItem('weekly_plan', JSON.stringify(weeklyPlan))
  }, [weeklyPlan])

  useEffect(() => {
    localStorage.setItem('weekly_tasks', JSON.stringify(weeklyTasks))
  }, [weeklyTasks])

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
    const cleanText = responseText.replace(/\[(系统评级|战术结算):\s*[SABC]\]/g, '').trim()
    
    let diagnosis = ''
    if (grade === 'C') {
      const lines = cleanText.split('\n').filter(l => l.trim())
      const lastLines = lines.slice(-3).join('。')
      diagnosis = lastLines || '概念不清需要重新讲解'
    }

    updateTargetData(targetId, grade, [], false, diagnosis)

    return { cleanText, settled: true }
  }

  const updateTargetData = (targetId, grade, masteredSubIds = [], isDiminished = false, diagnosis = '') => {
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
    
    if (grade === 'B' || grade === 'C') {
      addErrorToNotebook(targetId, diagnosis || '需要加强练习', 'L2')
    }
    
    setTacticalData((prevData) => {
      const newData = { ...prevData }
      for (const map of newData.tactical_maps) {
        const encounterIndex = map.encounters.findIndex((e) => e.target_id === targetId)
        if (encounterIndex !== -1) {
          const encounter = { ...map.encounters[encounterIndex] }
          const oldLevel = encounter.gear_level
          const now = new Date().toISOString()
          
          if (encounter.specialties) {
            encounter.specialties = encounter.specialties.map(spec => ({
              ...spec,
              variations: (spec.variations || []).map(v => ({
                ...v,
                master_benchmarks: (v.master_benchmarks || []).map(b => {
                  if (b.is_mastered === true) {
                    return { ...b, last_practice: now }
                  }
                  
                  if (masteredSubIds.length > 0) {
                    const benchmarkId = b.id || b.legacy_id
                    if (masteredSubIds.some(id => id === benchmarkId || id.includes(benchmarkId))) {
                      return { 
                        ...b, 
                        is_mastered: true, 
                        consecutive_correct: 3,
                        last_practice: now 
                      }
                    }
                  }
                  
                  return b
                })
              }))
            }))
          }
          
          const currentLevel = encounter.gear_level
          const currentElo = encounter.elo_score
          const eloCap = getEloCeilingFromSpecialties(encounter.specialties || [])
          
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
          
          encounter.elo_score = calculateEloFromSpecialties(encounter.specialties || [])
          encounter.total_raids += 1
          encounter.gear_level = calculateGearLevelFromSpecialties(encounter.specialties || [])
          encounter.health_status = encounter.elo_score >= 2501 ? 'healthy' : 'bleeding'
          
          const currentWins = Math.round(encounter.win_rate * (encounter.total_raids - 1))
          encounter.win_rate = (currentWins + (isWin ? 1 : 0)) / encounter.total_raids
          
          const levelUp = encounter.gear_level !== oldLevel && encounter.gear_level > oldLevel
          
          const eloChange = encounter.elo_score - currentElo
          
          setBattleResult({
            grade,
            eloChange,
            newElo: encounter.elo_score,
            levelUp,
            newLevel: encounter.gear_level,
            targetName: encounter.target_name,
            isDiminished,
            isCapped: isEloCappedFromSpecialties(encounter.specialties),
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
        if (encounter && encounter.specialties) {
          const benchmarks = getAllBenchmarks(encounter.specialties)
          const hasNonGreenBenchmark = benchmarks.some(b => b.is_mastered !== true)
          
          if (hasNonGreenBenchmark && masteredSubIds.length === 0) {
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
          const now = new Date().toISOString()
          
          if (encounter.specialties) {
            encounter.specialties = encounter.specialties.map(spec => ({
              ...spec,
              variations: (spec.variations || []).map(v => ({
                ...v,
                master_benchmarks: (v.master_benchmarks || []).map(b => {
                  let isMastered = false
                  if (level === 'L1') {
                    isMastered = false
                  } else if (level === 'L2') {
                    isMastered = b.level === 'L2'
                  } else if (level === 'L3') {
                    isMastered = b.level === 'L2' || b.level === 'L3'
                  } else if (level === 'L4') {
                    isMastered = true
                  }
                  return {
                    ...b,
                    is_mastered: isMastered,
                    consecutive_correct: isMastered ? 3 : 0,
                    last_practice: isMastered ? now : b.last_practice
                  }
                })
              }))
            }))
          }
          
          encounter.elo_score = calculateEloFromSpecialties(encounter.specialties)
          encounter.gear_level = calculateGearLevelFromSpecialties(encounter.specialties)
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
          if (encounter.specialties) {
            encounter.specialties = encounter.specialties.map(spec => ({
              ...spec,
              variations: (spec.variations || []).map(v => ({
                ...v,
                master_benchmarks: (v.master_benchmarks || []).map(b => {
                  if (b.is_mastered === true) {
                    return { ...b, last_practice: now }
                  }
                  return b
                })
              }))
            }))
          }
          encounter.elo_score = calculateEloFromSpecialties(encounter.specialties)
          encounter.gear_level = calculateGearLevelFromSpecialties(encounter.specialties)
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
        if (encounter && encounter.specialties) {
          encounter.specialties = encounter.specialties.map(spec => ({
            ...spec,
            variations: (spec.variations || []).map(v => ({
              ...v,
              master_benchmarks: (v.master_benchmarks || []).map(b => {
                const benchmarkId = b.id || b.legacy_id
                if (result.greenSubIds && result.greenSubIds.includes(benchmarkId)) {
                  return { 
                    ...b, 
                    is_mastered: true, 
                    consecutive_correct: 3,
                    last_practice: now 
                  }
                }
                return b
              })
            }))
          }))
          
          const currentLevel = encounter.gear_level || 'L1'
          const maxGain = getMaxEloGain(currentLevel)
          const eloGain = Math.min(result.eloGain || 0, maxGain)
          encounter.elo_score = Math.min(3000, (encounter.elo_score || 800) + eloGain)
          
          encounter.gear_level = calculateGearLevelFromSpecialties(encounter.specialties)
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
      newData.tactical_maps = newData.tactical_maps.map(map => ({
        ...map,
        encounters: map.encounters.map(encounter => ({
          ...encounter,
          elo_score: LEVEL_INITIAL_ELO.L1,
          gear_level: 'L1',
          health_status: 'bleeding',
          specialties: encounter.specialties ? encounter.specialties.map(spec => ({
            ...spec,
            variations: spec.variations?.map(v => ({
              ...v,
              master_benchmarks: v.master_benchmarks?.map(b => ({
                ...b,
                is_mastered: false,
                consecutive_correct: 0,
                l2_status: 'GREEN'
              }))
            }))
          })) : encounter.specialties
        }))
      }))
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

  return (
    <ThemeContext.Provider value={{ isAcademicMode, setIsAcademicMode }}>
      <GradeContext.Provider value={{ currentGrade, setCurrentGrade }}>
      <div className="h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden flex">
        <BattleResultModal
          isOpen={!!battleResult}
          onClose={() => {
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
          result={battleResult}
          showStreakEffect={showStreakEffect}
          isAcademicMode={isAcademicMode}
        />
        <LaoQiaoWarning
          show={!!laoQiaoWarning}
          message={laoQiaoWarning?.message}
          onClose={() => setLaoQiaoWarning(null)}
        />

        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentGrade={currentGrade}
          setCurrentGrade={setCurrentGrade}
          isAcademicMode={isAcademicMode}
          setIsAcademicMode={setIsAcademicMode}
          gradeDropdownOpen={gradeDropdownOpen}
          setGradeDropdownOpen={setGradeDropdownOpen}
          onInitClick={() => setInitModalOpen(true)}
        />

        <main className="flex-1 flex flex-col h-full overflow-y-auto pb-16 md:pb-0 relative">
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
          {activeTab === 'training' && (
            <TrainingCenter 
              tacticalData={tacticalData}
              errorNotebook={errorNotebook}
              isAcademicMode={isAcademicMode}
              onNavigate={(tab) => setActiveTab(tab)}
              onStartTraining={(params) => {
                console.log('开始训练:', params);
              }}
              onStartRemediation={(params) => {
                console.log('开始修复:', params);
              }}
            />
          )}
          {activeTab === 'diagnosis' && (
            <DiagnosisView
              isAcademicMode={isAcademicMode}
              messages={messages}
              isLoading={isLoading}
              inputValue={inputValue}
              setInputValue={setInputValue}
              selectedImage={selectedImage}
              currentTarget={currentTarget}
              tacticalData={tacticalData}
              errorNotebook={errorNotebook}
              setErrorNotebook={setErrorNotebook}
              onSend={handleSend}
              onKeyPress={handleKeyPress}
              onRemoveImage={handleRemoveImage}
              onFileUpload={handleFileUpload}
              onDiagnosisComplete={handleDiagnosisComplete}
              onRealDiagnosis={handleRealDiagnosis}
              onNavigateBack={() => setActiveTab('dashboard')}
              fileInputRef={fileInputRef}
            />
          )}
          {activeTab === 'daily' && (
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
            <WeeklyMissionNew 
              tacticalData={tacticalData}
              errorNotebook={errorNotebook}
              setErrorNotebook={setErrorNotebook}
              isAcademicMode={isAcademicMode}
              currentGrade={currentGrade}
              weeklyTasks={weeklyTasks}
              setWeeklyTasks={setWeeklyTasks}
              onNavigateToErrorLibrary={() => {
                setActiveTab('diagnosis')
                setShowErrorLibrary(true)
              }}
            />
          )}
        </main>
      </div>
      
      {initModalOpen && (
        <InitModal
          isOpen={initModalOpen}
          onClose={() => setInitModalOpen(false)}
          isAcademicMode={isAcademicMode}
          tacticalData={tacticalData}
          setTacticalData={setTacticalData}
          initGradeFilter={initGradeFilter}
          setInitGradeFilter={setInitGradeFilter}
        />
      )}
      </GradeContext.Provider>
    </ThemeContext.Provider>
  )
}

export default App
