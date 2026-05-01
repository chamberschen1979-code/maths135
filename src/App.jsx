import { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react'
import 'katex/dist/katex.min.css'
import { X, Target, Trophy, AlertCircle, Moon, Sun, ChevronDown, Settings, UserPlus } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import initialTacticalData from './data/tacticalMaps.json'
import TacticalDashboard from './components/TacticalDashboard'
import TrainingCenter from './components/training/TrainingCenter'
import StrategyHub from './components/StrategyHub'
import WeeklyMissionNew from './components/WeeklyMissionNew'
import DiagnosisView from './components/DiagnosisView'
import AssessmentModal from './components/assessment/AssessmentModal'
import Navigation from './components/Navigation'
import { migrateTacticalData, SCHEMA_VERSION } from './utils/migrateDataStructure'
import * as userManager from './utils/userManager'
import { UserProgressProvider } from './context/UserProgressContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminLoginModal from './components/admin/AdminLoginModal'
import AdminPanel from './components/admin/AdminPanel'

import { 
  API_KEY, 
  BASE_URL, 
  MODEL_NAME, 
  VISION_MODEL_NAME,
  CATEGORY_TO_MOTIF,
  DATA_VERSION,
  getSystemPrompt
} from './constants/config'

import { diagnoseError } from './services/aiVisionService'
import { getWeaponNameById } from './utils/weaponUtils'
import { aiFillAnswerAndKeyPoints } from './utils/aiFillUtils'

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
  getWeaponInfo
} from './utils/weaponUtils'

import {
  updateHistoryOnIssue,
  updateHistoryOnAnswer,
  resetQuestionHistory,
  getHistoryStats
} from './utils/questionHistoryUtils'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

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
  
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    if (isAcademicMode) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  }, [isAcademicMode])

  const [tacticalData, setTacticalData] = useState(() => {
    if (!userManager.isLoggedIn()) return initialTacticalData
    userManager.migrateToUserData('tactical_data')
    userManager.migrateToUserData('tactical_data_version')
    try {
      const savedVersion = localStorage.getItem(userManager.getDataKey('tactical_data_version'))
      if (savedVersion !== DATA_VERSION) {
        localStorage.removeItem(userManager.getDataKey('tactical_data'))
        localStorage.setItem(userManager.getDataKey('tactical_data_version'), DATA_VERSION)
        const migrated = migrateTacticalData(initialTacticalData, {})
        if (migrated.warnings.length > 0) {
          console.warn('[迁移] 警告:', migrated.warnings)
        }
        return migrated.data
      }
      const saved = userManager.getData('tactical_data', null)
      if (saved) {
        if (!saved.schemaVersion || saved.schemaVersion < SCHEMA_VERSION) {
          const migrated = migrateTacticalData(saved, {})
          if (migrated.migrated) {
            if (migrated.warnings.length > 0) {
              console.warn('[迁移] 警告:', migrated.warnings)
            }
            return migrated.data
          }
        }
        return saved
      }
    } catch (e) {
      console.warn('[App] 读取 tacticalData 失败:', e)
    }
    return initialTacticalData
  })
  
  const userIdRef = useRef(null);
  const loadTacticalDataForUser = useCallback((user) => {
    if (!user) return;
    userManager.migrateToUserData('tactical_data');
    userManager.migrateToUserData('tactical_data_version');
    try {
      const savedVersion = localStorage.getItem(userManager.getDataKey('tactical_data_version'));
      if (savedVersion !== DATA_VERSION) {
        localStorage.removeItem(userManager.getDataKey('tactical_data'));
        localStorage.setItem(userManager.getDataKey('tactical_data_version'), DATA_VERSION);
        const migrated = migrateTacticalData(initialTacticalData, {});
        setTacticalData(migrated.data);
        return;
      }
      const saved = userManager.getData('tactical_data', null);
      if (saved) {
        if (!saved.schemaVersion || saved.schemaVersion < SCHEMA_VERSION) {
          const migrated = migrateTacticalData(saved, {});
          setTacticalData(migrated.data);
          return;
        }
        setTacticalData(saved);
        return;
      }
    } catch (e) {
      console.warn('[App] 读取 tacticalData 失败:', e);
    }
    setTacticalData(initialTacticalData);
  }, []);

  useEffect(() => {
    const currentUser = userManager.getCurrentUser();
    if (currentUser && currentUser !== userIdRef.current) {
      userIdRef.current = currentUser;
      loadTacticalDataForUser(currentUser);
    }
    if (!currentUser) {
      userIdRef.current = null;
    }
  });

  useEffect(() => {
    if (!userManager.isLoggedIn()) return
    userManager.setData('tactical_data', tacticalData)
  }, [tacticalData])

  const eloUpdateRef = useRef({ lastTargetId: null, lastDelta: 0, lastTime: 0 });

  const handleUpdateMotifElo = useCallback((targetId, delta) => {
    const now = Date.now();
    const lastUpdate = eloUpdateRef.current;
    
    if (lastUpdate.lastTargetId === targetId && 
        lastUpdate.lastDelta === delta && 
        now - lastUpdate.lastTime < 1000) {
      return;
    }
    
    eloUpdateRef.current = { lastTargetId: targetId, lastDelta: delta, lastTime: now };


    setTacticalData(prevData => {
      if (!prevData) return prevData;

      const newData = JSON.parse(JSON.stringify(prevData));
      let found = false;

      for (const map of newData.tactical_maps) {
        const encounter = map.encounters.find(e => e.target_id === targetId);
        if (encounter) {
          const oldElo = encounter.elo_score || 800;
          const newElo = Math.max(0, oldElo + delta);
          const oldGearLevel = encounter.gear_level;
          
          encounter.elo_score = newElo;

          if (newElo >= 2501) encounter.gear_level = 'L4';
          else if (newElo >= 1801) encounter.gear_level = 'L3';
          else if (newElo >= 1001) encounter.gear_level = 'L2';
          else encounter.gear_level = 'L1';

          found = true;
          break;
        }
      }

      if (found) {
        return newData;
      }
      
      return prevData;
    });
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard')
  const [highlightFormulaId, setHighlightFormulaId] = useState(null)
  const [highlightMotifId, setHighlightMotifId] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [currentTarget, setCurrentTarget] = useState(null)
  const fileInputRef = useRef(null)

  const [errorNotebook, setErrorNotebook] = useState(() => {
    if (!userManager.isLoggedIn()) return []
    userManager.migrateToUserData('error_notebook')
    return userManager.getData('error_notebook', [])
  })

  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    if (!userManager.isLoggedIn()) {
      return {
        activeMotifs: [],
        pendingErrors: [],
        weekStart: null,
        weekEnd: null
      }
    }
    userManager.migrateToUserData('weekly_plan')
    return userManager.getData('weekly_plan', {
      activeMotifs: [],
      pendingErrors: [],
      weekStart: null,
      weekEnd: null
    })
  })

  const [weeklyTasks, setWeeklyTasks] = useState(() => {
    if (!userManager.isLoggedIn()) return []
    userManager.migrateToUserData('weekly_tasks')
    return userManager.getData('weekly_tasks', [])
  })

  const [questionHistory, setQuestionHistory] = useState(() => {
    if (!userManager.isLoggedIn()) return {}
    userManager.migrateToUserData('question_history')
    return userManager.getData('question_history', {})
  })

  const [assessmentHistory, setAssessmentHistory] = useState(() => {
    if (!userManager.isLoggedIn()) return []
    userManager.migrateToUserData('assessment_history')
    return userManager.getData('assessment_history', [])
  })

  useEffect(() => {
    if (!userManager.isLoggedIn()) return
    userManager.setData('error_notebook', errorNotebook)
  }, [errorNotebook])

  useEffect(() => {
    if (!userManager.isLoggedIn()) return
    userManager.setData('weekly_plan', weeklyPlan)
  }, [weeklyPlan])

  useEffect(() => {
    if (!userManager.isLoggedIn()) return
    userManager.setData('weekly_tasks', weeklyTasks)
  }, [weeklyTasks])

  useEffect(() => {
    if (!userManager.isLoggedIn()) return
    userManager.setData('question_history', questionHistory)
  }, [questionHistory])

  useEffect(() => {
    if (!userManager.isLoggedIn()) return
    userManager.setData('assessment_history', assessmentHistory)
  }, [assessmentHistory])

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

  const addErrorToNotebook = (targetId, diagnosis, level, additionalData = {}) => {
    setErrorNotebook(prev => {
      const exists = prev.find(e => e.targetId === targetId && !e.resolved)
      if (exists) return prev
      
      const newError = {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        targetId,
        diagnosis: typeof diagnosis === 'string' ? diagnosis : diagnosis?.message || '需要加强练习',
        level: level || 'L2',
        addedAt: new Date().toISOString(),
        resolved: false,
        
        questionText: additionalData.questionText || '',
        classification: additionalData.classification || {
          motifId: targetId,
          motifName: additionalData.motifName || '',
          specialtyId: additionalData.specialtyId || 'V1',
          specialtyName: additionalData.specialtyName || '',
          difficulty: level || 'L2'
        },
        diagnosisDetails: additionalData.diagnosisDetails || {
          keyPoints: [],
          trapType: null,
          suggestedWeapons: additionalData.suggestedWeapons || []
        },
        confidence: additionalData.confidence || 0.5,
        status: additionalData.status || 'PENDING_REVIEW',
        source: additionalData.source || 'photo',
        imageData: additionalData.imageData || null
      }
      
      return [...prev, newError]
    })
  }

  const addErrorFromDiagnosis = (diagnosisResult, imageData = null) => {
    const { 
      targetId, 
      classification, 
      diagnosis, 
      questionText, 
      confidence,
      message 
    } = diagnosisResult
    
    return addErrorToNotebook(
      targetId || classification?.motifId || 'M01',
      message || diagnosis?.message || '需要加强练习',
      classification?.difficulty || 'L2',
      {
        questionText,
        classification,
        diagnosisDetails: diagnosis,
        confidence,
        suggestedWeapons: diagnosis?.suggestedWeapons || [],
        source: 'photo',
        imageData,
        status: confidence < 0.6 ? 'PENDING_REVIEW' : 'REVIEWED'
      }
    )
  }

  const processBattleResult = (aiResponse, targetId) => {
    let cleanText = aiResponse || ''
    let grade = null
    
    const gradeMatch = cleanText.match(/\[系统评级:\s*([SABC])\]|\[战术结算:\s*([SABC])\]/)
    if (gradeMatch) {
      grade = gradeMatch[1] || gradeMatch[2]
      cleanText = cleanText.replace(gradeMatch[0], '').trim()
    }
    
    return { cleanText, grade, targetId }
  }

  const resolveError = (errorId) => {
    const error = errorNotebook.find(e => e.id === errorId)
    setErrorNotebook(prev => 
      prev.map(e => e.id === errorId ? { ...e, resolved: true, resolvedAt: new Date().toISOString() } : e)
    )
    if (error) {
      const currentUser = userManager.getCurrentUser()
      if (currentUser) {
        userManager.addActivityLog(currentUser, {
          type: 'error_resolved',
          motifId: error.motifId,
          description: `解决错题 ${error.motifId || ''} - ${error.type || ''}`
        })
      }
    }
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

  const callLLM = async (historyMessages, imageBase64Override = null) => {
    const lastMessage = historyMessages[historyMessages.length - 1]
    const hasImage = imageBase64Override || lastMessage?.imageBase64
    const imageBase64 = imageBase64Override || lastMessage?.imageBase64

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
              image_url: { url: imageBase64 },
            },
            {
              type: 'text',
              text: lastMessage?.content || '请分析这道题',
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

  const updateTargetData = (targetId, grade, masteredSubIds = [], isDiminished = false, diagnosis = '') => {
    const isWin = grade === 'S' || grade === 'A'
    
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
          
          encounter.elo_score = calculateEloFromSpecialties(encounter.specialties || [])
          encounter.total_raids += 1
          encounter.gear_level = calculateGearLevelFromSpecialties(encounter.specialties || [])
          encounter.health_status = encounter.elo_score >= 2501 ? 'healthy' : 'bleeding'
          
          const currentWins = Math.round(encounter.win_rate * (encounter.total_raids - 1))
          encounter.win_rate = (currentWins + (isWin ? 1 : 0)) / encounter.total_raids
          
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
    const currentUser = userManager.getCurrentUser()
    if (currentUser) {
      userManager.addActivityLog(currentUser, {
        type: 'battle',
        motifId: targetId,
        grade,
        eloDelta: eloChange,
        description: `完成 ${targetId}，评级 ${grade}，ELO ${eloChange > 0 ? '+' : ''}${eloChange}`
      })
    }
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
    
    try {
      const result = await diagnoseError(base64Data)
      
      if (result && result.classification) {
        
        let fillResult = null
        try {
          fillResult = await aiFillAnswerAndKeyPoints(
            result.questionText,
            result.classification.motifName
          )
        } catch (fillError) {
          console.error('[App] AI 补全失败，使用默认值:', fillError)
        }
        
        const errorEntry = {
          id: `error-${Date.now()}`,
          targetId: result.classification.motifId || result.targetId || 'M01',
          motifName: result.classification.motifName || '',
          specId: result.classification.specId || 'V1',
          specName: result.classification.specName || '',
          varId: result.classification.varId || '1.1',
          varName: result.classification.varName || '',
          level: result.classification.difficulty || 'L2',
          question: result.questionText || '',
          userAnswer: '',
          correctAnswer: fillResult?.answer || '',
          keyPoints: fillResult?.key_points || [],
          diagnosis: fillResult?.key_points?.join('\n') || result.diagnosis?.message || '',
          diagnosisDetails: {
            keyPoints: fillResult?.key_points || result.diagnosis?.keyPoints || [],
            trapType: result.diagnosis?.trapType || '',
            suggestedWeapons: result.diagnosis?.suggestedWeapons || []
          },
          source: 'photo',
          imageData: base64Data,
          confidence: result.confidence || 0.5,
          createdAt: new Date().toISOString(),
          resolved: false
        }
        
        setErrorNotebook(prev => {
          const newNotebook = [...(prev || []), errorEntry]
          return newNotebook
        })
        
        result.greenSubIds = result.greenSubIds || []
        result.targetId = result.classification.motifId || result.targetId
        result.message = result.diagnosis?.message || ''
      }
      
      return result
    } catch (error) {
      console.error('[App] 视觉诊断失败:', error)
      throw error
    }
  }

  const handleWeaponCertified = (weaponId) => {
    
    setTacticalData((prevData) => {
      const newData = JSON.parse(JSON.stringify(prevData))
      
      if (!newData.user_profile) newData.user_profile = {}
      if (!newData.user_profile.certifiedWeapons) newData.user_profile.certifiedWeapons = []
      
      if (!newData.user_profile.certifiedWeapons.includes(weaponId)) {
        newData.user_profile.certifiedWeapons.push(weaponId)
        const currentUser = userManager.getCurrentUser()
        if (currentUser) {
          userManager.addActivityLog(currentUser, {
            type: 'certification',
            weaponId,
            description: `杀手锏 ${weaponId} 认证通过`
          })
        }
      }
      
      return newData
    })
  }

  const handleImageCapture = async (base64Data) => {
    
    setSelectedImage(null)
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: '请分析这道题',
      imageBase64: base64Data,
      imageName: 'screenshot.jpg',
    }
    
    const newMessages = [userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)
    setActiveTab('diagnosis')
    
    try {
      const diagnosisResult = await handleRealDiagnosis(base64Data)
      
      
      if (diagnosisResult && diagnosisResult.classification) {
        const { classification, diagnosis, questionText } = diagnosisResult
        
        const weaponList = diagnosis?.suggestedWeapons?.map(wId => {
          const weaponName = getWeaponNameById(wId)
          return weaponName ? `**${wId}** · ${weaponName}` : `**${wId}**`
        }) || []
        
        const locationInfo = `📍 **${classification.motifId} ${classification.motifName}** → ${classification.specId} ${classification.specName} → ${classification.varId} ${classification.varName} → ${classification.difficulty}难度`
        
        const diagnosisInfo = `${locationInfo}

${weaponList.length > 0 ? `🔥 **适配杀手锏**：${weaponList.join('、')}` : ''}

${diagnosis?.message ? `💡 **诊断**：${diagnosis.message}` : ''}

---

✅ **已自动加入错题库**，可在"错题库"标签页查看，或在"每周任务"中生成针对性训练。`
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: diagnosisInfo,
        }
        
        setMessages(prev => [...prev, aiMessage])
      } else {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: '抱歉，AI 未能识别这道题目。请尝试上传更清晰的图片，或手动描述题目内容。',
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('[App] 图片诊断失败:', error)
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '诊断请求失败，请稍后重试。',
      }
      setMessages(prev => [...prev, aiMessage])
    }
    
    setIsLoading(false)
  }

  const handleDiagnosisComplete = (result) => {
    if (!result) return
    
    const { 
      targetId, 
      classification, 
      diagnosis, 
      questionText, 
      confidence,
      message 
    } = result
    
    const motifId = classification?.motifId || targetId || 'M01'
    const motifName = classification?.motifName || ''
    const specialtyId = classification?.specialtyId || 'V1'
    const specialtyName = classification?.specialtyName || ''
    const difficulty = classification?.difficulty || 'L2'
    
    addErrorFromDiagnosis(result, null)
    
    const now = new Date().toISOString()
    setTacticalData((prevData) => {
      const newData = { ...prevData }
      
      for (const map of newData.tactical_maps) {
        const encounter = map.encounters.find(e => e.target_id === motifId)
        if (encounter) {
          encounter.elo_score = Math.min(3000, (encounter.elo_score || 800) + 50)
          encounter.health_status = encounter.elo_score >= 2501 ? 'healthy' : 'bleeding'
          
          if (encounter.specialties) {
            const specialty = encounter.specialties.find(s => s.id === specialtyId)
            if (specialty) {
              specialty.elo = Math.min(2000, (specialty.elo || 500) + 30)
            }
          }
          break
        }
      }
      
      return newData
    })
    
    setActiveTab('dashboard')
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

    if (!file.type.startsWith('image/')) {
      alert('此入口仅支持图片上传。PDF/Word 文件请点击"拍照诊断"按钮上传。')
      e.target.value = ''
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage({
          base64: event.target.result,
          name: file.name,
          type: 'image',
        })
      }
      reader.onerror = () => {
        alert('图片读取失败，请重试')
      }
      reader.readAsDataURL(file)
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

    if (hasImage) {
      try {
        const diagnosisResult = await handleRealDiagnosis(imageBase64)
        
        
        if (diagnosisResult && diagnosisResult.classification) {
          const { classification, diagnosis, questionText } = diagnosisResult
          
          const weaponList = diagnosis?.suggestedWeapons?.map(wId => {
            const weaponName = getWeaponNameById(wId)
            return weaponName ? `**${wId}** · ${weaponName}` : `**${wId}**`
          }) || []
          
          const locationInfo = `📍 **${classification.motifId} ${classification.motifName}** → ${classification.specId} ${classification.specName} → ${classification.varId} ${classification.varName} → ${classification.difficulty}难度`
          
          const diagnosisInfo = `${locationInfo}

${weaponList.length > 0 ? `🔥 **适配杀手锏**：${weaponList.join('、')}` : ''}

${diagnosis?.message ? `💡 **诊断**：${diagnosis.message}` : ''}

---

现在我们来分析这道题...`

          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, type: 'ai', content: diagnosisInfo },
          ])
          
          setTimeout(async () => {
            setIsLoading(true)
            
            const messagesWithImage = [
              ...newMessages,
              { 
                id: Date.now() + 2, 
                type: 'ai', 
                content: diagnosisInfo 
              }
            ]
            
            const aiResponse = await callLLM(messagesWithImage, imageBase64)
            const { cleanText } = processBattleResult(aiResponse, classification.motifId)
            
            setMessages((prev) => [
              ...prev,
              { id: Date.now() + 3, type: 'ai', content: cleanText },
            ])
            setIsLoading(false)
          }, 100)
          
          return
        }
      } catch (error) {
        console.error('[App] 图片诊断失败:', error)
      }
    }

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

  const { isLoggedIn, checkAssessmentAccess, isAdmin } = useAuth();

  if (!isLoggedIn) {
    return (
      <UserProgressProvider>
        <ThemeContext.Provider value={{ isAcademicMode, setIsAcademicMode }}>
          <GradeContext.Provider value={{ currentGrade, setCurrentGrade }}>
            <LoginPage />
          </GradeContext.Provider>
        </ThemeContext.Provider>
      </UserProgressProvider>
    );
  }

  return (
    <UserProgressProvider>
      <ThemeContext.Provider value={{ isAcademicMode, setIsAcademicMode }}>
        <GradeContext.Provider value={{ currentGrade, setCurrentGrade }}>
        <div className="h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden flex">
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
            {activeTab === 'dashboard' && (
            <div className="flex absolute top-4 right-4 z-40 gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 transition-all shadow-sm"
                >
                  <span>管理</span>
                </button>
              )}
              {(checkAssessmentAccess() || isAdmin) && (
                <button
                  onClick={() => setInitModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 transition-all shadow-sm"
                >
                  <Settings className="w-5 h-5" />
                  <span>学情评估</span>
                </button>
              )}
            </div>
            )}
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
              }}
              onStartRemediation={(params) => {
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
              onImageCapture={handleImageCapture}
              onNavigateBack={() => setActiveTab('dashboard')}
              fileInputRef={fileInputRef}
            />
          )}
          {activeTab === 'formula' && (
            <StrategyHub 
              isAcademicMode={isAcademicMode} 
              tacticalData={tacticalData}
              highlightWeaponId={highlightFormulaId}
              highlightMotifId={highlightMotifId}
              onClearHighlight={() => setHighlightFormulaId(null)}
              onClearMotifHighlight={() => setHighlightMotifId(null)}
              onNavigate={(tab, motifId) => {
                setActiveTab(tab)
                if (motifId) {
                  setHighlightMotifId(motifId)
                }
              }}
              onWeaponCertified={handleWeaponCertified}
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
              questionHistory={questionHistory}
              setQuestionHistory={setQuestionHistory}
              onUpdateMotifElo={handleUpdateMotifElo}
              onNavigateToErrorLibrary={() => {
                setActiveTab('diagnosis')
              }}
            />
          )}
        </main>
      </div>
      
      {initModalOpen && (
        <AssessmentModal
          isOpen={initModalOpen}
          onClose={() => setInitModalOpen(false)}
          isAcademicMode={isAcademicMode}
          tacticalData={tacticalData}
          setTacticalData={setTacticalData}
          initGradeFilter={initGradeFilter}
          setInitGradeFilter={setInitGradeFilter}
          assessmentHistory={assessmentHistory}
          setAssessmentHistory={setAssessmentHistory}
        />
      )}

      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => setShowAdminPanel(true)}
      />

      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}

      </GradeContext.Provider>
    </ThemeContext.Provider>
    </UserProgressProvider>
  )
}

export default App
