import { useMemo } from 'react'
import scoringEngine from '../data/scoringEngine.json'

const LEVEL_SCORES = scoringEngine.level_scores

const STATUS_CONFIG = {
  mastered: {
    color: '#10b981',
    label: '已攻克',
    glow: true,
    pulse: false
  },
  practicing: {
    color: '#fbbf24',
    label: '磨合中',
    glow: false,
    pulse: true
  },
  locked: {
    color: '#6b7280',
    label: '未解锁',
    glow: false,
    pulse: false
  }
}

const DEFAULT_LEVEL_ORDER = ['L2', 'L3', 'L4']

const CEILING_MAP = {
  'L2': ['L2'],
  'L3': ['L2', 'L3'],
  'L4': ['L2', 'L3', 'L4']
}

const getIndicatorStatus = (level, subTargets) => {
  if (!subTargets || subTargets.length === 0) {
    return 'locked'
  }
  
  const levelTargets = subTargets.filter(sub => sub.level_req === level)
  
  if (levelTargets.length === 0) {
    return 'locked'
  }
  
  const allMastered = levelTargets.every(sub => sub.is_mastered === true)
  const someFailed = levelTargets.some(sub => sub.is_mastered === false)
  const somePracticing = levelTargets.some(sub => sub.is_mastered === 'warning')
  
  if (allMastered) {
    return 'mastered'
  }
  
  if (someFailed) {
    return 'practicing'
  }
  
  if (somePracticing) {
    return 'practicing'
  }
  
  const hasAttempt = levelTargets.some(sub => sub.last_practice !== null)
  return hasAttempt ? 'practicing' : 'locked'
}

const LevelIndicator = ({ 
  subTargets, 
  compact = false, 
  showScore = false,
  showLabels = false,
  size = 'default',
  difficultyCeiling = 'L4',
  motifId = null,
  masteryData = null
}) => {
  const levelOrder = CEILING_MAP[difficultyCeiling] || DEFAULT_LEVEL_ORDER
  
  const indicators = useMemo(() => {
    return levelOrder.map(level => {
      const status = masteryData 
        ? masteryData[level] || 'locked'
        : getIndicatorStatus(level, subTargets)
      const config = STATUS_CONFIG[status]
      const score = LEVEL_SCORES[level]
      
      return {
        level,
        status,
        color: config.color,
        label: config.label,
        glow: config.glow,
        pulse: config.pulse,
        score: score?.score || 0,
        description: score?.description || ''
      }
    })
  }, [subTargets, masteryData, levelOrder])

  const sizeClasses = {
    small: 'w-2 h-2',
    default: 'w-3 h-3',
    large: 'w-4 h-4'
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {indicators.map(indicator => (
          <div
            key={indicator.level}
            className={`${sizeClasses[size]} rounded-full transition-all duration-300 cursor-pointer relative group ${indicator.pulse ? 'animate-pulse' : ''}`}
            style={{ 
              backgroundColor: indicator.color,
              boxShadow: indicator.glow ? `0 0 8px ${indicator.color}` : 'none'
            }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#fff'
              }}
            >
              {indicator.level}: {indicator.label}
              {showScore && ` (${indicator.score}分)`}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {indicators.map(indicator => (
        <div key={indicator.level} className="flex items-center gap-1.5 relative group">
          <div
            className={`${sizeClasses[size]} rounded-full transition-all duration-300 cursor-pointer ${indicator.pulse ? 'animate-pulse' : ''}`}
            style={{ 
              backgroundColor: indicator.color,
              boxShadow: indicator.glow ? `0 0 10px ${indicator.color}` : 'none'
            }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: '#fff'
              }}
            >
              {indicator.level}: {indicator.label}
              {showScore && ` (${indicator.score}分)`}
            </div>
          </div>
          {showLabels && (
            <span className="text-xs font-medium" style={{ color: indicator.color }}>
              {indicator.level}
            </span>
          )}
          {showScore && (
            <span className="text-xs text-gray-500">
              {indicator.score}分
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export const LevelIndicatorDetailed = ({ 
  subTargets, 
  motifName,
  difficultyCeiling = 'L4',
  masteryData = null
}) => {
  const levelOrder = CEILING_MAP[difficultyCeiling] || DEFAULT_LEVEL_ORDER
  
  const indicators = useMemo(() => {
    return levelOrder.map(level => {
      const status = masteryData 
        ? masteryData[level] || 'locked'
        : getIndicatorStatus(level, subTargets)
      const config = STATUS_CONFIG[status]
      const score = LEVEL_SCORES[level]
      
      return {
        level,
        status,
        color: config.color,
        label: config.label,
        glow: config.glow,
        pulse: config.pulse,
        description: score?.description || '',
        score: score?.score || 0
      }
    })
  }, [subTargets, masteryData, levelOrder])

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-gray-500 mb-2">
        等级状态 {difficultyCeiling !== 'L4' && <span className="text-gray-400">(上限: {difficultyCeiling})</span>}
      </div>
      {indicators.map(indicator => (
        <div 
          key={indicator.level} 
          className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${indicator.pulse ? 'animate-pulse' : ''}`}
              style={{ 
                backgroundColor: indicator.color,
                boxShadow: indicator.glow ? `0 0 8px ${indicator.color}` : 'none'
              }}
            />
            <span className="font-medium text-sm">{indicator.level}</span>
            <span className="text-xs text-gray-500">{indicator.description}</span>
          </div>
          <div className="flex items-center gap-2">
            <span 
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{ 
                color: indicator.color,
                backgroundColor: `${indicator.color}20`
              }}
            >
              {indicator.label}
            </span>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
              {indicator.score}分
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export const calculateTotalScore = (levels, difficultyCeiling = 'L4') => {
  if (!Array.isArray(levels)) {
    levels = [levels]
  }
  
  const validLevels = CEILING_MAP[difficultyCeiling] || DEFAULT_LEVEL_ORDER
  const filteredLevels = levels.filter(l => validLevels.includes(l))
  
  return filteredLevels.reduce((sum, level) => {
    return sum + (LEVEL_SCORES[level]?.score || 0)
  }, 0)
}

export const getLevelStatus = (level, subTargets) => {
  return getIndicatorStatus(level, subTargets)
}

export default LevelIndicator
