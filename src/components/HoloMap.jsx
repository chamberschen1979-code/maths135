import { useMemo, useContext, useState, useEffect } from 'react'
import { Target, BookOpen, Sparkles, AlertTriangle } from 'lucide-react'
import { ThemeContext } from '../App'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import strategyLib from '../data/strategy_lib.json'

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
    '2.2': ['L2', 'L3', 'L4'],
    '3.1': ['L2', 'L3'],
    '3.2': ['L2', 'L3'],
  },
  M02: {
    '1.1': ['L2', 'L3'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M03: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M04: {
    '1.1': ['L2', 'L3'],
    '1.2': ['L2', 'L3', 'L4'],
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
    '1.2': ['L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M08: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M09: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L3', 'L4'],
  },
  M10: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L3', 'L4'],
    '3.1': ['L2', 'L3', 'L4'],
    '3.2': ['L2', 'L3', 'L4'],
  },
  M11: {
    '1.1': ['L2', 'L3', 'L4'],
    '1.2': ['L2', 'L3', 'L4'],
    '2.1': ['L2', 'L3', 'L4'],
    '2.2': ['L2', 'L3', 'L4'],
  },
  M12: {
    '1.1': ['L3', 'L4'],
    '1.2': ['L3', 'L4'],
    '2.1': ['L3', 'L4'],
    '2.2': ['L2', 'L3'],
    '3.1': ['L2', 'L3', 'L4'],
    '3.2': ['L3', 'L4'],
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

const getWeaponFromStrategyLib = (weaponId) => {
  if (!strategyLib || !strategyLib.categories) return null
  
  for (const category of strategyLib.categories) {
    const weapon = category.weapons?.find(w => w.id === weaponId)
    if (weapon) {
      return {
        id: weapon.id,
        name: weapon.name,
        rank: weapon.rank,
        logicFlow: weapon.logic_flow,
        description: weapon.description,
        triggerKeywords: weapon.trigger_keywords,
        categoryName: category.name
      }
    }
  }
  
  return null
}

const getWeaponsForMotif = (motifData) => {
  if (!motifData || !motifData.specialties) return []
  
  const weaponIds = []
  motifData.specialties.forEach(spec => {
    spec.variations?.forEach(v => {
      if (v.toolkit?.linked_weapons) {
        v.toolkit.linked_weapons.forEach(wId => {
          if (!weaponIds.includes(wId)) {
            weaponIds.push(wId)
          }
        })
      }
    })
  })
  
  return weaponIds.map(id => getWeaponFromStrategyLib(id)).filter(w => w !== null)
}

function HoloMap({ tacticalData, motifData, onDeploy, currentGrade, onRecalculateElo, calibrateTargetId, onCalibrationComplete }) {
  const { isAcademicMode } = useContext(ThemeContext)
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [previewSpecialties, setPreviewSpecialties] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [syncAnimation, setSyncAnimation] = useState(false)
  const [loadedMotifData, setLoadedMotifData] = useState(null)

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

  const loadMotifDataAsync = async (motifId) => {
    try {
      const response = await fetch(`/src/data/${motifId}.json`)
      if (response.ok) {
        const data = await response.json()
        setLoadedMotifData(data)
      }
    } catch (error) {
      console.warn(`Failed to load ${motifId}.json:`, error)
    }
  }

  useEffect(() => {
    if (calibrateTargetId && targets.length > 0) {
      const target = targets.find(t => t.target_id === calibrateTargetId)
      if (target && target.unlockStatus === 'unlocked') {
        setSelectedTarget(target)
        setPreviewSpecialties(target.specialties ? JSON.parse(JSON.stringify(target.specialties)) : null)
        setHasChanges(false)
        
        if (motifData && motifData[calibrateTargetId]) {
          setLoadedMotifData(motifData[calibrateTargetId])
        } else {
          loadMotifDataAsync(calibrateTargetId)
        }
      }
    }
  }, [calibrateTargetId, targets, motifData])

  const handleTargetClick = (target) => {
    if (target.unlockStatus === 'unlocked') {
      setSelectedTarget(target)
      setPreviewSpecialties(target.specialties ? JSON.parse(JSON.stringify(target.specialties)) : null)
      setHasChanges(false)
      
      if (motifData && motifData[target.target_id]) {
        setLoadedMotifData(motifData[target.target_id])
      } else {
        loadMotifDataAsync(target.target_id)
      }
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
            v.master_benchmarks?.forEach(b => {
              if (b.level === lvl) {
                benchmarksForLevel.push(b)
              }
            })
          }
        })
      })
      
      if (benchmarksForLevel.length === 0) {
        return 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800/50 dark:text-zinc-600 dark:border-zinc-700'
      }
      
      const allGreen = benchmarksForLevel.every(b => b.is_mastered === true)
      const hasRed = benchmarksForLevel.some(b => b.is_mastered === false)
      
      if (allGreen) {
        return 'bg-emerald-500 text-white border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
      }
      if (hasRed) {
        return 'bg-red-500 text-white border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
      }
      return 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-zinc-800/50 dark:text-zinc-600 dark:border-zinc-700'
    }

    const calculatePromotionProgress = () => {
      if (!hasSpecialties) return null
      
      let totalVariations = 0
      let masteredVariations = 0
      
      const specialties = previewSpecialties || selectedTarget?.specialties || []
      const motifId = detailData.motif_id
      
      specialties.forEach(spec => {
        spec.variations?.forEach(variation => {
          totalVariations++
          
          const varId = variation.var_id
          const levels = getVariationLevels(motifId, varId)
          
          if (levels.length === 0) return
          
          const allLevelsMastered = levels.every(lvl => {
            const benchmarks = (variation.master_benchmarks || []).filter(b => b.level === lvl)
            return benchmarks.length > 0 && benchmarks.every(b => b.is_mastered === true)
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

        {weapons.length > 0 && (
          <div className={`mt-6 p-5 rounded-2xl border ${
            isAcademicMode 
              ? 'bg-gradient-to-br from-slate-50 to-indigo-50 border-indigo-200' 
              : 'bg-gradient-to-br from-zinc-800/80 to-indigo-900/20 border-indigo-500/30'
          }`}>
            <h3 className="flex items-center gap-2 font-bold mb-4 text-slate-700 dark:text-zinc-200 text-sm">
              <BookOpen size={18} className="text-indigo-500" /> 
              核心武器库
            </h3>

            <div className="space-y-3">
              {weapons.map((weapon) => (
                <div 
                  key={weapon.id} 
                  className={`group relative p-3 rounded-xl border transition-all duration-300 ${
                    isAcademicMode 
                      ? 'bg-white border-slate-200 shadow-sm hover:shadow-md' 
                      : 'bg-zinc-800 border-zinc-700 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-black px-1.5 py-0.5 rounded ${
                          isAcademicMode
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-indigo-900/40 text-indigo-300'
                        }`}>
                          {weapon.id}
                        </span>
                        <h4 className={`font-bold text-sm ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
                          {weapon.name}
                        </h4>
                      </div>
                      
                      <p className={`text-xs leading-relaxed ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                        {weapon.description}
                      </p>

                      {weapon.triggerKeywords && weapon.triggerKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {weapon.triggerKeywords.slice(0, 5).map((kw, idx) => (
                            <span
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                isAcademicMode 
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`mt-3 text-[10px] text-center ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
              数据来源：strategy_lib.json
            </div>
          </div>
        )}
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
                <span style={{ color: textMuted }}>L1: 100-1000分</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
                <span style={{ color: textColor }}>L2: 1001-1800</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
                <span style={{ color: textColor }}>L3: 1801-2500</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                <span style={{ color: textColor }}>L4: 2501+</span>
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
          const color = gearLevelColors[target.gear_level] || gearLevelColors.L0
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
