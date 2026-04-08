import { useMemo, useContext, useState, useEffect } from 'react'
import { Target, BookOpen, Sparkles, AlertTriangle, Loader2 } from 'lucide-react'
import { ThemeContext } from '../App'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import weaponDetails from '../data/weapon_details.json'
import { addLegacyIdsToMotifData } from '../utils/migrateDataStructure'

const motifModules = import.meta.glob('/src/data/M*.json', { eager: false })

const WEAPON_NAMES = {
  'S-SET-01': '空集陷阱自动检测',
  'S-FUNC-02': '同增异减',
  'S-FUNC-04': '零点个数=交点个数',
  'S-FUNC-05': '双对称推周期',
  'S-FUNC-06': '脱壳法',
  'S-FUNC-08': '复合零点(剥洋葱)',
  'S-TRIG-01': '配角公式',
  'S-TRIG-02': '图象变换铁律',
  'S-TRIG-03': '化边为角',
  'S-TRIG-05': '图象识别铁律',
  'S-VEC-01': '投影向量',
  'S-VEC-02': '极化恒等式',
  'S-VEC-03': '三点共线定理',
  'S-VEC-04': '建系策略',
  'S-VEC-05': '极化恒等式',
  'S-VEC-06': '奔驰定理',
  'S-SEQ-01': '对称轴定位法',
  'S-SEQ-02': '变号点分析法',
  'S-SEQ-03': '构造等比',
  'S-SEQ-04': '裂项相消·母函数法',
  'S-SEQ-05': '错位相减·万能公式法',
  'S-SEQ-06': '奇偶并项·状态机法',
  'S-SEQ-07': '放缩法·靶向截断术',
  'S-SEQ-08': '特征根法',
  'S-SEQ-09': '不动点法',
  'S-SEQ-10': '切线放缩',
  'S-VIS-01': '动态图像分析与临界态捕捉',
  'S-GEO-02': '建系秒杀',
  'S-GEO-03': '等体积法',
  'S-PROB-01': '概率树/全概率',
  'S-CONIC-02': '焦点三角形面积',
  'S-CONIC-05': '仿射变换',
  'S-CONIC-06': '齐次化联立',
  'S-CONIC-07': '参数方程',
  'S-DERIV-03': '含参讨论通法',
  'S-DERIV-04': '端点效应',
  'S-DERIV-09': '洛必达法则',
  'S-DERIV-10': '极值点偏移(比值代换)',
  'S-DERIV-11': '对数平均不等式',
  'S-INEQ-02': '乘1法',
  'S-INEQ-05': '琴生不等式',
  'S-INEQ-06': '柯西不等式',
  'S-INEQ-07': '权方和不等式',
  'S-INEQ-08': '赫尔德不等式',
  'S-INEQ-09': '切比雪夫不等式',
  'S-INEQ-10': '均值不等式链',
  'S-TRI-04': '中线/角平分线',
  'S-TRI-05': '角平分线长公式',
  'S-TRI-06': '中线长向量公式',
  'S-TRI-07': '射影定理逆用',
  'S-TRI-08': '边化角统一法',
  'S-TRI-09': '余弦定理结构识别',
  'S-TRI-10': '切化弦万能公式',
  'S-LOG-02': '指对同构',
  'S-LOG-05': '对数平均不等式',
  'S-COMPLEX-01': '单位根周期性',
  'S-COMPLEX-02': '平行四边形恒等式',
}

const WEAPON_CATEGORIES = {
  'S-SET': '集合与逻辑思维',
  'S-FUNC': '函数思维',
  'S-TRIG': '三角函数思维',
  'S-VEC': '平面向量思维',
  'S-SEQ': '数列思维',
  'S-GEO': '立体几何思维',
  'S-PROB': '概率统计思维',
  'S-CONIC': '圆锥曲线思维',
  'S-DERIV': '导数思维',
  'S-INEQ': '不等式思维',
  'S-TRI': '解三角形思维',
  'S-LOG': '指对数函数思维',
  'S-COMPLEX': '复数思维',
  'S-VIS': '可视化思维',
}

const WEAPON_RANKS = {
  'S-DERIV-09': 'killer', 'S-DERIV-10': 'killer', 'S-DERIV-11': 'killer',
  'S-CONIC-05': 'killer', 'S-CONIC-06': 'killer', 'S-SEQ-08': 'killer',
  'S-SEQ-09': 'killer', 'S-SEQ-10': 'killer', 'S-INEQ-05': 'killer',
  'S-INEQ-06': 'killer', 'S-INEQ-07': 'killer', 'S-INEQ-08': 'killer',
  'S-INEQ-09': 'killer', 'S-LOG-05': 'killer',
  'S-SEQ-06': 'killer', 'S-SEQ-07': 'killer', 'S-VIS-01': 'killer',
  'S-FUNC-04': 'advanced', 'S-VEC-05': 'advanced', 'S-CONIC-02': 'advanced',
  'S-CONIC-07': 'advanced', 'S-DERIV-04': 'advanced', 'S-TRIG-03': 'advanced',
  'S-FUNC-05': 'advanced', 'S-FUNC-06': 'advanced', 'S-FUNC-08': 'advanced',
  'S-INEQ-10': 'advanced', 'S-LOG-02': 'advanced',
  'S-SEQ-01': 'advanced', 'S-SEQ-02': 'advanced', 'S-SEQ-04': 'advanced', 'S-SEQ-05': 'advanced',
}

const gearLevelColorsDark = {
  L4: '#f59e0b',
  L3: '#a855f7',
  L2: '#3b82f6',
  L1: '#6b7280',
  L0: '#52525b',
}

const gearLevelColorsLight = {
  L4: '#f59e0b',
  L3: '#a855f7',
  L2: '#3b82f6',
  L1: '#6b7280',
  L0: '#94a3b8',
}

const gearLevelLabels = {
  L4: '融会贯通',
  L3: '迁移应用',
  L2: '熟练掌握',
  L1: '基础认知',
  L0: '未解锁',
}

const getLevelByElo = (elo) => {
  if (elo >= 2501) return 'L4'
  if (elo >= 1801) return 'L3'
  if (elo >= 1001) return 'L2'
  return 'L1'
}

const LEVEL_THRESHOLDS = {
  L1: { min: 0, max: 1000 },
  L2: { min: 1001, max: 1800 },
  L3: { min: 1801, max: 2500 },
  L4: { min: 2501, max: 3000 },
}

const DECAY_CONFIG = {
  YELLOW_THRESHOLD_DAYS: 7,
  WARNING_THRESHOLD_DAYS: 14,
}

const VARIATION_LEVEL_CONFIG = {
  M01: {
    '1.1': ['L2', 'L3'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L2', 'L3'],
    '2.2': ['L3', 'L4'],
    '3.1': ['L2', 'L3'],
    '3.2': ['L3'],
  },
  M02: {
    '1.1': ['L2', 'L3'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L2', 'L3'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M03: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M04: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M05: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M06: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M07: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M08: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M09: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M10: {
    '1.1': ['L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L2', 'L3'],
    '2.2': ['L3', 'L4'],
  },
  M11: {
    '1.1': ['L2', 'L3'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M12: {
    '1.1': ['L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L2', 'L3'],
    '3.1': ['L2', 'L3', 'L4'],
    '3.2': ['L3'],
  },
  M13: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M14: {
    '1.1': ['L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
    '3.1': ['L3', 'L4'],
    '3.2': ['L3', 'L4'],
  },
  M15: {
    '1.1': ['L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M16: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M17: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
}

const getVariationLevels = (motifId, varId) => {
  const motifConfig = VARIATION_LEVEL_CONFIG[motifId]
  if (motifConfig && motifConfig[varId]) {
    return motifConfig[varId]
  }
  return ['L2', 'L3', 'L4']
}

const getDaysSincePractice = (lastPracticeTime) => {
  if (!lastPracticeTime) return Infinity
  const now = Date.now()
  const diff = now - new Date(lastPracticeTime).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const checkBenchmarkDecay = (benchmark) => {
  if (benchmark.is_mastered !== true) return benchmark
  
  const daysSincePractice = getDaysSincePractice(benchmark.last_practice)
  
  if (daysSincePractice >= DECAY_CONFIG.YELLOW_THRESHOLD_DAYS) {
    return { ...benchmark, is_mastered: false, consecutive_correct: 0, decayed_from: true }
  }
  
  return benchmark
}

const getDecayStatus = (specialties) => {
  if (!specialties || specialties.length === 0) return { hasDecay: false, decayCount: 0, criticalCount: 0 }
  
  let allBenchmarks = []
  specialties.forEach(spec => {
    spec.variations?.forEach(v => {
      v.master_benchmarks?.forEach(b => {
        allBenchmarks.push(b)
      })
    })
  })
  
  if (allBenchmarks.length === 0) return { hasDecay: false, decayCount: 0, criticalCount: 0 }
  
  const checkedBenchmarks = allBenchmarks.map(checkBenchmarkDecay)
  const decayedBenchmarks = checkedBenchmarks.filter(b => b.decayed_from)
  const criticalBenchmarks = decayedBenchmarks.filter(b => getDaysSincePractice(b.last_practice) >= DECAY_CONFIG.WARNING_THRESHOLD_DAYS)
  
  return {
    hasDecay: decayedBenchmarks.length > 0,
    decayCount: decayedBenchmarks.length,
    criticalCount: criticalBenchmarks.length,
    checkedBenchmarks
  }
}

const getWeaponFromWeaponDetails = (weaponId) => {
  if (!weaponDetails || !weaponDetails[weaponId]) return null
  
  const detail = weaponDetails[weaponId]
  const prefix = weaponId.split('-').slice(0, 2).join('-')
  const categoryName = WEAPON_CATEGORIES[prefix] || '其他'
  
  return {
    id: weaponId,
    name: WEAPON_NAMES[weaponId] || weaponId,
    rank: WEAPON_RANKS[weaponId] || 'basic',
    logicFlow: detail.coreLogic || '',
    description: detail.coreLogic?.slice(0, 100) || '',
    triggerKeywords: detail.scenarios || [],
    categoryName: categoryName
  }
}

const getWeaponsForMotif = (motifData) => {
  if (!motifData || !motifData.specialties) return []
  
  const weaponIds = []
  motifData.specialties.forEach(spec => {
    spec.variations?.forEach(v => {
      // 1. 先从变例级别的 toolkit.linked_weapons 提取
      if (v.toolkit?.linked_weapons) {
        v.toolkit.linked_weapons.forEach(wId => {
          if (!weaponIds.includes(wId)) {
            weaponIds.push(wId)
          }
        })
      }
      
      // 2. 从题目级别的 meta.weapons 提取（与M01-M06一致）
      const pool = v.original_pool || []
      pool.forEach(q => {
        if (q.meta?.weapons && Array.isArray(q.meta.weapons)) {
          q.meta.weapons.forEach(wId => {
            if (!weaponIds.includes(wId)) {
              weaponIds.push(wId)
            }
          })
        }
      })
    })
  })
  
  return weaponIds.map(id => getWeaponFromWeaponDetails(id)).filter(w => w !== null)
}

function HoloMap({ tacticalData, motifData, onDeploy, currentGrade, onRecalculateElo, calibrateTargetId, onCalibrationComplete }) {
  const { isAcademicMode } = useContext(ThemeContext)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [previewSpecialties, setPreviewSpecialties] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [syncAnimation, setSyncAnimation] = useState(false)
  const [loadedMotifData, setLoadedMotifData] = useState(null)
  const [loadingMotif, setLoadingMotif] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const gearLevelColors = isAcademicMode ? gearLevelColorsLight : gearLevelColorsDark

  const showMiddleRing = currentGrade === '高二' || currentGrade === '高三'
  const showInnerRing = currentGrade === '高三'

  const targets = useMemo(() => {
    const allEncounters = tacticalData?.tactical_maps
      ?.flatMap((map) =>
        map.encounters
          .filter((e) => e.grades && e.grades.includes(currentGrade))
          .map((e) => ({
            ...e,
            mapId: map.map_id,
            mapName: map.map_name,
            unlockStatus: map.unlock_status,
          }))
      ) || []

    if (allEncounters.length === 0) return []

    const zoneGroups = { outer: [], middle: [], inner: [] }
    allEncounters.forEach((encounter) => {
      if (encounter.grades && encounter.grades.includes('高一')) {
        zoneGroups.outer.push(encounter)
      } else if (encounter.grades && encounter.grades.includes('高二')) {
        zoneGroups.middle.push(encounter)
      } else {
        zoneGroups.inner.push(encounter)
      }
    })

    const result = []
    
    zoneGroups.outer.forEach((encounter, index) => {
      const r = 380
      const count = zoneGroups.outer.length
      const angle = ((index * 360 / count) - 90) * Math.PI / 180
      result.push({
        ...encounter,
        cx: 500 + r * Math.cos(angle),
        cy: 500 + r * Math.sin(angle),
        angle,
        radius: r,
        zone: 'outer'
      })
    })

    if (showMiddleRing) {
      zoneGroups.middle.forEach((encounter, index) => {
        const r = 240
        const count = zoneGroups.middle.length
        const angle = ((index * 360 / count) - 90) * Math.PI / 180
        result.push({
          ...encounter,
          cx: 500 + r * Math.cos(angle),
          cy: 500 + r * Math.sin(angle),
          angle,
          radius: r,
          zone: 'middle'
        })
      })
    }

    if (showInnerRing) {
      zoneGroups.inner.forEach((encounter, index) => {
        const r = 100
        const count = zoneGroups.inner.length
        const angle = ((index * 360 / count) - 90) * Math.PI / 180
        result.push({
          ...encounter,
          cx: 500 + r * Math.cos(angle),
          cy: 500 + r * Math.sin(angle),
          angle,
          radius: r,
          zone: 'inner'
        })
      })
    }

    return result
  }, [tacticalData, currentGrade, showMiddleRing, showInnerRing])

  useEffect(() => {
    if (!selectedTarget || !targets || targets.length === 0) return

    const baseTarget = targets.find(t => t.target_id === selectedTarget.target_id)

    if (!baseTarget) {
      setSelectedTarget(null)
      setPreviewSpecialties(null)
      return
    }

    setSelectedTarget(prev => {
      const hasLoadedDetails = prev.specialties && prev.specialties.length > 0

      return {
        ...baseTarget,
        ...(hasLoadedDetails
          ? {
              specialties: prev.specialties,
              meta: prev.meta
            }
          : {})
      }
    })
  }, [targets, selectedTarget?.target_id])

  const handleTargetClick = async (target) => {
    if (target.unlockStatus !== 'unlocked') return

    setLoadingMotif(true)
    setLoadError(null)
    setHasChanges(false)

    try {
      const motifId = target.target_id
      const moduleKey = `/src/data/${motifId}.json`

      if (!motifModules[moduleKey]) {
        throw new Error(`Module not found: ${moduleKey}`)
      }

      const module = await motifModules[moduleKey]()
      const rawMotifData = module.default
      const motifData = addLegacyIdsToMotifData(rawMotifData)

      const savedSpecialties = target.specialties || []
      const savedBenchmarkMap = new Map()
      savedSpecialties.forEach(spec => {
        spec.variations?.forEach(v => {
          v.master_benchmarks?.forEach(b => {
            savedBenchmarkMap.set(b.id || `${spec.spec_id}_${v.var_id}_${b.level}`, {
              is_mastered: b.is_mastered,
              consecutive_correct: b.consecutive_correct
            })
          })
        })
      })

      const mergedSpecialties = (motifData.specialties || []).map(spec => ({
        ...spec,
        variations: (spec.variations || []).map(v => ({
          ...v,
          master_benchmarks: (v.master_benchmarks || []).map(b => {
            const key = b.id || `${spec.spec_id}_${v.var_id}_${b.level}`
            const saved = savedBenchmarkMap.get(key)
            if (saved && (saved.is_mastered === true || saved.is_mastered === false || saved.is_mastered === null)) {
              return {
                ...b,
                is_mastered: saved.is_mastered,
                consecutive_correct: saved.consecutive_correct
              }
            }
            return b
          })
        }))
      }))

      const enrichedTarget = {
        ...target,
        specialties: mergedSpecialties,
        meta: {
          description: motifData.description,
          version: motifData.logic_schema_version
        }
      }

      setSelectedTarget(enrichedTarget)
      setPreviewSpecialties(
        mergedSpecialties
          ? JSON.parse(JSON.stringify(mergedSpecialties))
          : null
      )
      setLoadedMotifData({ ...motifData, specialties: mergedSpecialties })
    } catch (error) {
      console.error('Failed to load motif data:', error)
      setLoadError(`无法加载专项数据: ${error.message}`)
      setSelectedTarget(target)
      setPreviewSpecialties(null)
    } finally {
      setLoadingMotif(false)
    }
  }

  const handleToggleBenchmark = (specId, varId, level, newStatus) => {
    if (!selectedTarget) return
    
    const updatedSpecialties = (previewSpecialties || selectedTarget.specialties).map(spec => {
      if (spec.spec_id === specId) {
        return {
          ...spec,
          variations: (spec.variations || []).map(v => {
            if (v.var_id === varId) {
              return {
                ...v,
                master_benchmarks: (v.master_benchmarks || []).map(b => {
                  if (b.level === level) {
                    return { ...b, is_mastered: newStatus, consecutive_correct: newStatus ? 3 : 0 }
                  }
                  return b
                })
              }
            }
            return v
          })
        }
      }
      return spec
    })
    
    setPreviewSpecialties(updatedSpecialties)
    setHasChanges(true)
  }

  const cycleBenchmarkStatus = (currentStatus) => {
    const statusCycle = [false, true]
    const currentIndex = statusCycle.indexOf(currentStatus)
    const nextIndex = (currentIndex + 1) % statusCycle.length
    return statusCycle[nextIndex]
  }

  const handleCycleBenchmark = (specId, varId, level) => {
    const currentSpecialties = previewSpecialties || selectedTarget?.specialties
    const spec = currentSpecialties?.find(s => s.spec_id === specId)
    const variation = spec?.variations?.find(v => v.var_id === varId)
    const benchmark = variation?.master_benchmarks?.find(b => b.level === level)
    if (!benchmark) return
    const newStatus = cycleBenchmarkStatus(benchmark.is_mastered)
    handleToggleBenchmark(specId, varId, level, newStatus)
  }

  const handleConfirmChanges = () => {
    if (!selectedTarget || !previewSpecialties || !onRecalculateElo) return
    
    const newData = { ...tacticalData }
    for (const map of newData.tactical_maps) {
      const encounter = map.encounters.find(e => e.target_id === selectedTarget.target_id)
      if (encounter) {
        encounter.specialties = previewSpecialties
        break
      }
    }
    
    setSelectedTarget({
      ...selectedTarget,
      specialties: previewSpecialties,
    })
    
    setSyncAnimation(true)
    
    setTimeout(() => {
      onRecalculateElo(selectedTarget.target_id)
      setHasChanges(false)
      setSyncAnimation(false)
      setSelectedTarget(null)
      setPreviewSpecialties(null)
      if (onCalibrationComplete) {
        onCalibrationComplete()
      }
    }, 800)
  }

  const handleCloseModal = () => {
    setSelectedTarget(null)
    setPreviewSpecialties(null)
    setHasChanges(false)
    setLoadedMotifData(null)
  }

  const highlightColor = isAcademicMode ? '#2563eb' : '#10b981'
  const highlightColorRgba = isAcademicMode ? 'rgba(37, 99, 235, 0.05)' : 'rgba(16, 185, 129, 0.05)'
  const dangerColor = isAcademicMode ? '#dc2626' : '#ef4444'
  const textColor = isAcademicMode ? '#1e293b' : '#e4e4e7'
  const textMuted = isAcademicMode ? '#64748b' : '#71717a'
  const textLabel = isAcademicMode ? '#475569' : '#78716c'
  const lockedColor = isAcademicMode ? '#e2e8f0' : '#27272a'
  const lockedTextColor = isAcademicMode ? '#94a3b8' : '#3f3f46'

  const ringLabels = isAcademicMode 
    ? ['外圈：高一基础核心模块', '中圈：高二核心重难点模块', '内圈：高三综合压轴大题']
    : ['外圈：高一基础核心模块', '中圈：高二核心重难点模块', '内圈：高三综合压轴大题']

  const ringColors = ['#34d399', '#60a5fa', '#ef4444']

  const renderDetailPanel = () => {
    if (!selectedTarget) return null

    if (loadingMotif) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className={`text-sm ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            正在加载专项数据...
          </p>
        </div>
      )
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
          <p className={`text-sm ${isAcademicMode ? 'text-red-500' : 'text-red-400'}`}>
            {loadError}
          </p>
        </div>
      )
    }
    
    const detailData = loadedMotifData ? { ...selectedTarget, ...loadedMotifData } : selectedTarget
    const hasSpecialties = detailData.specialties && detailData.specialties.length > 0
    const currentElo = detailData.elo_score || 500

    const getLightStyleForVariation = (lvl, variation) => {
      const motifId = detailData.motif_id
      const varId = variation?.var_id
      const allowedLevels = getVariationLevels(motifId, varId)
      
      if (!allowedLevels.includes(lvl)) {
        return null
      }
      
      const specialties = previewSpecialties || selectedTarget?.specialties || []
      let benchmarksForLevel = []
      
      specialties.forEach(spec => {
        spec.variations?.forEach(v => {
          if (v.var_id === varId) {
            // 🔥 兼容新旧结构
            const benchmarks = v.master_benchmarks || []
            const pool = v.original_pool || []
            
            benchmarks.forEach(b => {
              if (b.level === lvl) {
                benchmarksForLevel.push(b)
              }
            })
            
            // 从 original_pool 补充
            if (benchmarksForLevel.length === 0) {
              pool.forEach(q => {
                if (q.level === lvl) {
                  benchmarksForLevel.push(q)
                }
              })
            }
          }
        })
      })
      
      if (benchmarksForLevel.length === 0) {
        return 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800/50 dark:text-zinc-600 dark:border-zinc-700'
      }
      
      const allGreen = benchmarksForLevel.every(b => b.is_mastered === true)
      const hasRed = benchmarksForLevel.some(b => b.is_mastered === false)
      const hasGray = benchmarksForLevel.some(b => b.is_mastered === null || b.is_mastered === undefined)
      
      if (allGreen) {
        return 'bg-emerald-500 text-white border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
      }
      if (hasRed) {
        return 'bg-red-500 text-white border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
      }
      if (hasGray) {
        return 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800/50 dark:text-zinc-600 dark:border-zinc-700'
      }
      return 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800/50 dark:text-zinc-600 dark:border-zinc-700'
    }

    const calculatePromotionProgress = () => {
      if (!hasSpecialties) return null
      
      let totalVariations = 0
      let masteredVariations = 0
      
      const specialties = detailData.specialties || []
      
      specialties.forEach(spec => {
        spec.variations?.forEach(variation => {
          // 🔥 兼容新旧结构
          const benchmarks = variation.master_benchmarks || []
          const pool = variation.original_pool || []
          
          if (benchmarks.length === 0 && pool.length === 0) return
          
          // 🔥 从 benchmarks 或 pool 中提取难度级别
          const levels = [...new Set([
            ...benchmarks.map(b => b.level),
            ...pool.map(q => q.level)
          ])]
          
          if (levels.length === 0) return
          
          totalVariations++
          
          const allLevelsMastered = levels.every(lvl => {
            const levelBenchmarks = benchmarks.filter(b => b.level === lvl)
            const levelPool = pool.filter(q => q.level === lvl)
            // 🔥 优先检查 benchmarks 的掌握状态，如果没有则从 pool 中检查
            if (levelBenchmarks.length > 0) {
              return levelBenchmarks.every(b => b.is_mastered === true)
            }
            // pool 中的题目默认未掌握（因为没有 is_mastered 字段）
            return levelPool.length > 0 && levelPool.every(q => q.is_mastered === true)
          })
          
          if (allLevelsMastered) {
            masteredVariations++
          }
        })
      })

      const currentLevel = currentElo >= 2501 ? 'L4' : currentElo >= 1801 ? 'L3' : currentElo >= 1001 ? 'L2' : 'L1'
      
      let nextLevel = null
      let eloGap = 0
      
      if (currentLevel === 'L1' || currentLevel === 'L2') {
        nextLevel = currentElo >= 1001 ? 'L3' : 'L2'
        const targetElo = nextLevel === 'L2' ? 1001 : 1801
        eloGap = Math.max(0, targetElo - currentElo)
      } else if (currentLevel === 'L3') {
        nextLevel = 'L4'
        eloGap = Math.max(0, 2501 - currentElo)
      }

      return {
        currentLevel,
        nextLevel,
        eloGap,
        totalVariations,
        masteredVariations,
        progress: totalVariations > 0 ? (masteredVariations / totalVariations) * 100 : 0
      }
    }

    const promotionProgress = calculatePromotionProgress()
    const weapons = getWeaponsForMotif(detailData)

    return (
      <div className="space-y-6 mt-4">
        <div className={`p-5 rounded-2xl border ${isAcademicMode ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300' : 'bg-gradient-to-br from-emerald-900/30 to-green-900/30 border-emerald-600/50'}`}>
          <h3 className="flex items-center gap-2 font-bold mb-4 text-slate-700 dark:text-zinc-200 text-sm">
            <Sparkles size={18} className="text-emerald-500" /> 母题掌握情况
          </h3>
          <div className={`p-3 rounded-lg border ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold ${isAcademicMode ? 'text-indigo-700' : 'text-indigo-300'}`}>
                等级：<span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${isAcademicMode ? 'border-indigo-300 text-indigo-600' : 'border-indigo-500/50 text-indigo-400'}`}>{promotionProgress?.currentLevel || 'L1'}</span>
              </span>
              <span className={`font-bold ${isAcademicMode ? 'text-indigo-700' : 'text-indigo-300'}`}>Elo: {currentElo} 分</span>
              <span className={`font-bold ${isAcademicMode ? 'text-indigo-700' : 'text-indigo-300'}`}>变例通关：{promotionProgress?.masteredVariations || 0}/{promotionProgress?.totalVariations || 4} 个</span>
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${isAcademicMode ? 'bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200' : 'bg-gradient-to-br from-zinc-800/50 to-blue-900/20 border-zinc-700/50'}`}>
          <h3 className="flex items-center gap-2 font-bold mb-4 text-slate-700 dark:text-zinc-200 text-sm">
            <Target size={18} className="text-blue-500" /> 核心考点与变例矩阵
          </h3>
          <div className="space-y-4">
            {hasSpecialties ? detailData.specialties.map((spec, sIdx) => (
              <div key={sIdx} className={`p-4 rounded-xl border ${isAcademicMode ? 'bg-indigo-50/50 border-indigo-100' : 'bg-indigo-900/10 border-indigo-800/30'}`}>
                <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  {spec.spec_name}
                </h4>
                <div className="space-y-2">
                  {spec.variations?.map((v, vIdx) => (
                    <div key={vIdx} className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
                      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{v.name}</span>
                      <div className="flex gap-1.5">
                        {['L2', 'L3', 'L4'].map(lvl => {
                          const lightStyle = getLightStyleForVariation(lvl, v)
                          if (!lightStyle) return null
                          return (
                            <div key={lvl} className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${lightStyle}`}>
                              <div className={`w-1 h-1 rounded-full ${lightStyle.includes('white') ? 'bg-white animate-pulse' : 'bg-current opacity-30'}`} /> {lvl}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (detailData.specialties || []).length > 0 ? (
              detailData.specialties.flatMap((spec, sIdx) => 
                (spec.variations || []).map((v, vIdx) => (
                  <div key={`${sIdx}-${vIdx}`} className="flex justify-between p-3 border rounded-xl">
                    <span className="text-sm">{v.name}</span>
                    <span className="text-xs opacity-50">{spec.spec_name}</span>
                  </div>
                ))
              )
            ) : <p className="text-center text-slate-400 py-4">教研数据接入中...</p>}
          </div>
        </div>


      </div>
    )
  }

  return (
    <div className={`w-full h-full flex items-center justify-center relative ${isAcademicMode ? 'bg-slate-50' : 'bg-zinc-950'}`}>
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 backdrop-blur-sm rounded-lg p-4 border ${isAcademicMode ? 'bg-white/80 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: ringColors[0], backgroundColor: `${ringColors[0]}20` }}></div>
            <span className="text-sm font-medium" style={{ color: ringColors[0] }}>{ringLabels[0]}</span>
          </div>
          {showMiddleRing && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: ringColors[1], backgroundColor: `${ringColors[1]}20` }}></div>
              <span className="text-sm font-medium" style={{ color: ringColors[1] }}>{ringLabels[1]}</span>
            </div>
          )}
          {showInnerRing && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: ringColors[2], backgroundColor: `${ringColors[2]}20` }}></div>
              <span className="text-sm font-medium" style={{ color: ringColors[2] }}>{ringLabels[2]}</span>
            </div>
          )}
          <div className={`pt-3 mt-3 border-t ${isAcademicMode ? 'border-slate-200' : 'border-zinc-700'}`}>
            <div className="text-xs font-bold mb-2" style={{ color: textMuted }}>等级图例</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-600" />
                <span style={{ color: textMuted }}>L1  基础认知:  ≤1000</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                <span style={{ color: textColor }}>L2  熟练掌握:  1001-1800</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
                <span style={{ color: textColor }}>L3  迁移应用:  1801-2500</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                <span style={{ color: textColor }}>L4  融会贯通:  2501+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full max-w-[800px] max-h-[800px]"
        style={{ filter: `drop-shadow(0 0 20px ${isAcademicMode ? 'rgba(37, 99, 235, 0.1)' : 'rgba(16, 185, 129, 0.1)'})` }}
      >
        <defs>
          <radialGradient id="gridGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={highlightColorRgba} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="500" cy="500" r="480" fill="url(#gridGradient)" />

        <circle cx="500" cy="500" r="380" fill="none" stroke="rgba(52, 211, 153, 0.35)" strokeWidth="2" strokeDasharray="12,6" />
        
        {showMiddleRing && (
          <circle cx="500" cy="500" r="240" fill="none" stroke="rgba(96, 165, 250, 0.35)" strokeWidth="2" strokeDasharray="10,5" />
        )}
        
        {showInnerRing && (
          <circle cx="500" cy="500" r="100" fill="none" stroke="rgba(239, 68, 68, 0.45)" strokeWidth="3" strokeDasharray="6,4" />
        )}

        <line x1="500" y1="20" x2="500" y2="980" stroke={isAcademicMode ? 'rgba(100, 116, 139, 0.15)' : 'rgba(161, 161, 170, 0.15)'} strokeWidth="1" strokeDasharray="20,10" />
        <line x1="20" y1="500" x2="980" y2="500" stroke={isAcademicMode ? 'rgba(100, 116, 139, 0.15)' : 'rgba(161, 161, 170, 0.15)'} strokeWidth="1" strokeDasharray="20,10" />
        <line x1="150" y1="150" x2="850" y2="850" stroke={isAcademicMode ? 'rgba(37, 99, 235, 0.08)' : 'rgba(16, 185, 129, 0.08)'} strokeWidth="1" strokeDasharray="15,10" />
        <line x1="850" y1="150" x2="150" y2="850" stroke={isAcademicMode ? 'rgba(37, 99, 235, 0.08)' : 'rgba(16, 185, 129, 0.08)'} strokeWidth="1" strokeDasharray="15,10" />

        <circle cx="500" cy="500" r="12" fill={highlightColor} filter="url(#strongGlow)" />
        <circle cx="500" cy="500" r="28" fill="none" stroke={highlightColor} strokeWidth="2" opacity="0.5" />

        {targets.map((target, index) => {
          const isLocked = target.unlockStatus === 'locked'
          const decayStatus = getDecayStatus(target.specialties)
          const hasDecay = decayStatus.hasDecay
          const elo = target.elo_score || 800
          const gearLevelFromElo = elo > 2500 ? 'L4' : elo > 1800 ? 'L3' : elo > 1000 ? 'L2' : 'L1'
          const color = gearLevelColors[gearLevelFromElo] || gearLevelColors.L0
          const radius = isLocked ? 8 : 14
          const textOffset = 22

          return (
            <g
              key={`${target.target_id}-${index}`}
              onClick={() => !isLocked && handleTargetClick(target)}
              style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
              className={isLocked ? '' : 'hover:opacity-80 transition-opacity'}
            >
              {hasDecay && !isLocked && (
                <>
                  <circle cx={target.cx} cy={target.cy} r={radius + 12} fill="none" stroke="#f59e0b" strokeWidth="3" opacity="0.5" className="animate-pulse" />
                  <circle cx={target.cx} cy={target.cy} r={radius + 20} fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.3" className="animate-pulse" />
                </>
              )}
              <circle cx={target.cx} cy={target.cy} r={radius} fill={isLocked ? lockedColor : color} filter={isLocked ? 'none' : 'url(#glow)'} opacity={isLocked ? 0.3 : 1} />
              {!isLocked && (
                <>
                  <text x={target.cx + textOffset} y={target.cy - 8} textAnchor="start" fill={textColor} fontSize="16" fontFamily="sans-serif" fontWeight="bold">
                    {target.target_name}
                  </text>
                  <text x={target.cx + textOffset} y={target.cy + 12} textAnchor="start" fill={color} fontSize="14" fontFamily="monospace" fontWeight="bold">
                    {target.gear_level} {gearLevelLabels[target.gear_level]}
                  </text>
                  <text x={target.cx + textOffset} y={target.cy + 30} textAnchor="start" fill={textMuted} fontSize="12" fontFamily="monospace">
                    ELO {target.elo_score}/{LEVEL_THRESHOLDS[target.gear_level]?.max || 1000}
                  </text>
                  {(() => {
                    const currentLevel = target.gear_level
                    const thresholds = LEVEL_THRESHOLDS[currentLevel]
                    if (!thresholds) return null
                    const progress = Math.min(100, Math.max(0, ((target.elo_score - thresholds.min) / (thresholds.max - thresholds.min)) * 100))
                    const barWidth = 60
                    const barHeight = 4
                    const barX = target.cx + textOffset
                    const barY = target.cy + 40
                    
                    return (
                      <>
                        <rect x={barX} y={barY} width={barWidth} height={barHeight} fill={isAcademicMode ? '#e2e8f0' : '#27272a'} rx="2" />
                        <rect x={barX} y={barY} width={barWidth * progress / 100} height={barHeight} fill={color} rx="2" />
                      </>
                    )
                  })()}
                </>
              )}
              {isLocked && (
                <text x={target.cx} y={target.cy - 16} textAnchor="middle" fill={lockedTextColor} fontSize="12" fontFamily="monospace">
                  锁定
                </text>
              )}
            </g>
          )
        })}

        {targets.length === 0 && (
          <text x="500" y="500" textAnchor="middle" fill={isAcademicMode ? '#94a3b8' : '#52525b'} fontSize="14" fontFamily="sans-serif">
            暂无目标数据
          </text>
        )}
      </svg>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className={`backdrop-blur-sm rounded-lg p-3 border ${isAcademicMode ? 'bg-white/80 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'}`}>
          <div className="text-xs font-bold mb-2" style={{ color: isAcademicMode ? '#475569' : '#a1a1aa' }}>
            母题晋级规则
          </div>
          <div className={`space-y-1 text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            <p>🟢 该级别所有变例通关：连续3次训练题目答题正确</p>
            <p>🟢 该级别Elo分数达标</p>
            <p>🔴 导入错题不扣分，但该错题所属变例状态变红</p>
            <p>🔴 训练错题扣分，且该错题所属变例状态变红</p>
            <p>🔴 有任意变例未通关，elo得分最高不超过该级别上限分数</p>
          </div>
        </div>
      </div>

      <div className={`absolute top-4 right-4 backdrop-blur-sm rounded-lg p-2 border ${isAcademicMode ? 'bg-white/80 border-slate-200' : 'bg-zinc-900/80 border-zinc-800'}`}>
        <div className={`text-xs font-mono ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
          目标总数：<span className={isAcademicMode ? 'text-blue-600' : 'text-emerald-400'}>{targets.length}</span>
        </div>
      </div>

      {selectedTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div 
            className={`max-w-md mx-4 rounded-2xl border p-6 max-h-[80vh] overflow-hidden flex flex-col ${
              isAcademicMode ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100' : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700/50'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between mb-4 shrink-0 py-2 -mx-6 px-6 ${
              isAcademicMode ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gradient-to-r from-zinc-800 to-zinc-900'
            }`}>
              <h3 className={`text-xl font-bold ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                {selectedTarget.target_name}
              </h3>
              <button onClick={handleCloseModal} className={`p-1 rounded ${isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}>
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto -mx-6 px-6 pb-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                {hasChanges && previewSubTargets && (
                  <p className={`text-xs font-bold ${isAcademicMode ? 'text-blue-600' : 'text-emerald-400'}`}>
                    预估：{getLevelByElo(calculateElo(previewSubTargets))} · ELO {calculateElo(previewSubTargets)}
                  </p>
                )}
              </div>
              {renderDetailPanel()}
            </div>

            {syncAnimation && (
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
                <div className={`px-6 py-4 rounded-lg border ${
                  isAcademicMode ? 'bg-white border-emerald-200' : 'bg-zinc-900 border-emerald-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className={`font-bold ${isAcademicMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      🔄 学力数据同步中...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default HoloMap
