import { useState, useContext, useMemo } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { Lock, AlertTriangle, Crosshair, Shield, Skull, Heart, Zap, Map, RotateCcw, Sword, Sparkles, X } from 'lucide-react'
import { ThemeContext, GradeContext } from '../App'
import HoloMap from './HoloMap'
import LevelIndicator, { LevelIndicatorDetailed } from './LevelIndicator'
import strategyLib from '../data/strategy_lib.json'

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

const MOTIF_NAMES = {
  'M01': '集合、逻辑与复数',
  'M02': '不等式性质',
  'M03': '函数概念与性质',
  'M04': '指对数函数与运算',
  'M05': '平面向量',
  'M06': '三角函数基础',
  'M07': '解三角形综合',
  'M08': '数列基础与求和',
  'M09': '立体几何基础',
  'M10': '解析几何基础',
  'M11': '导数工具基础',
  'M12': '概率与统计综合',
  'M13': '解析几何综合压轴',
  'M14': '导数综合压轴',
  'M15': '数列综合压轴',
  'M16': '计数原理与二项式',
  'M17': '创新思维与情境',
}

const gearLevelLabels = {
  L0: '未解锁',
  L1: '基础',
  L2: '熟练',
  L3: '迁移',
  L4: '融会',
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

const getHealthIcon = (status, isAcademicMode) => {
  const highlightColor = isAcademicMode ? 'text-blue-600' : 'text-emerald-500'
  switch (status) {
    case 'healthy':
      return <Heart className={`w-4 h-4 ${highlightColor}`} />
    case 'bleeding':
      return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
    case 'unknown':
      return <Skull className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
    default:
      return null
  }
}

const getHealthText = (status, isAcademicMode) => {
  const highlightColor = isAcademicMode ? 'text-blue-600' : 'text-emerald-500'
  switch (status) {
    case 'healthy':
      return <span className={`${highlightColor} text-xs`}>状态良好</span>
    case 'bleeding':
      return <span className="text-red-500 text-xs animate-pulse">需强化</span>
    case 'unknown':
      return <span className="text-slate-400 dark:text-zinc-600 text-xs">未知状态</span>
    default:
      return null
  }
}

const getGearLevelColor = (level, isAcademicMode) => {
  if (isAcademicMode) {
    switch (level) {
      case 'L4':
        return 'text-amber-600'
      case 'L3':
        return 'text-purple-600'
      case 'L2':
        return 'text-blue-600'
      case 'L1':
        return 'text-gray-500'
      default:
        return 'text-slate-400'
    }
  }
  switch (level) {
    case 'L4':
      return 'text-amber-400'
    case 'L3':
      return 'text-purple-400'
    case 'L2':
      return 'text-blue-400'
    case 'L1':
      return 'text-gray-500'
    default:
      return 'text-zinc-600'
  }
}

const getLevelIcon = (level) => {
  switch (level) {
    case 'L4':
      return '👑'
    case 'L3':
      return '⭐'
    case 'L2':
      return '🎯'
    case 'L1':
      return '🔰'
    default:
      return '🔒'
  }
}

const formatMapName = (name, isAcademicMode) => {
  const cleanName = name.replace(/战区|农场|军械库|前线|决赛圈/g, '模块')
  return <span className="font-bold text-slate-900">{cleanName}</span>
}

const RadarTooltip = ({ active, payload, isAcademicMode }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const level = getLevelByElo(value)
    
    return (
      <div style={{
        backgroundColor: isAcademicMode ? '#ffffff' : '#18181b',
        borderColor: isAcademicMode ? '#e2e8f0' : '#27272a',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{
          color: isAcademicMode ? '#0f172a' : '#d4d4d8',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          {payload[0].payload.name}
        </p>
        <p style={{
          color: isAcademicMode ? '#64748b' : '#a1a1aa',
          fontSize: '12px'
        }}>
          {isAcademicMode ? '能力积分' : '能力积分'}: <span style={{ color: isAcademicMode ? '#2563eb' : '#10b981', fontWeight: 'bold' }}>{value} ({level})</span>
        </p>
      </div>
    )
  }
  return null
}

const SubTargetBadge = ({ sub, isAcademicMode, isLocked }) => {
  const displayName = sub.sub_name
  
  if (isLocked) {
    return (
      <span className={`text-xs px-2 py-1 rounded border opacity-50 ${
        isAcademicMode
          ? 'bg-slate-100 text-slate-400 border-slate-200'
          : 'bg-zinc-800 text-zinc-500 border-zinc-700'
      }`}>
        🔒 {displayName}
      </span>
    )
  }
  
  const statusColor = sub.is_mastered === true 
    ? isAcademicMode
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : sub.is_mastered === 'warning'
      ? isAcademicMode
        ? 'bg-amber-50 text-amber-600 border-amber-200'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : isAcademicMode
        ? 'bg-red-50 text-red-600 border-red-200'
        : 'bg-red-500/10 text-red-400 border-red-500/30'
  
  const statusIcon = sub.is_mastered === true ? '🟢' : sub.is_mastered === 'warning' ? '🟡' : '🔴'
  
  return (
    <span className={`text-xs px-2 py-1 rounded border ${statusColor}`}>
      {statusIcon} {displayName}
    </span>
  )
}

function TacticalDashboard({ tacticalData, onDeployToZone, currentGrade, onGlobalReset, onRecalculateElo, onCalibrate, onNavigate }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [calibrateTargetId, setCalibrateTargetId] = useState(null)
  const { isAcademicMode } = useContext(ThemeContext)

  const gradeOrder = { '高一': 1, '高二': 2, '高三': 3 }

  const { currentGradeEncounters, futureGradeEncounters } = useMemo(() => {
    if (!tacticalData?.tactical_maps) return { currentGradeEncounters: [], futureGradeEncounters: [] }
    
    const current = []
    const future = []
    
    tacticalData.tactical_maps.forEach(map => {
      map.encounters.forEach(encounter => {
        const grades = encounter.grades || []
        if (grades.includes(currentGrade)) {
          current.push({ ...encounter, mapName: map.map_name })
        } else {
          const minGrade = grades.reduce((min, g) => 
            (gradeOrder[g] || 999) < (gradeOrder[min] || 999) ? g : min, grades[0])
          future.push({ ...encounter, mapName: map.map_name, minGrade })
        }
      })
    })
    
    return { currentGradeEncounters: current, futureGradeEncounters: future }
  }, [tacticalData, currentGrade])

  const filteredMaps = useMemo(() => {
    if (!tacticalData?.tactical_maps) return []
    
    return tacticalData.tactical_maps.map(map => ({
      ...map,
      encounters: map.encounters.filter(encounter => 
        encounter.grades?.includes(currentGrade)
      )
    })).filter(map => map.encounters.length > 0)
  }, [tacticalData, currentGrade])

  const unlockedMaps = filteredMaps.filter((map) => map.unlock_status === 'unlocked')
  const lockedMaps = filteredMaps.filter((map) => map.unlock_status === 'locked')

  const handleCalibrateTarget = (targetId) => {
    setCalibrateTargetId(targetId)
  }

  const handleCalibrationComplete = () => {
    setCalibrateTargetId(null)
  }

  const radarData = unlockedMaps.flatMap((map) =>
    map.encounters.map((encounter) => ({
      name: encounter.target_name,
      value: encounter.elo_score,
      grades: encounter.grades || [],
      fullMark: 3000,
    }))
  )

  const colorMap = {}
  radarData.forEach(item => {
    if (item.grades.includes('高一')) {
      colorMap[item.name] = 'grade10'
    } else if (item.grades.includes('高二')) {
      colorMap[item.name] = 'grade11'
    } else {
      colorMap[item.name] = 'grade12'
    }
  })

  const CustomTick = ({ payload, x, y, textAnchor }) => {
    let fill = isAcademicMode ? '#64748b' : '#a1a1aa'
    const grade = colorMap[payload.value]
    
    if (grade === 'grade10') {
      fill = '#34d399'
    } else if (grade === 'grade11') {
      fill = '#60a5fa'
    } else if (grade === 'grade12') {
      fill = '#ef4444'
    }

    return (
      <text x={x} y={y} textAnchor={textAnchor} fill={fill} fontSize="11" fontFamily="sans-serif" fontWeight="600">
        {payload.value}
      </text>
    )
  }

  const handleTargetClick = (target, mapName) => {
    if (onDeployToZone) {
      onDeployToZone(target, mapName)
    }
  }

  const highlightColor = isAcademicMode ? '#2563eb' : '#10b981'

  const radarDomain = [0, 3000]
  const radarTicks = [1000, 1800, 2500]

  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={radarData}>
        <PolarGrid stroke={isAcademicMode ? "#cbd5e1" : "#3f3f46"} />
        <PolarAngleAxis dataKey="name" tick={<CustomTick />} />
        <PolarRadiusAxis 
          angle={30} 
          domain={radarDomain} 
          tickCount={4}
          tick={({ payload, x, y }) => {
            const levelLabels = { 1000: 'L1', 1800: 'L2', 2500: 'L3', 3000: 'L4' }
            const label = levelLabels[payload.value] || ''
            if (!label) return null
            return (
              <text x={x} y={y} fill={isAcademicMode ? "#94a3b8" : "#71717a"} fontSize="10" textAnchor="middle">
                {label}
              </text>
            )
          }}
        />
        <Radar
          name="能力积分"
          dataKey="value"
          stroke={highlightColor}
          fill={highlightColor}
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip content={<RadarTooltip isAcademicMode={isAcademicMode} />} />
      </RadarChart>
    </ResponsiveContainer>
  )

  const getLevelStatus = (subs) => {
    if (!subs || subs.length === 0) return 'none'
    const allGreen = subs.every(s => s.is_mastered === true)
    const hasWarning = subs.some(s => s.is_mastered === 'warning')
    const hasRed = subs.some(s => s.is_mastered === false) || subs.some(s => s.is_mastered === undefined)
    
    if (allGreen) return 'mastered'
    if (hasWarning) return 'warning'
    if (hasRed) return 'locked'
    return 'none'
  }

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'mastered': return 'bg-emerald-500'
      case 'warning': return 'bg-amber-500'
      case 'locked': return 'bg-red-500'
      default: return 'bg-slate-300'
    }
  }

  const getRelatedWeapons = (targetId) => {
    const related = []
    strategyLib.categories.forEach(category => {
      category.weapons.forEach(weapon => {
        const motifId = CATEGORY_TO_MOTIF[category.id]
        if (motifId === targetId) {
          related.push({
            name: weapon.name,
            id: weapon.id,
            category: category.name
          })
        }
      })
    })
    return related
  }

  const handleGoToTraining = (targetId, e) => {
    e.stopPropagation()
    if (onNavigate) {
      onNavigate('training')
    }
  }

  const handleGoToFormula = (formulaId, e) => {
    e.stopPropagation()
    if (onNavigate) {
      onNavigate('formula', formulaId)
    }
  }

  const renderListView = () => null

  return (
    <div className="h-full bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 overflow-y-auto">
      <div className="w-full px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className={`w-6 h-6 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-500'}`} />
            <h1 className={`text-xl font-bold ${isAcademicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
              数学知识图谱
            </h1>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${
              currentGrade === '高三' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
              currentGrade === '高二' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
              'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
            }`}>
              {currentGrade}
            </span>
          </div>
        </header>

        <div className="space-y-4">
          <div className={`w-full aspect-square md:aspect-video rounded-lg border overflow-hidden relative ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-950 border-zinc-800'}`}>
            <HoloMap 
              tacticalData={tacticalData} 
              onDeploy={onDeployToZone} 
              currentGrade={currentGrade}
              onRecalculateElo={onRecalculateElo}
              calibrateTargetId={calibrateTargetId}
              onCalibrationComplete={handleCalibrationComplete}
            />
          </div>

          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className={`w-4 h-4 ${isAcademicMode ? 'text-blue-600' : 'text-emerald-500'}`} />
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                {isAcademicMode ? '能力分析' : '能力雷达'}
              </h2>
            </div>
            <div className={`rounded-lg border p-4 ${isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-800'}`}>
              {radarData.length > 0 ? (
                renderRadarChart()
              ) : (
                <div className={`h-[350px] flex items-center justify-center text-sm ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                  暂无数据
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`max-w-md mx-4 rounded-lg border p-6 ${
            isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${isAcademicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
              ⚠️ 确认初始化？
            </h3>
            <p className={`text-sm mb-4 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
              此操作将：
            </p>
            <ul className={`text-sm mb-4 space-y-1 ${isAcademicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
              <li>• 所有母题 ELO 重置为 800</li>
              <li>• 所有等级重置为 L1</li>
              <li>• 所有变式指标重置为未掌握</li>
            </ul>
            <p className="text-sm text-red-500 mb-6">
              此操作不可撤销！
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  isAcademicMode
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                取消
              </button>
              <button
                onClick={() => {
                  onGlobalReset()
                  setShowResetConfirm(false)
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600"
              >
                确认初始化
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TacticalDashboard
